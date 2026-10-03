import type { CustomCanvasData, Transform, ElementTransform } from "./types.js";

export type { Transform, ElementTransform };

export type KeyframeProperty =
  | "x"
  | "y"
  | "width"
  | "height"
  | "rotation"
  | "scaleX"
  | "scaleY"
  | "anchorX"
  | "anchorY"
  | "opacity"
  | "blur"
  | "brightness"
  | "saturation"
  | "contrast"
  | "fontSize"
  | "letterSpacing"
  | "lineHeight"
  | "color"
  | "backgroundColor"
  | "glowBlur"
  | "glowColor"
  | "textShadow";

export type EasingType =
  | "ease-in-out"
  | "linear"
  | "ease-in"
  | "ease-out"
  | "bounce"
  | "elastic"
  | "spring";

export interface Keyframe {
  id?: string;
  time: number;
  easing?: EasingType;

  // Position
  x?: number;
  y?: number;

  // Transform
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  anchorX?: number;
  anchorY?: number;
  transform?: Partial<Transform>;

  // Appearance
  opacity?: number;
  blur?: number;
  brightness?: number;
  saturation?: number;
  contrast?: number;

  // Color & Glow
  color?: string;
  backgroundColor?: string;
  glowColor?: string;
  glowBlur?: number;

  // Typography
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: string;
}

export interface Track {
  elementId: string;
  keyframes: Keyframe[];
}

export const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
export const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

export function applyEasing(t: number, easing: EasingType = "ease-in-out"): number {
  const clamped = clamp(t, 0, 1);
  switch (easing) {
    case "linear":
      return clamped;
    case "ease-in":
      return clamped * clamped;
    case "ease-out":
      return clamped * (2 - clamped);
    case "bounce": {
      const c4 = (2 * Math.PI) / 3;
      return clamped === 0
        ? 0
        : clamped === 1
        ? 1
        : Math.pow(2, -10 * clamped) * Math.sin((clamped * 10 - 0.75) * c4) + 1;
    }
    case "elastic": {
      if (clamped === 0) return 0;
      if (clamped === 1) return 1;
      const p = 0.3;
      const s = p / 4;
      return Math.pow(2, -10 * clamped) * Math.sin(((clamped - s) * (2 * Math.PI)) / p) + 1;
    }
    case "spring": {
      return clamped === 0
        ? 0
        : clamped === 1
        ? 1
        : Math.sin(clamped * Math.PI * (0.2 + 2.5 * clamped * clamped * clamped)) * Math.pow(1 - clamped, 2.2) + clamped;
    }
    case "ease-in-out":
    default:
      return clamped * clamped * (3 - 2 * clamped);
  }
}

export function parseTemplateString(input: string | undefined, vars?: Record<string, string>): string {
  if (!input) return "";
  if (!vars) return input;
  return input.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key];
    }
    return match;
  });
}

function getNumericProp(k: Keyframe, p: KeyframeProperty): number | undefined {
  const direct = (k as any)[p];
  if (typeof direct === "number" && !isNaN(direct)) return direct;
  if (k.transform && typeof (k.transform as any)[p] === "number" && !isNaN((k.transform as any)[p])) {
    return (k.transform as any)[p];
  }
  return undefined;
}

export function propertyValue(
  track: Track | undefined,
  time: number,
  p: KeyframeProperty,
  fallback: number
): number {
  if (!track || !track.keyframes.length) return fallback;
  const f = [...track.keyframes].sort((a, b) => a.time - b.time);
  if (time <= f[0].time) return getNumericProp(f[0], p) ?? fallback;
  if (time >= f[f.length - 1].time) return getNumericProp(f[f.length - 1], p) ?? fallback;

  const i = f.findIndex((x) => x.time >= time);
  const a = f[i - 1];
  const b = f[i];
  const valA = getNumericProp(a, p) ?? fallback;
  const valB = getNumericProp(b, p) ?? fallback;

  const normalized = (time - a.time) / Math.max(1, b.time - a.time);
  const eased = applyEasing(normalized, b.easing ?? "ease-in-out");
  return lerp(valA, valB, eased);
}

function parseRgbaColor(str: string): [number, number, number, number] | null {
  if (!str) return null;
  const s = str.trim().toLowerCase();
  if (s.startsWith("#")) {
    let hex = s.slice(1);
    if (hex.length === 3) hex = hex.split("").map((c) => c + c).join("");
    if (hex.length === 6) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        1,
      ];
    }
    if (hex.length === 8) {
      return [
        parseInt(hex.slice(0, 2), 16),
        parseInt(hex.slice(2, 4), 16),
        parseInt(hex.slice(4, 6), 16),
        parseInt(hex.slice(6, 8), 16) / 255,
      ];
    }
  }
  const rgbaMatch = s.match(/rgba?\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)(?:\s*,\s*([\d.]+))?\s*\)/);
  if (rgbaMatch) {
    return [
      parseInt(rgbaMatch[1], 10),
      parseInt(rgbaMatch[2], 10),
      parseInt(rgbaMatch[3], 10),
      rgbaMatch[4] !== undefined ? parseFloat(rgbaMatch[4]) : 1,
    ];
  }
  return null;
}

export function lerpColor(c1Str: string, c2Str: string, t: number): string {
  const c1 = parseRgbaColor(c1Str);
  const c2 = parseRgbaColor(c2Str);
  if (!c1 || !c2) return t < 0.5 ? c1Str : c2Str;
  const r = Math.round(lerp(c1[0], c2[0], t));
  const g = Math.round(lerp(c1[1], c2[1], t));
  const b = Math.round(lerp(c1[2], c2[2], t));
  const a = Number(lerp(c1[3], c2[3], t).toFixed(3));
  if (a >= 1) {
    const toHex = (n: number) => n.toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  return `rgba(${r}, ${g}, ${b}, ${a})`;
}

export function propertyColorValue(
  track: Track | undefined,
  time: number,
  p: "color" | "backgroundColor" | "glowColor",
  fallback: string | undefined
): string | undefined {
  if (!track || !track.keyframes.length) return fallback;
  const keyframesWithColor = track.keyframes.filter((k) => typeof (k as any)[p] === "string");
  if (!keyframesWithColor.length) return fallback;

  const f = [...keyframesWithColor].sort((a, b) => a.time - b.time);
  if (time <= f[0].time) return (f[0] as any)[p] ?? fallback;
  if (time >= f[f.length - 1].time) return (f[f.length - 1] as any)[p] ?? fallback;

  const i = f.findIndex((x) => x.time >= time);
  const a = f[i - 1];
  const b = f[i];
  const colA = (a as any)[p] ?? fallback;
  const colB = (b as any)[p] ?? fallback;
  if (!colA || !colB) return colB || colA || fallback;

  const normalized = (time - a.time) / Math.max(1, b.time - a.time);
  const eased = applyEasing(normalized, b.easing ?? "ease-in-out");
  return lerpColor(colA, colB, eased);
}

export function propertyStringValue(
  track: Track | undefined,
  time: number,
  p: "textShadow",
  fallback: string | undefined
): string | undefined {
  if (!track || !track.keyframes.length) return fallback;
  const keyframesWithProp = track.keyframes.filter((k) => typeof (k as any)[p] === "string" && (k as any)[p] !== undefined);
  if (!keyframesWithProp.length) return fallback;

  const f = [...keyframesWithProp].sort((a, b) => a.time - b.time);
  if (time <= f[0].time) return (f[0] as any)[p] ?? fallback;
  if (time >= f[f.length - 1].time) return (f[f.length - 1] as any)[p] ?? fallback;

  const i = f.findIndex((x) => x.time >= time);
  const a = f[i - 1];
  const b = f[i];
  const valA = (a as any)[p] ?? fallback;
  const valB = (b as any)[p] ?? fallback;
  if (!valA || !valB) return valB || valA || fallback;

  const normalized = (time - a.time) / Math.max(1, b.time - a.time);
  const eased = applyEasing(normalized, b.easing ?? "ease-in-out");
  return eased < 0.5 ? valA : valB;
}

function hasKeyframeProp(track: Track | undefined, p: string): boolean {
  if (!track || !track.keyframes) return false;
  return track.keyframes.some((k) => (k as any)[p] !== undefined || (k.transform && (k.transform as any)[p] !== undefined));
}

export function buildFrame(
  canvas: CustomCanvasData,
  tracks: Track[],
  time: number
): CustomCanvasData {
  return {
    ...canvas,
    elements: canvas.elements.map((e) => {
      const t = tracks.find((x) => x.elementId === e.id);

      // Position
      const x = Math.round(propertyValue(t, time, "x", e.transform?.x ?? e.x));
      const y = Math.round(propertyValue(t, time, "y", e.transform?.y ?? e.y));

      // Transform
      const width = Math.round(propertyValue(t, time, "width", e.transform?.width ?? e.width));
      const height = Math.round(propertyValue(t, time, "height", e.transform?.height ?? e.height));
      const rotation = Number(propertyValue(t, time, "rotation", e.transform?.rotation ?? e.rotation ?? 0).toFixed(2));
      const scaleX = Number(propertyValue(t, time, "scaleX", e.transform?.scaleX ?? e.scaleX ?? 1).toFixed(3));
      const scaleY = Number(propertyValue(t, time, "scaleY", e.transform?.scaleY ?? e.scaleY ?? 1).toFixed(3));
      const anchorX = Number(propertyValue(t, time, "anchorX", e.transform?.anchorX ?? e.anchorX ?? 0.5).toFixed(3));
      const anchorY = Number(propertyValue(t, time, "anchorY", e.transform?.anchorY ?? e.anchorY ?? 0.5).toFixed(3));

      // Appearance
      const opacity = Number(propertyValue(t, time, "opacity", e.opacity ?? 1).toFixed(3));
      const blur = (e.blur !== undefined || hasKeyframeProp(t, "blur"))
        ? Number(propertyValue(t, time, "blur", e.blur ?? 0).toFixed(2))
        : e.blur;
      const brightness = (e.brightness !== undefined || hasKeyframeProp(t, "brightness"))
        ? Math.round(propertyValue(t, time, "brightness", e.brightness ?? 100))
        : e.brightness;
      const saturation = (e.saturation !== undefined || hasKeyframeProp(t, "saturation"))
        ? Math.round(propertyValue(t, time, "saturation", e.saturation ?? 100))
        : e.saturation;
      const contrast = (e.contrast !== undefined || hasKeyframeProp(t, "contrast"))
        ? Math.round(propertyValue(t, time, "contrast", e.contrast ?? 100))
        : e.contrast;

      // Typography
      const fontSize = (e.fontSize !== undefined || hasKeyframeProp(t, "fontSize"))
        ? Math.round(propertyValue(t, time, "fontSize", e.fontSize ?? 24))
        : e.fontSize;
      const letterSpacing = (e.letterSpacing !== undefined || hasKeyframeProp(t, "letterSpacing"))
        ? Number(propertyValue(t, time, "letterSpacing", e.letterSpacing ?? 0).toFixed(2))
        : e.letterSpacing;
      const lineHeight = (e.lineHeight !== undefined || hasKeyframeProp(t, "lineHeight"))
        ? Number(propertyValue(t, time, "lineHeight", e.lineHeight ?? 1.2).toFixed(2))
        : e.lineHeight;
      const textShadow = (e.textShadow !== undefined || hasKeyframeProp(t, "textShadow"))
        ? propertyStringValue(t, time, "textShadow", e.textShadow)
        : e.textShadow;

      // Color & Glow
      const color = propertyColorValue(t, time, "color", e.color);
      const backgroundColor = propertyColorValue(t, time, "backgroundColor", e.backgroundColor);
      const glowColor = propertyColorValue(t, time, "glowColor", e.glowColor);
      const glowBlur = (e.glowBlur !== undefined || hasKeyframeProp(t, "glowBlur"))
        ? Math.round(propertyValue(t, time, "glowBlur", e.glowBlur ?? 16))
        : e.glowBlur;

      // Unified Transform object
      const transform: Transform = {
        x,
        y,
        width,
        height,
        rotation,
        scaleX,
        scaleY,
        anchorX,
        anchorY,
      };

      return {
        ...e,
        x,
        y,
        width,
        height,
        rotation,
        scaleX,
        scaleY,
        anchorX,
        anchorY,
        transform,
        opacity,
        blur,
        brightness,
        saturation,
        contrast,
        fontSize,
        letterSpacing,
        lineHeight,
        textShadow,
        color,
        backgroundColor,
        glowColor,
        glowBlur,
      };
    }),
  };
}

export function compileTimelineToFrames(options: {
  canvas: CustomCanvasData;
  tracks: Track[];
  duration?: number;
  fps?: number;
  templateVariables?: Record<string, string>;
}): { frames: CustomCanvasData[]; delays: number[]; frameDelay: number } {
  const duration = Math.max(100, options.duration ?? 1500);
  const fps = Math.max(1, Math.min(60, options.fps ?? 12));
  const frameDelay = Math.max(10, Math.round(1000 / fps));
  const frameCount = Math.max(1, Math.ceil(duration / (1000 / fps)));
  const delays = Array.from({ length: frameCount }, () => frameDelay);

  const frames = Array.from({ length: frameCount }, (_, i) => {
    const time = Math.min(duration - 1, Math.round((i * 1000) / fps));
    const raw = buildFrame(options.canvas, options.tracks, time);
    if (!options.templateVariables) {
      return raw;
    }
    return {
      ...raw,
      title: parseTemplateString(raw.title, options.templateVariables),
      backgroundImageUrl: raw.backgroundImageUrl
        ? parseTemplateString(raw.backgroundImageUrl, options.templateVariables)
        : undefined,
      elements: raw.elements.map((el) => ({
        ...el,
        content: el.content ? parseTemplateString(el.content, options.templateVariables) : undefined,
        imageUrl: el.imageUrl ? parseTemplateString(el.imageUrl, options.templateVariables) : undefined,
      })),
    };
  });

  return { frames, delays, frameDelay };
}
