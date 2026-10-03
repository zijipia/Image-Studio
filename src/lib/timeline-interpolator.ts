import type { CustomCanvasData } from "./types.js";

export type KeyframeProperty = "x" | "y" | "width" | "height" | "opacity";
export type EasingType = "ease-in-out" | "linear" | "ease-in" | "ease-out" | "bounce";

export interface Keyframe {
  id?: string;
  time: number;
  easing?: EasingType;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
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

export function propertyValue(
  track: Track | undefined,
  time: number,
  p: KeyframeProperty,
  fallback: number
): number {
  if (!track || !track.keyframes.length) return fallback;
  const f = [...track.keyframes].sort((a, b) => a.time - b.time);
  if (time <= f[0].time) return f[0][p] ?? fallback;
  if (time >= f[f.length - 1].time) return f[f.length - 1][p] ?? fallback;

  const i = f.findIndex((x) => x.time >= time);
  const a = f[i - 1];
  const b = f[i];
  const normalized = (time - a.time) / Math.max(1, b.time - a.time);
  const eased = applyEasing(normalized, b.easing ?? "ease-in-out");
  return lerp(a[p] ?? fallback, b[p] ?? fallback, eased);
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
      return {
        ...e,
        x: Math.round(propertyValue(t, time, "x", e.x)),
        y: Math.round(propertyValue(t, time, "y", e.y)),
        width: Math.round(propertyValue(t, time, "width", e.width)),
        height: Math.round(propertyValue(t, time, "height", e.height)),
        opacity: Number(propertyValue(t, time, "opacity", e.opacity ?? 1).toFixed(3)),
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
