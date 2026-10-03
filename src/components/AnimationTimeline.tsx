import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { CustomCanvasData, CustomElement, CustomElementType } from "../lib/types";
import {
  Film,
  Play,
  Pause,
  Plus,
  Trash2,
  Copy,
  Download,
  Code2,
  Type,
  ImagePlus,
  Box,
  Gauge,
  Layers3,
  KeyRound,
  Sparkles,
  AlignHorizontalJustifyCenter,
  AlignVerticalJustifyCenter,
  RotateCcw,
  Check,
  ZoomIn,
  ZoomOut,
  ArrowUp,
  ArrowDown,
  GripVertical,
} from "lucide-react";

export type KeyframeProperty = "x" | "y" | "width" | "height" | "opacity";
export type EasingType = "ease-in-out" | "linear" | "ease-in" | "ease-out" | "bounce";

export interface Keyframe {
  id: string;
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

const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, v));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;

function applyEasing(t: number, easing: EasingType = "ease-in-out"): number {
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

interface AnimationPreset {
  id: string;
  name: string;
  description: string;
  duration: number;
  fps: number;
  canvas: CustomCanvasData;
  tracks: Track[];
}

const PRESETS: AnimationPreset[] = [
  {
    id: "welcome",
    name: "Welcome Card",
    description: "Avatar pop-in with glowing title slide",
    duration: 1500,
    fps: 12,
    canvas: {
      title: "Welcome Card",
      width: 930,
      height: 280,
      background: "linear-gradient(135deg, #090614 0%, #1e1035 50%, #4a1d6e 100%)",
      elements: [
        {
          id: "avatar",
          type: "avatar",
          x: 36,
          y: 40,
          width: 140,
          height: 140,
          imageUrl: "https://github.com/user-attachments/assets/ebbf178f-a0af-468c-bc6d-34f0502f30a8",
          borderRadius: 999,
          border: "4px solid rgba(168, 85, 247, 0.6)",
        },
        {
          id: "title",
          type: "text",
          x: 205,
          y: 55,
          width: 650,
          height: 52,
          content: "Welcome, Adventurer!",
          color: "#ffffff",
          fontSize: 44,
          fontWeight: 700,
        },
        {
          id: "subtitle",
          type: "text",
          x: 205,
          y: 115,
          width: 650,
          height: 38,
          content: "Joined the guild · Ready for battle",
          color: "#c084fc",
          fontSize: 24,
          fontWeight: 500,
        },
        {
          id: "badge",
          type: "badge",
          x: 205,
          y: 175,
          width: 130,
          height: 32,
          content: "✦ NEW MEMBER",
          color: "#ffffff",
          backgroundColor: "#7e22ce",
          borderRadius: 8,
          fontSize: 13,
        },
      ],
    },
    tracks: [
      {
        elementId: "avatar",
        keyframes: [
          { id: "av-0", time: 0, x: 20, y: 40, width: 110, height: 110, opacity: 0, easing: "bounce" },
          { id: "av-1", time: 500, x: 36, y: 40, width: 140, height: 140, opacity: 1, easing: "ease-in-out" },
        ],
      },
      {
        elementId: "title",
        keyframes: [
          { id: "ti-0", time: 200, x: 160, y: 55, width: 650, height: 52, opacity: 0, easing: "ease-out" },
          { id: "ti-1", time: 650, x: 205, y: 55, width: 650, height: 52, opacity: 1, easing: "ease-in-out" },
        ],
      },
      {
        elementId: "subtitle",
        keyframes: [
          { id: "sub-0", time: 400, x: 170, y: 115, width: 650, height: 38, opacity: 0, easing: "ease-out" },
          { id: "sub-1", time: 850, x: 205, y: 115, width: 650, height: 38, opacity: 1, easing: "ease-in-out" },
        ],
      },
      {
        elementId: "badge",
        keyframes: [
          { id: "bd-0", time: 600, x: 205, y: 195, width: 130, height: 32, opacity: 0, easing: "bounce" },
          { id: "bd-1", time: 1050, x: 205, y: 175, width: 130, height: 32, opacity: 1, easing: "ease-in-out" },
        ],
      },
    ],
  },
  {
    id: "music",
    name: "Now Playing Wave",
    description: "Album art pulse and equalizer animation",
    duration: 1600,
    fps: 12,
    canvas: {
      title: "Now Playing Card",
      width: 930,
      height: 280,
      background: "linear-gradient(135deg, #0b0f19 0%, #111827 50%, #064e3b 100%)",
      elements: [
        {
          id: "album",
          type: "image",
          x: 40,
          y: 40,
          width: 140,
          height: 140,
          imageUrl: "https://raw.githubusercontent.com/zijipia/zijipia/refs/heads/main/Assets/zilove.png",
          borderRadius: 20,
          border: "2px solid rgba(52, 211, 153, 0.4)",
        },
        {
          id: "track-title",
          type: "text",
          x: 215,
          y: 50,
          width: 600,
          height: 48,
          content: "Midnight City Lights",
          color: "#ffffff",
          fontSize: 40,
          fontWeight: 700,
        },
        {
          id: "artist",
          type: "text",
          x: 215,
          y: 108,
          width: 600,
          height: 32,
          content: "Synthwave Collective · 3:42",
          color: "#6ee7b7",
          fontSize: 22,
          fontWeight: 500,
        },
        {
          id: "progress",
          type: "progress",
          x: 215,
          y: 165,
          width: 580,
          height: 14,
          backgroundColor: "rgba(255,255,255,0.1)",
          progressColor: "#10b981",
          progressPercent: 35,
          borderRadius: 999,
        },
      ],
    },
    tracks: [
      {
        elementId: "album",
        keyframes: [
          { id: "alb-0", time: 0, x: 40, y: 40, width: 140, height: 140, opacity: 1, easing: "ease-in-out" },
          { id: "alb-1", time: 800, x: 38, y: 38, width: 144, height: 144, opacity: 1, easing: "ease-in-out" },
          { id: "alb-2", time: 1600, x: 40, y: 40, width: 140, height: 140, opacity: 1, easing: "ease-in-out" },
        ],
      },
      {
        elementId: "progress",
        keyframes: [
          { id: "prg-0", time: 0, width: 580, height: 14, opacity: 1, easing: "linear" },
          { id: "prg-1", time: 1600, width: 580, height: 14, opacity: 1, easing: "linear" },
        ],
      },
    ],
  },
  {
    id: "rank-up",
    name: "Rank Up / XP",
    description: "Level progression and glowing badge pop",
    duration: 1400,
    fps: 12,
    canvas: {
      title: "Level Up Banner",
      width: 930,
      height: 280,
      background: "linear-gradient(135deg, #180d04 0%, #381907 50%, #7c2d12 100%)",
      elements: [
        {
          id: "rank-badge",
          type: "badge",
          x: 45,
          y: 45,
          width: 130,
          height: 130,
          content: "LV. 50",
          color: "#fef08a",
          backgroundColor: "#b45309",
          borderRadius: 30,
          fontSize: 32,
          border: "3px solid #f59e0b",
        },
        {
          id: "rank-title",
          type: "text",
          x: 210,
          y: 50,
          width: 600,
          height: 48,
          content: "LEVEL UP ACHIEVED!",
          color: "#fbbf24",
          fontSize: 38,
          fontWeight: 800,
        },
        {
          id: "rank-sub",
          type: "text",
          x: 210,
          y: 110,
          width: 600,
          height: 32,
          content: "XP: 14,850 / 15,000 (+1,200 Bonus XP)",
          color: "#fed7aa",
          fontSize: 22,
          fontWeight: 500,
        },
        {
          id: "xp-bar",
          type: "progress",
          x: 210,
          y: 165,
          width: 620,
          height: 18,
          backgroundColor: "rgba(0,0,0,0.4)",
          progressColor: "#f59e0b",
          progressPercent: 20,
          borderRadius: 999,
        },
      ],
    },
    tracks: [
      {
        elementId: "rank-badge",
        keyframes: [
          { id: "rb-0", time: 0, x: 45, y: 45, width: 90, height: 90, opacity: 0, easing: "bounce" },
          { id: "rb-1", time: 600, x: 45, y: 45, width: 130, height: 130, opacity: 1, easing: "ease-in-out" },
        ],
      },
      {
        elementId: "rank-title",
        keyframes: [
          { id: "rt-0", time: 200, x: 180, y: 50, opacity: 0, easing: "ease-out" },
          { id: "rt-1", time: 700, x: 210, y: 50, opacity: 1, easing: "ease-in-out" },
        ],
      },
    ],
  },
];

function propertyValue(
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

function buildFrame(canvas: CustomCanvasData, tracks: Track[], time: number): CustomCanvasData {
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

function snapshotKeyframe(e: CustomElement, t: Track | undefined, time: number): Keyframe {
  return {
    id: `${e.id}-${Math.round(time)}-${Date.now()}`,
    time: Math.round(time),
    easing: "ease-in-out",
    x: Math.round(propertyValue(t, time, "x", e.x)),
    y: Math.round(propertyValue(t, time, "y", e.y)),
    width: Math.round(propertyValue(t, time, "width", e.width)),
    height: Math.round(propertyValue(t, time, "height", e.height)),
    opacity: Number(propertyValue(t, time, "opacity", e.opacity ?? 1).toFixed(3)),
  };
}

const CANVAS_SIZE_PRESETS = [
  { label: "Welcome Card", width: 930, height: 280 },
  { label: "Discord Banner", width: 960, height: 540 },
  { label: "Standard Banner", width: 1130, height: 500 },
  { label: "Square Post", width: 600, height: 600 },
  { label: "Compact Banner", width: 800, height: 200 },
];

export function AnimationTimeline() {
  const [canvas, setCanvas] = useState<CustomCanvasData>(PRESETS[0].canvas);
  const [tracks, setTracks] = useState<Track[]>(PRESETS[0].tracks);
  const [duration, setDuration] = useState<number>(PRESETS[0].duration);
  const [fps, setFps] = useState<number>(PRESETS[0].fps);
  const [format, setFormat] = useState<"gif" | "webp">("gif");
  const [time, setTime] = useState<number>(350);
  const [playing, setPlaying] = useState<boolean>(false);
  const [selectedId, setSelectedId] = useState<string>("title");
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.75);
  const [autoKeyframe, setAutoKeyframe] = useState<boolean>(true);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);

  // Drag & drop state for reordering layers / tracks
  const [draggedElementIndex, setDraggedElementIndex] = useState<number | null>(null);
  const [dragOverElementIndex, setDragOverElementIndex] = useState<number | null>(null);

  const previewContainerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const timelineRulerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);
  const playStartRef = useRef({ wall: 0, time: 0 });
  const dragRef = useRef<{
    id: string;
    mode: "move" | "resize";
    startX: number;
    startY: number;
    start: CustomElement;
    canvasRect: DOMRect;
  } | null>(null);

  // Computed frame at current playhead time
  const frame = useMemo(() => buildFrame(canvas, tracks, time), [canvas, tracks, time]);
  const frameCount = Math.max(1, Math.ceil(duration / (1000 / fps)));
  const delays = useMemo(
    () => Array.from({ length: frameCount }, () => Math.round(1000 / fps)),
    [frameCount, fps]
  );

  const selectedElement = canvas.elements.find((e) => e.id === selectedId) ?? canvas.elements[0];
  const selectedTrack = tracks.find((t) => t.elementId === selectedId);
  const selectedKeyframe = selectedTrack?.keyframes.find((k) => k.id === selectedKeyframeId) ?? null;

  // Playhead loop animation
  useEffect(() => {
    if (!playing) return;
    playStartRef.current = { wall: performance.now(), time };
    const tick = (now: number) => {
      const elapsed = now - playStartRef.current.wall;
      setTime((playStartRef.current.time + elapsed) % duration);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [playing, duration]);

  // Keyboard shortcut: Space to play/pause
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const updateTrack = (id: string, fn: (t: Track) => Track) => {
    setTracks((cur) => {
      const exists = cur.some((t) => t.elementId === id);
      if (!exists) {
        return [...cur, fn({ elementId: id, keyframes: [] })];
      }
      return cur.map((t) => (t.elementId === id ? fn(t) : t));
    });
  };

  const select = (id: string, kf: string | null = null) => {
    setSelectedId(id);
    setSelectedKeyframeId(kf);
  };

  // Reorder elements (Layers & Tracks)
  const reorderElements = (fromIndex: number, toIndex: number) => {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return;
    setCanvas((prev) => {
      const nextElements = [...prev.elements];
      const [removed] = nextElements.splice(fromIndex, 1);
      nextElements.splice(toIndex, 0, removed);
      const updated = nextElements.map((el, i) => ({ ...el, zIndex: i }));
      return { ...prev, elements: updated };
    });
  };

  // Timeline Ruler Scrubbing handler (click and drag to change timeline)
  const handleTimelineScrub = (ev: React.PointerEvent<HTMLDivElement>, rulerEl: HTMLDivElement) => {
    ev.preventDefault();
    const updateTimeFromX = (clientX: number) => {
      const rect = rulerEl.getBoundingClientRect();
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      setTime(Math.round(ratio * duration));
    };

    updateTimeFromX(ev.clientX);

    const onPointerMove = (e: PointerEvent) => {
      updateTimeFromX(e.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Drag a keyframe horizontally along its track
  const beginKeyframeDrag = (
    ev: React.PointerEvent,
    elementId: string,
    keyframeId: string,
    laneEl: HTMLDivElement
  ) => {
    ev.stopPropagation();
    ev.preventDefault();
    select(elementId, keyframeId);

    const rect = laneEl.getBoundingClientRect();
    const updateKeyframeTime = (clientX: number) => {
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const newTime = Math.round(ratio * duration);
      updateTrack(elementId, (t) => ({
        ...t,
        keyframes: t.keyframes
          .map((k) => (k.id === keyframeId ? { ...k, time: newTime } : k))
          .sort((a, b) => a.time - b.time),
      }));
      setTime(newTime);
    };

    const onPointerMove = (e: PointerEvent) => {
      updateKeyframeTime(e.clientX);
    };

    const onPointerUp = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
    };

    window.addEventListener("pointermove", onPointerMove);
    window.addEventListener("pointerup", onPointerUp);
  };

  // Add keyframe at current time
  const addKeyframe = useCallback(
    (id = selectedId, at = time) => {
      const e = canvas.elements.find((x) => x.id === id);
      if (!e) return;
      const t = tracks.find((x) => x.elementId === id);
      const existing = t?.keyframes.find((k) => Math.abs(k.time - at) < 10);
      if (existing) {
        select(id, existing.id);
        setTime(existing.time);
        return;
      }
      const k = snapshotKeyframe(e, t, at);
      updateTrack(id, (track) => ({
        ...track,
        keyframes: [...track.keyframes, k].sort((a, b) => a.time - b.time),
      }));
      select(id, k.id);
      setTime(k.time);
    },
    [selectedId, time, canvas.elements, tracks]
  );

  const updateKf = (p: KeyframeProperty | "easing", v: any) => {
    if (!selectedKeyframeId) return;
    updateTrack(selectedId, (t) => ({
      ...t,
      keyframes: t.keyframes.map((k) => (k.id === selectedKeyframeId ? { ...k, [p]: v } : k)),
    }));
  };

  const moveKf = (v: number) => {
    if (!selectedKeyframeId) return;
    const n = Math.round(clamp(v, 0, duration));
    updateTrack(selectedId, (t) => ({
      ...t,
      keyframes: t.keyframes
        .map((k) => (k.id === selectedKeyframeId ? { ...k, time: n } : k))
        .sort((a, b) => a.time - b.time),
    }));
    setTime(n);
  };

  const deleteKf = (kfId = selectedKeyframeId) => {
    if (!kfId || !selectedTrack || selectedTrack.keyframes.length <= 1) return;
    updateTrack(selectedId, (t) => ({
      ...t,
      keyframes: t.keyframes.filter((k) => k.id !== kfId),
    }));
    setSelectedKeyframeId(null);
  };

  // Update element & record keyframe if autoKeyframe is active
  const updateCurrentElement = useCallback(
    (id: string, patch: Partial<CustomElement>) => {
      const e = canvas.elements.find((x) => x.id === id);
      if (!e) return;

      // Update static canvas
      setCanvas((c) => ({
        ...c,
        elements: c.elements.map((el) => (el.id === id ? { ...el, ...patch } : el)),
      }));

      // If autoKeyframe is on, find or create keyframe at current playhead time
      if (autoKeyframe) {
        const t = tracks.find((x) => x.elementId === id);
        const near = t?.keyframes.find((k) => Math.abs(k.time - time) < 15);
        if (near) {
          updateTrack(id, (trk) => ({
            ...trk,
            keyframes: trk.keyframes.map((k) =>
              k.id === near.id
                ? {
                    ...k,
                    ...(typeof patch.x === "number" ? { x: patch.x } : {}),
                    ...(typeof patch.y === "number" ? { y: patch.y } : {}),
                    ...(typeof patch.width === "number" ? { width: patch.width } : {}),
                    ...(typeof patch.height === "number" ? { height: patch.height } : {}),
                    ...(typeof patch.opacity === "number" ? { opacity: patch.opacity } : {}),
                  }
                : k
            ),
          }));
        } else {
          // Add new keyframe
          const newKf: Keyframe = {
            id: `${id}-${Math.round(time)}-${Date.now()}`,
            time: Math.round(time),
            easing: "ease-in-out",
            x: patch.x ?? e.x,
            y: patch.y ?? e.y,
            width: patch.width ?? e.width,
            height: patch.height ?? e.height,
            opacity: patch.opacity ?? e.opacity ?? 1,
          };
          updateTrack(id, (trk) => ({
            ...trk,
            keyframes: [...(trk.keyframes || []), newKf].sort((a, b) => a.time - b.time),
          }));
          setSelectedKeyframeId(newKf.id);
        }
      }
    },
    [autoKeyframe, canvas.elements, time, tracks]
  );

  // Pointer drag to move or resize elements on canvas
  const beginPreviewDrag = (
    ev: React.PointerEvent<HTMLDivElement>,
    id: string,
    mode: "move" | "resize"
  ) => {
    const e = frame.elements.find((x) => x.id === id);
    const rect = previewRef.current?.getBoundingClientRect();
    if (!e || !rect) return;
    ev.stopPropagation();
    ev.preventDefault();
    select(id);
    dragRef.current = {
      id,
      mode,
      startX: ev.clientX,
      startY: ev.clientY,
      start: { ...e },
      canvasRect: rect,
    };
    (ev.currentTarget as HTMLElement).setPointerCapture?.(ev.pointerId);
  };

  useEffect(() => {
    const move = (ev: PointerEvent) => {
      const d = dragRef.current;
      if (!d) return;
      const sx = canvas.width / d.canvasRect.width;
      const sy = canvas.height / d.canvasRect.height;
      const dx = (ev.clientX - d.startX) * sx;
      const dy = (ev.clientY - d.startY) * sy;
      const e = d.start;

      if (d.mode === "resize") {
        updateCurrentElement(d.id, {
          width: Math.max(16, Math.round(e.width + dx)),
          height: Math.max(16, Math.round(e.height + dy)),
        });
      } else {
        updateCurrentElement(d.id, {
          x: clamp(Math.round(e.x + dx), -e.width / 2, canvas.width - e.width / 2),
          y: clamp(Math.round(e.y + dy), -e.height / 2, canvas.height - e.height / 2),
        });
      }
    };

    const up = () => {
      dragRef.current = null;
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [canvas.width, canvas.height, updateCurrentElement]);

  // Quick alignment helpers
  const alignElement = (type: "centerX" | "centerY" | "left" | "right" | "top" | "bottom") => {
    if (!selectedElement) return;
    let newX = selectedElement.x;
    let newY = selectedElement.y;

    if (type === "centerX") newX = Math.round((canvas.width - selectedElement.width) / 2);
    if (type === "centerY") newY = Math.round((canvas.height - selectedElement.height) / 2);
    if (type === "left") newX = 24;
    if (type === "right") newX = canvas.width - selectedElement.width - 24;
    if (type === "top") newY = 24;
    if (type === "bottom") newY = canvas.height - selectedElement.height - 24;

    updateCurrentElement(selectedElement.id, { x: newX, y: newY });
  };

  // Add Element
  const addElement = (type: CustomElementType) => {
    const id = `${type}-${Date.now().toString().slice(-4)}`;
    const base: CustomElement = {
      id,
      type,
      x: 60,
      y: 60,
      width: type === "text" ? 360 : type === "badge" ? 140 : type === "progress" ? 400 : 140,
      height: type === "text" ? 48 : type === "badge" ? 32 : type === "progress" ? 14 : 140,
      opacity: 1,
      zIndex: canvas.elements.length,
    };

    if (type === "text") {
      Object.assign(base, {
        content: "New Text Layer",
        color: "#ffffff",
        fontSize: 32,
        fontWeight: 600,
      });
    } else if (type === "avatar" || type === "image") {
      Object.assign(base, {
        imageUrl: "https://github.com/user-attachments/assets/ebbf178f-a0af-468c-bc6d-34f0502f30a8",
        borderRadius: type === "avatar" ? 999 : 16,
      });
    } else if (type === "badge") {
      Object.assign(base, {
        content: "★ FEATURED",
        color: "#ffffff",
        backgroundColor: "#8b5cf6",
        borderRadius: 8,
        fontSize: 14,
      });
    } else if (type === "progress") {
      Object.assign(base, {
        backgroundColor: "rgba(255,255,255,0.1)",
        progressColor: "#a855f7",
        progressPercent: 65,
        borderRadius: 999,
      });
    } else if (type === "box") {
      Object.assign(base, {
        backgroundColor: "rgba(255,255,255,0.06)",
        borderRadius: 16,
        border: "1px solid rgba(255,255,255,0.12)",
      });
    }

    setCanvas((c) => ({ ...c, elements: [...c.elements, base] }));
    setTracks((t) => [
      ...t,
      {
        elementId: id,
        keyframes: [
          {
            id: `${id}-0`,
            time: 0,
            x: base.x,
            y: base.y,
            width: base.width,
            height: base.height,
            opacity: 1,
            easing: "ease-in-out",
          },
        ],
      },
    ]);
    select(id, `${id}-0`);
  };

  // Duplicate Element
  const duplicateElement = () => {
    if (!selectedElement) return;
    const newId = `${selectedElement.type}-${Date.now().toString().slice(-4)}`;
    const cloned: CustomElement = {
      ...selectedElement,
      id: newId,
      x: selectedElement.x + 20,
      y: selectedElement.y + 20,
      zIndex: canvas.elements.length,
    };
    setCanvas((c) => ({ ...c, elements: [...c.elements, cloned] }));

    const existingTrack = tracks.find((t) => t.elementId === selectedElement.id);
    const clonedKeyframes = (existingTrack?.keyframes || []).map((k) => ({
      ...k,
      id: `${newId}-${k.time}`,
      x: (k.x ?? selectedElement.x) + 20,
      y: (k.y ?? selectedElement.y) + 20,
    }));

    setTracks((t) => [...t, { elementId: newId, keyframes: clonedKeyframes }]);
    select(newId);
  };

  // Remove Element
  const removeElement = () => {
    if (!selectedElement) return;
    setCanvas((c) => ({ ...c, elements: c.elements.filter((e) => e.id !== selectedId) }));
    setTracks((t) => t.filter((x) => x.elementId !== selectedId));
    setSelectedId(canvas.elements.find((e) => e.id !== selectedId)?.id ?? "");
    setSelectedKeyframeId(null);
  };

  // Move layer up / down
  const moveLayer = (direction: "up" | "down") => {
    if (!selectedElement) return;
    const index = canvas.elements.findIndex((e) => e.id === selectedId);
    if (index === -1) return;
    const newIndex = direction === "up" ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= canvas.elements.length) return;
    reorderElements(index, newIndex);
  };

  // Load Preset
  const loadPreset = (preset: AnimationPreset) => {
    setCanvas(preset.canvas);
    setTracks(preset.tracks);
    setDuration(preset.duration);
    setFps(preset.fps);
    setTime(preset.duration * 0.4);
    setSelectedId(preset.canvas.elements[0]?.id ?? "");
    setSelectedKeyframeId(null);
  };

  // Export Animation
  const exportAnimation = async () => {
    setExportError(null);
    setExporting(true);
    setExportProgress("Compiling frames on server...");
    try {
      const frames = Array.from({ length: frameCount }, (_, i) =>
        buildFrame(canvas, tracks, Math.min(duration - 1, Math.round((i * 1000) / fps)))
      );
      const payload = JSON.stringify({
        type: "animated",
        data: {
          title: canvas.title,
          format,
          frames,
          delay: delays,
          loop: 0,
        },
      });

      const r = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: format === "gif" ? "image/gif" : "image/webp",
        },
        body: payload,
      });

      if (!r.ok) {
        const text = await r.text();
        let message = text;
        try {
          message = JSON.parse(text).error || text;
        } catch {}
        throw new Error(message || `Generation failed (${r.status})`);
      }

      setExportProgress("Downloading rendered animation...");
      const blob = await r.blob();
      if (!blob.size) throw new Error("The server returned an empty file.");

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName =
        (canvas.title || "animated-banner")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "animated-banner";
      a.href = url;
      a.download = `${safeName}.${format}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
      console.error("[Animation Studio] Export failed:", error);
    } finally {
      setExporting(false);
      setExportProgress("");
    }
  };

  const copyApi = async () => {
    const frames = Array.from({ length: frameCount }, (_, i) =>
      buildFrame(canvas, tracks, Math.min(duration - 1, Math.round((i * 1000) / fps)))
    );
    await navigator.clipboard.writeText(
      JSON.stringify(
        {
          type: "animated",
          data: {
            title: canvas.title,
            format,
            delay: delays,
            loop: 0,
            frames,
          },
        },
        null,
        2
      )
    );
    setCopiedPayload(true);
    setTimeout(() => setCopiedPayload(false), 2500);
  };

  return (
    <div className="space-y-4">
      {/* Top Banner Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-purple-500/20 bg-gradient-to-r from-purple-950/40 via-[#0e0a1e] to-indigo-950/40 p-4 shadow-xl backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-600/30">
            <Film className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base font-bold text-white">Animation Studio</h2>
              <span className="rounded-full bg-purple-500/20 px-2 py-0.5 text-[10px] font-semibold text-purple-300 border border-purple-500/30">
                GIF & WebP
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Interactive timeline, draggable tracks & layers, keyframe sliding & instant rendering
            </p>
          </div>
        </div>

        {/* Quick format & render action */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Format selector */}
          <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5">
            <button
              onClick={() => setFormat("gif")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                format === "gif"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              GIF
            </button>
            <button
              onClick={() => setFormat("webp")}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                format === "webp"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              WebP
            </button>
          </div>

          <button
            onClick={copyApi}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
            title="Copy JSON request payload for API / Bot integrations"
          >
            {copiedPayload ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Code2 className="h-3.5 w-3.5" />}
            <span>{copiedPayload ? "Copied!" : "API Payload"}</span>
          </button>

          <button
            onClick={exportAnimation}
            disabled={exporting}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {exporting ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            <span>{exporting ? "Rendering..." : `Export ${format.toUpperCase()}`}</span>
          </button>
        </div>
      </div>

      {exportError && (
        <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3 text-xs text-red-200">
          <span className="font-semibold">Export Failed: </span>
          {exportError}
        </div>
      )}

      {exportProgress && (
        <div className="rounded-xl border border-purple-500/30 bg-purple-950/50 p-3 text-xs text-purple-200 flex items-center gap-2">
          <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-300 border-t-transparent" />
          <span>{exportProgress}</span>
        </div>
      )}

      {/* Main 3-Column Layout: Left (Layers & Presets) | Center (Canvas Viewport) | Right (Inspector) */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[260px_1fr_320px]">
        {/* LEFT COLUMN: Layers & Presets */}
        <div className="space-y-4">
          {/* Quick Presets */}
          <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4 shadow-xl backdrop-blur-md">
            <div className="mb-3 flex items-center justify-between">
              <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-purple-300">
                <Sparkles className="h-3.5 w-3.5 text-purple-400" />
                Templates
              </span>
            </div>
            <div className="space-y-1.5">
              {PRESETS.map((preset) => (
                <button
                  key={preset.id}
                  onClick={() => loadPreset(preset)}
                  className="w-full text-left rounded-xl border border-white/5 bg-white/[0.03] p-2.5 transition hover:border-purple-500/40 hover:bg-purple-950/30"
                >
                  <div className="text-xs font-semibold text-white">{preset.name}</div>
                  <div className="text-[11px] text-slate-400 line-clamp-1">{preset.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Layer List with Drag-and-Drop Reordering */}
          <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4 shadow-xl backdrop-blur-md space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex flex-col">
                <span className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-300">
                  <Layers3 className="h-3.5 w-3.5 text-purple-400" />
                  Layers ({canvas.elements.length})
                </span>
                <span className="text-[10px] text-slate-500">Kéo thả để đổi thứ tự layer</span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => moveLayer("up")}
                  title="Move layer forward"
                  className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <ArrowUp className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => moveLayer("down")}
                  title="Move layer backward"
                  className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/10"
                >
                  <ArrowDown className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* Quick Add Elements */}
            <div className="grid grid-cols-3 gap-1 pb-2 border-b border-white/10">
              <button
                onClick={() => addElement("text")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-2 text-[10px] font-medium text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/30 transition"
              >
                <Type className="h-3.5 w-3.5 text-purple-400" />
                <span>Text</span>
              </button>
              <button
                onClick={() => addElement("avatar")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-2 text-[10px] font-medium text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/30 transition"
              >
                <ImagePlus className="h-3.5 w-3.5 text-rose-400" />
                <span>Avatar</span>
              </button>
              <button
                onClick={() => addElement("badge")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-2 text-[10px] font-medium text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/30 transition"
              >
                <Box className="h-3.5 w-3.5 text-amber-400" />
                <span>Badge</span>
              </button>
              <button
                onClick={() => addElement("progress")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-2 text-[10px] font-medium text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/30 transition"
              >
                <Gauge className="h-3.5 w-3.5 text-emerald-400" />
                <span>Progress</span>
              </button>
              <button
                onClick={() => addElement("image")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-2 text-[10px] font-medium text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/30 transition"
              >
                <ImagePlus className="h-3.5 w-3.5 text-cyan-400" />
                <span>Image</span>
              </button>
              <button
                onClick={() => addElement("box")}
                className="flex flex-col items-center justify-center gap-1 rounded-lg border border-white/5 bg-white/5 p-2 text-[10px] font-medium text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/30 transition"
              >
                <Box className="h-3.5 w-3.5 text-indigo-400" />
                <span>Box</span>
              </button>
            </div>

            {/* Elements list with Drag and Drop */}
            <div className="space-y-1.5 max-h-[300px] overflow-y-auto pr-1">
              {canvas.elements.map((e, index) => {
                const isSelected = selectedId === e.id;
                const track = tracks.find((t) => t.elementId === e.id);
                const kfCount = track?.keyframes.length || 0;
                const isDragging = draggedElementIndex === index;
                const isOver = dragOverElementIndex === index;

                return (
                  <div
                    key={e.id}
                    draggable
                    onDragStart={(ev) => {
                      ev.dataTransfer.setData("text/plain", index.toString());
                      setDraggedElementIndex(index);
                    }}
                    onDragOver={(ev) => {
                      ev.preventDefault();
                      if (dragOverElementIndex !== index) {
                        setDragOverElementIndex(index);
                      }
                    }}
                    onDragLeave={() => {
                      if (dragOverElementIndex === index) {
                        setDragOverElementIndex(null);
                      }
                    }}
                    onDrop={(ev) => {
                      ev.preventDefault();
                      if (draggedElementIndex !== null) {
                        reorderElements(draggedElementIndex, index);
                      }
                      setDraggedElementIndex(null);
                      setDragOverElementIndex(null);
                    }}
                    onClick={() => select(e.id)}
                    className={`group flex items-center justify-between gap-2 rounded-xl p-2 cursor-pointer transition border select-none ${
                      isDragging ? "opacity-40 border-dashed border-purple-400" : ""
                    } ${
                      isOver && !isDragging
                        ? "border-purple-400 bg-purple-900/40 ring-1 ring-purple-400"
                        : isSelected
                        ? "border-purple-500/50 bg-purple-900/30 text-white shadow-md shadow-purple-950/50"
                        : "border-transparent bg-white/[0.02] text-slate-300 hover:bg-white/5"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-300 p-0.5">
                        <GripVertical className="h-3.5 w-3.5" />
                      </div>
                      <span className="text-[10px] font-mono uppercase text-slate-500">
                        {e.type.slice(0, 3)}
                      </span>
                      <span className="text-xs font-medium truncate">
                        {e.content || e.id}
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      {kfCount > 0 && (
                        <span
                          className="rounded bg-purple-500/20 px-1 py-0.5 text-[9px] font-mono text-purple-300"
                          title={`${kfCount} keyframe(s)`}
                        >
                          {kfCount}kf
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: Interactive Canvas Viewport & Controls */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4 shadow-xl backdrop-blur-md">
            {/* Viewport Toolbar */}
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-200">
                  {canvas.title}
                </span>
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {canvas.width} × {canvas.height}px
                </span>
              </div>

              {/* Zoom & Alignment Controls */}
              <div className="flex items-center gap-2">
                {/* Alignment buttons for selected element */}
                {selectedElement && (
                  <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
                    <button
                      onClick={() => alignElement("centerX")}
                      title="Align Center Horizontally"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <AlignHorizontalJustifyCenter className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => alignElement("centerY")}
                      title="Align Center Vertically"
                      className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                    >
                      <AlignVerticalJustifyCenter className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}

                {/* Zoom buttons */}
                <div className="flex items-center gap-1 bg-black/40 rounded-lg p-0.5 border border-white/10">
                  <button
                    onClick={() => setZoom((z) => Math.max(0.4, Number((z - 0.1).toFixed(2))))}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                    title="Zoom Out"
                  >
                    <ZoomOut className="h-3.5 w-3.5" />
                  </button>
                  <span className="text-[11px] font-mono text-slate-400 px-1">
                    {Math.round(zoom * 100)}%
                  </span>
                  <button
                    onClick={() => setZoom((z) => Math.min(1.2, Number((z + 0.1).toFixed(2))))}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-white/10"
                    title="Zoom In"
                  >
                    <ZoomIn className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>

            {/* Canvas Viewport Box */}
            <div
              ref={previewContainerRef}
              className="relative flex min-h-[380px] max-h-[520px] items-center justify-center overflow-auto rounded-xl border border-white/10 bg-black/50 p-6"
            >
              <div
                ref={previewRef}
                className="relative overflow-hidden shadow-2xl select-none transition-shadow"
                style={{
                  width: canvas.width * zoom,
                  height: canvas.height * zoom,
                  background: canvas.background,
                  borderRadius: 16,
                }}
              >
                {/* Background animated image if specified */}
                {canvas.backgroundImageUrl && (
                  <img
                    src={canvas.backgroundImageUrl}
                    alt=""
                    draggable={false}
                    className="absolute inset-0 h-full w-full object-cover pointer-events-none"
                  />
                )}

                {/* Rendered elements with interactive transform frame */}
                {[...frame.elements]
                  .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
                  .map((e) => {
                    const isSelected = selectedId === e.id;
                    return (
                      <div
                        key={e.id}
                        onPointerDown={(ev) => beginPreviewDrag(ev, e.id, "move")}
                        className={`absolute cursor-move transition-opacity ${
                          isSelected
                            ? "ring-2 ring-purple-400 shadow-lg shadow-purple-500/20 z-30"
                            : "hover:ring-1 hover:ring-white/40"
                        }`}
                        style={{
                          left: e.x * zoom,
                          top: e.y * zoom,
                          width: e.width * zoom,
                          height: e.height * zoom,
                          opacity: e.opacity ?? 1,
                        }}
                      >
                        {/* Visual content */}
                        {e.type === "text" || e.type === "badge" ? (
                          <div
                            className="h-full w-full overflow-hidden"
                            style={{
                              color: e.color,
                              background: e.type === "badge" ? e.backgroundColor : undefined,
                              borderRadius: (e.borderRadius ?? 0) * zoom,
                              border: e.border,
                              fontSize: (e.fontSize ?? 24) * zoom,
                              fontWeight: e.fontWeight ?? 400,
                              display: "flex",
                              alignItems: "center",
                              justifyContent:
                                e.textAlign === "center"
                                  ? "center"
                                  : e.textAlign === "right"
                                  ? "flex-end"
                                  : "flex-start",
                              whiteSpace: "pre-wrap",
                              padding: e.type === "badge" ? `${4 * zoom}px ${10 * zoom}px` : undefined,
                            }}
                          >
                            {e.content}
                          </div>
                        ) : e.type === "image" || e.type === "avatar" ? (
                          <img
                            src={e.imageUrl || ""}
                            alt=""
                            draggable={false}
                            className="h-full w-full object-cover"
                            style={{
                              borderRadius: (e.borderRadius ?? 0) * zoom,
                              border: e.border,
                            }}
                          />
                        ) : e.type === "progress" ? (
                          <div
                            className="h-full w-full"
                            style={{
                              background: e.backgroundColor || "rgba(255,255,255,0.1)",
                              borderRadius: (e.borderRadius ?? 999) * zoom,
                              border: e.border,
                            }}
                          >
                            <div
                              className="h-full"
                              style={{
                                width: `${e.progressPercent ?? 0}%`,
                                background: e.progressColor || "#a855f7",
                                borderRadius: (e.borderRadius ?? 999) * zoom,
                              }}
                            />
                          </div>
                        ) : (
                          <div
                            className="h-full w-full"
                            style={{
                              background: e.backgroundColor || "rgba(255,255,255,0.06)",
                              borderRadius: (e.borderRadius ?? 0) * zoom,
                              border: e.border,
                            }}
                          />
                        )}

                        {/* Interactive Resize Handle on Selected Element */}
                        {isSelected && (
                          <>
                            <div
                              onPointerDown={(ev) => beginPreviewDrag(ev, e.id, "resize")}
                              className="absolute -bottom-2 -right-2 h-4 w-4 cursor-nwse-resize rounded-full bg-purple-500 ring-2 ring-black/80 flex items-center justify-center shadow-md shadow-purple-600/50"
                              title="Drag to resize"
                            >
                              <div className="h-1.5 w-1.5 rounded-full bg-white" />
                            </div>
                            {/* Live coordinate indicator tag */}
                            <div className="absolute -top-6 left-0 rounded bg-black/80 px-1.5 py-0.5 text-[9px] font-mono text-purple-300 pointer-events-none whitespace-nowrap border border-purple-500/30">
                              X:{Math.round(e.x)} Y:{Math.round(e.y)} · {Math.round(e.width)}×
                              {Math.round(e.height)}
                            </div>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Playhead Scrubber Bar */}
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/30 p-3">
              <button
                onClick={() => setPlaying((v) => !v)}
                className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-600 text-white shadow-md shadow-purple-600/30 hover:bg-purple-500 transition"
                title="Play/Pause (Spacebar)"
              >
                {playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 fill-white ml-0.5" />}
              </button>

              <button
                onClick={() => setTime(0)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                title="Jump to Start"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>

              <div className="flex-1 relative flex items-center">
                <input
                  type="range"
                  min="0"
                  max={duration}
                  step="1"
                  value={Math.round(time)}
                  onChange={(e) => setTime(Number(e.target.value))}
                  className="w-full h-1.5 rounded-lg bg-white/10 accent-purple-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-purple-300 min-w-[70px] text-right">
                  {Math.round(time)} / {duration}ms
                </span>
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {Math.round((time / duration) * frameCount)} / {frameCount}f
                </span>
              </div>
            </div>
          </div>

          {/* Interactive Multi-track Timeline with Drag & Drop Layer/Track Reordering & Scrubbing */}
          <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 shadow-xl backdrop-blur-md overflow-hidden">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5 bg-black/20">
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  Timeline Tracks
                </span>
                <span className="text-[10px] text-purple-300/80">
                  (Kéo track để đổi Layer · Kéo thước để tua Timeline · Kéo hạt để chỉnh Keyframe)
                </span>
              </div>

              <div className="flex items-center gap-3">
                {/* Auto-keyframe toggle */}
                <label className="flex items-center gap-1.5 text-[11px] text-slate-400 cursor-pointer hover:text-slate-200">
                  <input
                    type="checkbox"
                    checked={autoKeyframe}
                    onChange={(e) => setAutoKeyframe(e.target.checked)}
                    className="rounded accent-purple-500 h-3.5 w-3.5"
                  />
                  <span>Auto-Keyframe</span>
                </label>

                <button
                  onClick={() => addKeyframe()}
                  className="flex items-center gap-1 rounded-lg bg-purple-600/30 border border-purple-500/40 px-2.5 py-1 text-xs font-semibold text-purple-200 hover:bg-purple-600/50 transition"
                >
                  <KeyRound className="h-3 w-3" />
                  <span>+ Keyframe</span>
                </button>
              </div>
            </div>

            {/* Timeline Tracks list */}
            <div className="overflow-x-auto max-h-[300px]">
              <div className="min-w-[720px]">
                {/* Time markers bar - Clickable and Draggable Timeline Scrubber */}
                <div className="grid grid-cols-[200px_1fr] border-b border-white/10 bg-black/50 text-[10px] text-slate-400">
                  <div className="p-2 font-mono text-slate-400 font-semibold border-r border-white/5 flex items-center gap-1">
                    <span>TRACK / LAYER</span>
                  </div>

                  {/* Interactive Ruler Header: Click & Drag here to scrub Timeline! */}
                  <div
                    ref={timelineRulerRef}
                    onPointerDown={(ev) => {
                      if (timelineRulerRef.current) {
                        handleTimelineScrub(ev, timelineRulerRef.current);
                      }
                    }}
                    className="relative h-8 cursor-ew-resize select-none bg-black/40 hover:bg-purple-950/20 transition group"
                    title="Nhấn và kéo rê ngang để thay đổi Timeline (Scrub Playhead)"
                  >
                    {/* Time ticks across ruler */}
                    {Array.from({ length: 7 }, (_, i) => {
                      const m = Math.round((duration / 6) * i);
                      return (
                        <div
                          key={m}
                          className="absolute top-0 bottom-0 -translate-x-1/2 flex flex-col items-center pointer-events-none"
                          style={{ left: `${(m / duration) * 100}%` }}
                        >
                          <div className="h-2 w-px bg-white/20" />
                          <span className="font-mono text-[9px] text-slate-400 group-hover:text-purple-300 transition">
                            {m}ms
                          </span>
                        </div>
                      );
                    })}

                    {/* Draggable Playhead Scrubber Badge on Ruler */}
                    <div
                      className="absolute top-0 -translate-x-1/2 flex flex-col items-center pointer-events-none z-40 transition-transform"
                      style={{ left: `${(time / duration) * 100}%` }}
                    >
                      <div className="bg-gradient-to-r from-purple-500 to-indigo-500 text-[9px] font-mono font-bold text-white px-1.5 py-0.5 rounded shadow-lg shadow-purple-500/50 flex items-center gap-0.5 border border-purple-300">
                        <span>{Math.round(time)}ms</span>
                      </div>
                      <div className="w-0 h-0 border-l-[4px] border-l-transparent border-r-[4px] border-r-transparent border-t-[5px] border-t-purple-400" />
                    </div>
                  </div>
                </div>

                {/* Track Rows with Drag-and-Drop Reordering and Keyframe Draggable Diamonds */}
                {canvas.elements.map((e, index) => {
                  const t = tracks.find((x) => x.elementId === e.id);
                  const isTrackSelected = selectedId === e.id;
                  const keyframes = t?.keyframes || [];
                  const isDragging = draggedElementIndex === index;
                  const isOver = dragOverElementIndex === index;

                  return (
                    <div
                      key={e.id}
                      draggable
                      onDragStart={(ev) => {
                        ev.dataTransfer.setData("text/plain", index.toString());
                        setDraggedElementIndex(index);
                      }}
                      onDragOver={(ev) => {
                        ev.preventDefault();
                        if (dragOverElementIndex !== index) {
                          setDragOverElementIndex(index);
                        }
                      }}
                      onDragLeave={() => {
                        if (dragOverElementIndex === index) {
                          setDragOverElementIndex(null);
                        }
                      }}
                      onDrop={(ev) => {
                        ev.preventDefault();
                        if (draggedElementIndex !== null) {
                          reorderElements(draggedElementIndex, index);
                        }
                        setDraggedElementIndex(null);
                        setDragOverElementIndex(null);
                      }}
                      className={`grid grid-cols-[200px_1fr] border-b border-white/5 transition select-none ${
                        isDragging ? "opacity-35 bg-purple-950/40 border-dashed border-purple-400" : ""
                      } ${
                        isOver && !isDragging
                          ? "border-t-2 border-t-purple-400 bg-purple-900/30"
                          : isTrackSelected
                          ? "bg-purple-950/25"
                          : "hover:bg-white/[0.02]"
                      }`}
                    >
                      {/* Track Header with Drag Handle (Kéo thả track lên xuống để đổi Layer) */}
                      <div
                        onClick={() => select(e.id)}
                        className={`flex items-center gap-1.5 p-2 text-left text-xs border-r border-white/5 cursor-pointer ${
                          isTrackSelected ? "text-purple-300 font-semibold" : "text-slate-400"
                        }`}
                      >
                        <div
                          className="cursor-grab active:cursor-grabbing text-slate-500 hover:text-slate-200 p-0.5"
                          title="Kéo thả lên/xuống để đổi thứ tự Layer"
                        >
                          <GripVertical className="h-3.5 w-3.5" />
                        </div>
                        <span className="text-[9px] font-mono uppercase text-slate-500 px-1 py-0.5 rounded bg-white/5">
                          {e.type.slice(0, 3)}
                        </span>
                        <span className="truncate flex-1">{e.content || e.id}</span>
                      </div>

                      {/* Track keyframes lane (Click or drag anywhere in lane to scrub timeline!) */}
                      <div
                        onPointerDown={(ev) => {
                          const laneEl = ev.currentTarget as HTMLDivElement;
                          handleTimelineScrub(ev, laneEl);
                        }}
                        className="relative h-11 bg-black/20 hover:bg-black/30 cursor-pointer"
                        title="Bấm hoặc kéo trên track để tua thời gian"
                      >
                        {/* Global playhead scrubber line */}
                        <div
                          className="absolute inset-y-0 w-0.5 bg-purple-400 z-20 pointer-events-none shadow-sm shadow-purple-400"
                          style={{ left: `${(time / duration) * 100}%` }}
                        />

                        {/* Visual Track Keyframe Span Bar */}
                        {keyframes.length > 1 && (
                          <div
                            className="absolute top-3.5 h-3.5 rounded bg-purple-600/20 border border-purple-500/30 pointer-events-none"
                            style={{
                              left: `${(keyframes[0].time / duration) * 100}%`,
                              width: `${Math.max(
                                4,
                                ((keyframes[keyframes.length - 1].time - keyframes[0].time) /
                                  duration) *
                                  100
                              )}%`,
                            }}
                          />
                        )}

                        {/* Keyframe diamonds (Kéo hạt sang trái/phải để đổi Keyframe time) */}
                        {keyframes.map((k) => {
                          const isKfSelected = selectedKeyframeId === k.id && isTrackSelected;
                          return (
                            <div
                              key={k.id}
                              onPointerDown={(ev) => {
                                const laneEl = ev.currentTarget.parentElement as HTMLDivElement;
                                beginKeyframeDrag(ev, e.id, k.id, laneEl);
                              }}
                              title={`Keyframe: ${k.time}ms (Kéo ngang để di chuyển)`}
                              className={`absolute top-2.5 z-30 h-5 w-5 -translate-x-1/2 rotate-45 rounded-[3px] border cursor-grab active:cursor-grabbing transition-transform hover:scale-125 ${
                                isKfSelected
                                  ? "border-white bg-purple-400 shadow-md shadow-purple-500 ring-2 ring-purple-300 scale-110"
                                  : "border-purple-400/80 bg-purple-900 hover:bg-purple-700"
                              }`}
                              style={{ left: `${(k.time / duration) * 100}%` }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: Properties & Keyframe Inspector */}
        <div className="space-y-4">
          {/* Keyframe Inspector Panel (when keyframe is active) */}
          {selectedKeyframe && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-4 shadow-xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-purple-500/20 pb-2">
                <span className="flex items-center gap-1.5 text-xs font-bold text-purple-200">
                  <KeyRound className="h-3.5 w-3.5 text-purple-400" />
                  Keyframe · {Math.round(selectedKeyframe.time)}ms
                </span>
                <button
                  onClick={() => deleteKf()}
                  className="rounded p-1 text-red-400 hover:bg-red-500/10 hover:text-red-300"
                  title="Delete Keyframe"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Time & Easing */}
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] text-slate-400">
                  Time (ms)
                  <input
                    type="number"
                    min="0"
                    max={duration}
                    value={selectedKeyframe.time}
                    onChange={(e) => moveKf(Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </label>
                <label className="block text-[11px] text-slate-400">
                  Easing
                  <select
                    value={selectedKeyframe.easing || "ease-in-out"}
                    onChange={(e) => updateKf("easing", e.target.value)}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  >
                    <option value="ease-in-out">Ease In-Out</option>
                    <option value="linear">Linear</option>
                    <option value="ease-in">Ease In</option>
                    <option value="ease-out">Ease Out</option>
                    <option value="bounce">Bounce</option>
                  </select>
                </label>
              </div>

              {/* Position & Size */}
              <div className="grid grid-cols-2 gap-2">
                <label className="block text-[11px] text-slate-400">
                  X
                  <input
                    type="number"
                    value={selectedKeyframe.x ?? 0}
                    onChange={(e) => updateKf("x", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </label>
                <label className="block text-[11px] text-slate-400">
                  Y
                  <input
                    type="number"
                    value={selectedKeyframe.y ?? 0}
                    onChange={(e) => updateKf("y", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </label>
                <label className="block text-[11px] text-slate-400">
                  Width
                  <input
                    type="number"
                    value={selectedKeyframe.width ?? 100}
                    onChange={(e) => updateKf("width", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </label>
                <label className="block text-[11px] text-slate-400">
                  Height
                  <input
                    type="number"
                    value={selectedKeyframe.height ?? 100}
                    onChange={(e) => updateKf("height", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />
                </label>
              </div>

              {/* Opacity slider */}
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Opacity</span>
                  <span className="font-mono">{Math.round((selectedKeyframe.opacity ?? 1) * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={selectedKeyframe.opacity ?? 1}
                  onChange={(e) => updateKf("opacity", Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>
            </div>
          )}

          {/* Selected Element Properties */}
          {selectedElement ? (
            <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4 shadow-xl backdrop-blur-md space-y-3">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
                  {selectedElement.type} Properties
                </span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={duplicateElement}
                    className="rounded p-1 text-slate-400 hover:text-white hover:bg-white/10"
                    title="Duplicate Element"
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={removeElement}
                    className="rounded p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10"
                    title="Delete Element"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Text content if text or badge */}
              {(selectedElement.type === "text" || selectedElement.type === "badge") && (
                <div>
                  <label className="block text-[11px] text-slate-400">
                    Content
                    <input
                      type="text"
                      value={selectedElement.content || ""}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { content: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </label>
                </div>
              )}

              {/* Typography options for text */}
              {selectedElement.type === "text" && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[11px] text-slate-400">
                    Font Size
                    <input
                      type="number"
                      value={selectedElement.fontSize || 32}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, { fontSize: Number(e.target.value) })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-400">
                    Weight
                    <select
                      value={selectedElement.fontWeight || 500}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, { fontWeight: Number(e.target.value) })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    >
                      <option value="400">Regular (400)</option>
                      <option value="500">Medium (500)</option>
                      <option value="600">SemiBold (600)</option>
                      <option value="700">Bold (700)</option>
                    </select>
                  </label>
                  <label className="block text-[11px] text-slate-400">
                    Color
                    <input
                      type="text"
                      value={selectedElement.color || "#ffffff"}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { color: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-400">
                    Align
                    <select
                      value={selectedElement.textAlign || "left"}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, {
                          textAlign: e.target.value as "left" | "center" | "right",
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    >
                      <option value="left">Left</option>
                      <option value="center">Center</option>
                      <option value="right">Right</option>
                    </select>
                  </label>
                </div>
              )}

              {/* Image URL for avatar / image */}
              {(selectedElement.type === "image" || selectedElement.type === "avatar") && (
                <div>
                  <label className="block text-[11px] text-slate-400">
                    Image URL
                    <input
                      type="text"
                      value={selectedElement.imageUrl || ""}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { imageUrl: e.target.value })}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                      placeholder="https://..."
                    />
                  </label>
                </div>
              )}

              {/* Progress properties */}
              {selectedElement.type === "progress" && (
                <div className="space-y-2">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Percent</span>
                    <span className="font-mono">{selectedElement.progressPercent || 0}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={selectedElement.progressPercent || 0}
                    onChange={(e) =>
                      updateCurrentElement(selectedElement.id, {
                        progressPercent: Number(e.target.value),
                      })
                    }
                    className="w-full accent-purple-500"
                  />
                  <label className="block text-[11px] text-slate-400">
                    Progress Bar Color
                    <input
                      type="text"
                      value={selectedElement.progressColor || "#a855f7"}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, { progressColor: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </label>
                </div>
              )}

              {/* Colors & borders for Badge or Box */}
              {(selectedElement.type === "badge" || selectedElement.type === "box") && (
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[11px] text-slate-400">
                    Background
                    <input
                      type="text"
                      value={selectedElement.backgroundColor || ""}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, { backgroundColor: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-400">
                    Border
                    <input
                      type="text"
                      value={selectedElement.border || ""}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, { border: e.target.value })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                      placeholder="1px solid #fff"
                    />
                  </label>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-6 text-center text-xs text-slate-400">
              Select an element on the canvas to inspect its properties.
            </div>
          )}

          {/* Canvas Global Settings */}
          <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4 shadow-xl backdrop-blur-md space-y-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
              Canvas Settings
            </span>

            {/* Presets */}
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Canvas Size</label>
              <select
                onChange={(e) => {
                  const preset = CANVAS_SIZE_PRESETS[Number(e.target.value)];
                  if (preset) {
                    setCanvas((c) => ({ ...c, width: preset.width, height: preset.height }));
                  }
                }}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
              >
                {CANVAS_SIZE_PRESETS.map((p, idx) => (
                  <option key={p.label} value={idx}>
                    {p.label} ({p.width}×{p.height})
                  </option>
                ))}
              </select>
            </div>

            {/* Duration & FPS */}
            <div className="grid grid-cols-2 gap-2">
              <label className="block text-[11px] text-slate-400">
                Duration (ms)
                <input
                  type="number"
                  min="300"
                  max="6000"
                  step="100"
                  value={duration}
                  onChange={(e) => setDuration(clamp(Number(e.target.value), 300, 10000))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </label>
              <label className="block text-[11px] text-slate-400">
                FPS
                <select
                  value={fps}
                  onChange={(e) => setFps(Number(e.target.value))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                >
                  <option value="10">10 FPS (Light)</option>
                  <option value="12">12 FPS (Default)</option>
                  <option value="15">15 FPS (Smooth)</option>
                  <option value="20">20 FPS (Fluid)</option>
                  <option value="24">24 FPS (Cinematic)</option>
                </select>
              </label>
            </div>

            {/* Background Style */}
            <div>
              <label className="block text-[11px] text-slate-400">
                Background (CSS / Gradient)
                <input
                  type="text"
                  value={canvas.background}
                  onChange={(e) => setCanvas((c) => ({ ...c, background: e.target.value }))}
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                />
              </label>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400">
                GIF / WebP Background Overlay (Optional)
                <input
                  type="text"
                  value={canvas.backgroundImageUrl || ""}
                  onChange={(e) =>
                    setCanvas((c) => ({ ...c, backgroundImageUrl: e.target.value || undefined }))
                  }
                  className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  placeholder="https://.../ambient.gif"
                />
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
