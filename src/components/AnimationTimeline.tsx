import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import type { CustomCanvasData, CustomElement, CustomElementType, Transform } from "../lib/types";
import { recordGeneratedImage } from "../lib/use-stats";
import { TextShadowControlPanel } from "./TextShadowControlPanel";
import { computeElementTextShadow, TEXT_SHADOW_PRESETS } from "../lib/text-effects";
import { ParticleControlPanel } from "./ParticleControlPanel";
import { ParticleCanvas } from "./ParticleCanvas";
import { createDefaultParticleConfig } from "../lib/particle-system";
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
  SlidersHorizontal,
  Palette,
  X,
  RefreshCw,
  FileJson,
  Terminal,
  Camera,
  Undo2,
  Redo2,
  Save,
  FolderOpen,
  FilePlus,
  History as HistoryIcon,
  FileDown,
  FileCode,
  Upload,
} from "lucide-react";

import {
  executeCommand,
  type AnimationCommand,
  type EditorSnapshotState,
} from "../lib/animation-history";
import {
  createIStudioProject,
  downloadIStudioFile,
  parseIStudioFile,
  saveProjectToLocalStorage,
  loadProjectFromLocalStorage,
} from "../lib/project-file";

import {
  buildFrame,
  propertyValue,
  propertyColorValue,
  propertyStringValue,
  applyEasing,
  clamp,
  lerp,
  type KeyframeProperty,
  type EasingType,
  type Keyframe,
  type Track,
} from "../lib/timeline-interpolator";

export type { KeyframeProperty, EasingType, Keyframe, Track, Transform };

import {
  PRESETS,
  DEFAULT_TEMPLATE_VARIABLES,
  type AnimationPreset,
} from "../lib/animation-presets";

export { DEFAULT_TEMPLATE_VARIABLES };

/**
 * Replace any {varName} in a string with the corresponding value from vars
 */
export function parseTemplateString(input: string | undefined, vars: Record<string, string>): string {
  if (!input) return "";
  return input.replace(/\{([a-zA-Z0-9_-]+)\}/g, (match, key) => {
    if (Object.prototype.hasOwnProperty.call(vars, key)) {
      return vars[key];
    }
    return match;
  });
}

// Preset color swatches for the color palette
const COLOR_SWATCHES = [
  { name: "White", hex: "#ffffff" },
  { name: "Slate", hex: "#94a3b8" },
  { name: "Black", hex: "#000000" },
  { name: "Purple Glow", hex: "#c084fc" },
  { name: "Violet", hex: "#a855f7" },
  { name: "Deep Violet", hex: "#7c3aed" },
  { name: "Pink Neon", hex: "#ec4899" },
  { name: "Rose", hex: "#f43f5e" },
  { name: "Red", hex: "#ef4444" },
  { name: "Amber", hex: "#f59e0b" },
  { name: "Gold", hex: "#fbbf24" },
  { name: "Emerald", hex: "#10b981" },
  { name: "Cyan", hex: "#06b6d4" },
  { name: "Blue", hex: "#3b82f6" },
  { name: "Indigo", hex: "#6366f1" },
];

/**
 * Reusable Color Picker & Swatch Palette Control
 */
function ColorPalettePicker({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
}) {
  const [showSwatches, setShowSwatches] = useState(false);
  const colorValue = value && value.startsWith("#") ? value : "#ffffff";

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-[11px] text-slate-400">
        <span>{label}</span>
        <button
          type="button"
          onClick={() => setShowSwatches((v) => !v)}
          className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
        >
          <Palette className="h-3 w-3" />
          <span>{showSwatches ? "Ẩn bảng" : "Bảng màu"}</span>
        </button>
      </div>

      <div className="flex items-center gap-2">
        {/* Color preview & native picker trigger */}
        <label
          className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/20 shadow-inner flex-shrink-0"
          style={{ backgroundColor: colorValue }}
          title="Bấm để chọn màu"
        >
          <input
            type="color"
            value={colorValue.length === 7 ? colorValue : "#ffffff"}
            onChange={(e) => onChange(e.target.value)}
            className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
          />
        </label>

        {/* Text hex input */}
        <input
          type="text"
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="#ffffff"
          className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
        />
      </div>

      {/* Quick Swatch Palette Grid */}
      {showSwatches && (
        <div className="rounded-xl border border-white/10 bg-black/60 p-2 space-y-1.5 shadow-lg">
          <div className="text-[10px] text-slate-400 font-semibold">Màu phổ biến:</div>
          <div className="grid grid-cols-5 gap-1.5">
            {COLOR_SWATCHES.map((swatch) => (
              <button
                key={swatch.hex}
                type="button"
                onClick={() => {
                  onChange(swatch.hex);
                }}
                className={`group relative flex h-6 w-full items-center justify-center rounded-md border transition hover:scale-110 ${
                  value?.toLowerCase() === swatch.hex.toLowerCase()
                    ? "border-white ring-2 ring-purple-400"
                    : "border-white/10 hover:border-white/40"
                }`}
                style={{ backgroundColor: swatch.hex }}
                title={`${swatch.name} (${swatch.hex})`}
              >
                {value?.toLowerCase() === swatch.hex.toLowerCase() && (
                  <Check
                    className={`h-3 w-3 ${
                      swatch.hex === "#ffffff" || swatch.hex === "#fbbf24"
                        ? "text-black"
                        : "text-white"
                    }`}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}



function snapshotKeyframe(e: CustomElement, t: Track | undefined, time: number): Keyframe {
  const x = Math.round(propertyValue(t, time, "x", e.transform?.x ?? e.x));
  const y = Math.round(propertyValue(t, time, "y", e.transform?.y ?? e.y));
  const width = Math.round(propertyValue(t, time, "width", e.transform?.width ?? e.width));
  const height = Math.round(propertyValue(t, time, "height", e.transform?.height ?? e.height));
  const rotation = Number(propertyValue(t, time, "rotation", e.transform?.rotation ?? e.rotation ?? 0).toFixed(2));
  const scaleX = Number(propertyValue(t, time, "scaleX", e.transform?.scaleX ?? e.scaleX ?? 1).toFixed(3));
  const scaleY = Number(propertyValue(t, time, "scaleY", e.transform?.scaleY ?? e.scaleY ?? 1).toFixed(3));
  const anchorX = Number(propertyValue(t, time, "anchorX", e.transform?.anchorX ?? e.anchorX ?? 0.5).toFixed(3));
  const anchorY = Number(propertyValue(t, time, "anchorY", e.transform?.anchorY ?? e.anchorY ?? 0.5).toFixed(3));

  const opacity = Number(propertyValue(t, time, "opacity", e.opacity ?? 1).toFixed(3));
  const blur = e.blur !== undefined || t?.keyframes.some((k) => k.blur !== undefined)
    ? Number(propertyValue(t, time, "blur", e.blur ?? 0).toFixed(2))
    : undefined;
  const brightness = e.brightness !== undefined || t?.keyframes.some((k) => k.brightness !== undefined)
    ? Math.round(propertyValue(t, time, "brightness", e.brightness ?? 100))
    : undefined;
  const saturation = e.saturation !== undefined || t?.keyframes.some((k) => k.saturation !== undefined)
    ? Math.round(propertyValue(t, time, "saturation", e.saturation ?? 100))
    : undefined;
  const contrast = e.contrast !== undefined || t?.keyframes.some((k) => k.contrast !== undefined)
    ? Math.round(propertyValue(t, time, "contrast", e.contrast ?? 100))
    : undefined;

  const fontSize = e.fontSize !== undefined ? Math.round(propertyValue(t, time, "fontSize", e.fontSize)) : undefined;
  const letterSpacing = e.letterSpacing !== undefined || t?.keyframes.some((k) => k.letterSpacing !== undefined)
    ? Number(propertyValue(t, time, "letterSpacing", e.letterSpacing ?? 0).toFixed(2))
    : undefined;
  const lineHeight = e.lineHeight !== undefined || t?.keyframes.some((k) => k.lineHeight !== undefined)
    ? Number(propertyValue(t, time, "lineHeight", e.lineHeight ?? 1.2).toFixed(2))
    : undefined;
  const textShadow = e.textShadow !== undefined || t?.keyframes.some((k) => k.textShadow !== undefined)
    ? propertyStringValue(t, time, "textShadow", e.textShadow)
    : undefined;

  const color = propertyColorValue(t, time, "color", e.color);
  const backgroundColor = propertyColorValue(t, time, "backgroundColor", e.backgroundColor);
  const glowColor = propertyColorValue(t, time, "glowColor", e.glowColor);
  const glowBlur = e.glowBlur !== undefined || t?.keyframes.some((k) => k.glowBlur !== undefined)
    ? Math.round(propertyValue(t, time, "glowBlur", e.glowBlur ?? 16))
    : undefined;

  return {
    id: `${e.id}-${Math.round(time)}-${Date.now()}`,
    time: Math.round(time),
    easing: "ease-in-out",
    x,
    y,
    width,
    height,
    rotation,
    scaleX,
    scaleY,
    anchorX,
    anchorY,
    transform: { x, y, width, height, rotation, scaleX, scaleY, anchorX, anchorY },
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
  const [exportingFrame, setExportingFrame] = useState<boolean>(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [exportError, setExportError] = useState<string | null>(null);
  const [zoom, setZoom] = useState<number>(0.75);
  const [autoKeyframe, setAutoKeyframe] = useState<boolean>(true);
  const [copiedPayload, setCopiedPayload] = useState<boolean>(false);
  const [copiedTransformKf, setCopiedTransformKf] = useState<boolean>(false);

  // Template variables state
  const [variables, setVariables] = useState<Record<string, string>>(DEFAULT_TEMPLATE_VARIABLES);
  const [showVariableModal, setShowVariableModal] = useState<boolean>(false);
  const [newVarKey, setNewVarKey] = useState<string>("");
  const [newVarValue, setNewVarValue] = useState<string>("");

  // API Payload modal state (unparsed vs parsed, animation vs frame-png)
  const [showApiPayloadModal, setShowApiPayloadModal] = useState<boolean>(false);
  const [payloadMode, setPayloadMode] = useState<"unparsed" | "parsed">("unparsed");
  const [payloadTarget, setPayloadTarget] = useState<"animation" | "frame-png">("animation");
  const [editablePayloadJson, setEditablePayloadJson] = useState<string>("");
  const [copiedJson, setCopiedJson] = useState<boolean>(false);
  const [copiedCurl, setCopiedCurl] = useState<boolean>(false);
  const [isTestingRender, setIsTestingRender] = useState<boolean>(false);

  // Drag & drop state for reordering layers / tracks
  const [draggedElementIndex, setDraggedElementIndex] = useState<number | null>(null);
  const [dragOverElementIndex, setDragOverElementIndex] = useState<number | null>(null);

  // Project (.istudio) & History State
  const [projectName, setProjectName] = useState<string>("Welcome Card Animation");
  const [lastSavedNotice, setLastSavedNotice] = useState<string | null>(null);
  const [showHistoryDropdown, setShowHistoryDropdown] = useState<boolean>(false);
  const [showNewConfirmModal, setShowNewConfirmModal] = useState<boolean>(false);
  const [showSaveAsModal, setShowSaveAsModal] = useState<boolean>(false);
  const [saveAsFilename, setSaveAsFilename] = useState<string>("Welcome Card Animation");
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importJsonText, setImportJsonText] = useState<string>("");
  const [importError, setImportError] = useState<string | null>(null);
  const [importTab, setImportTab] = useState<"file" | "text">("file");
  const [undoStack, setUndoStack] = useState<AnimationCommand[]>([]);
  const [redoStack, setRedoStack] = useState<AnimationCommand[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Push command to history stack
  const pushCommand = useCallback((cmd: AnimationCommand) => {
    setUndoStack((prev) => {
      const next = [...prev, cmd];
      if (next.length > 50) return next.slice(next.length - 50);
      return next;
    });
    setRedoStack([]); // New action clears redo
  }, []);

  // Undo last command
  const undo = useCallback(() => {
    setUndoStack((prevUndo) => {
      if (prevUndo.length === 0) return prevUndo;
      const cmd = prevUndo[prevUndo.length - 1];
      const nextUndo = prevUndo.slice(0, -1);

      const currentState: EditorSnapshotState = {
        canvas,
        tracks,
        variables,
        duration,
        fps,
        format,
        selectedId,
        selectedKeyframeId,
      };

      const newState = executeCommand(currentState, cmd, true);

      setCanvas(newState.canvas);
      setTracks(newState.tracks);
      setVariables(newState.variables);
      setDuration(newState.duration);
      setFps(newState.fps);
      setFormat(newState.format);
      if (newState.selectedId) setSelectedId(newState.selectedId);
      if (newState.selectedKeyframeId !== undefined) setSelectedKeyframeId(newState.selectedKeyframeId);

      setRedoStack((prevRedo) => [...prevRedo, cmd]);
      return nextUndo;
    });
  }, [canvas, tracks, variables, duration, fps, format, selectedId, selectedKeyframeId]);

  // Redo last undone command
  const redo = useCallback(() => {
    setRedoStack((prevRedo) => {
      if (prevRedo.length === 0) return prevRedo;
      const cmd = prevRedo[prevRedo.length - 1];
      const nextRedo = prevRedo.slice(0, -1);

      const currentState: EditorSnapshotState = {
        canvas,
        tracks,
        variables,
        duration,
        fps,
        format,
        selectedId,
        selectedKeyframeId,
      };

      const newState = executeCommand(currentState, cmd, false);

      setCanvas(newState.canvas);
      setTracks(newState.tracks);
      setVariables(newState.variables);
      setDuration(newState.duration);
      setFps(newState.fps);
      setFormat(newState.format);
      if (newState.selectedId) setSelectedId(newState.selectedId);
      if (newState.selectedKeyframeId !== undefined) setSelectedKeyframeId(newState.selectedKeyframeId);

      setUndoStack((prevUndo) => [...prevUndo, cmd]);
      return nextRedo;
    });
  }, [canvas, tracks, variables, duration, fps, format, selectedId, selectedKeyframeId]);

  // Project .istudio handlers
  const handleOpenIStudioFile = useCallback((file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      if (!content) return;
      const res = parseIStudioFile(content);
      if (res.success && res.project) {
        const p = res.project;
        setProjectName(p.name);
        setCanvas(p.canvas);
        setTracks(p.tracks);
        setVariables(p.variables);
        setDuration(p.export.duration);
        setFps(p.export.fps);
        setFormat(p.export.format);
        setTime(p.export.duration * 0.4);
        if (p.canvas.elements[0]) {
          setSelectedId(p.canvas.elements[0].id);
        }
        setUndoStack([]);
        setRedoStack([]);
        setLastSavedNotice(`Đã mở tệp ${file.name}`);
        setTimeout(() => setLastSavedNotice(null), 3500);
      } else {
        alert(res.error || "Không thể mở tệp .istudio này");
      }
    };
    reader.readAsText(file);
  }, []);

  const handleSaveAsIStudio = useCallback(() => {
    const project = createIStudioProject(
      projectName,
      canvas,
      tracks,
      variables,
      { duration, fps, format }
    );
    downloadIStudioFile(project);
    setLastSavedNotice(`Đã xuất ${projectName}.istudio`);
    setTimeout(() => setLastSavedNotice(null), 3500);
  }, [projectName, canvas, tracks, variables, duration, fps, format]);

  const handleSaveAsWithCustomName = useCallback(
    (customName: string) => {
      const finalName = customName.trim() || projectName || "my-animation";
      setProjectName(finalName);
      const project = createIStudioProject(
        finalName,
        canvas,
        tracks,
        variables,
        { duration, fps, format }
      );
      downloadIStudioFile(project, `${finalName.replace(/[/\\?%*:|"<>]/g, "-")}.istudio`);
      setLastSavedNotice(`Đã lưu tệp ${finalName}.istudio`);
      setShowSaveAsModal(false);
      setTimeout(() => setLastSavedNotice(null), 3500);
    },
    [projectName, canvas, tracks, variables, duration, fps, format]
  );

  const handleImportFromJsonText = useCallback((rawText: string) => {
    setImportError(null);
    if (!rawText.trim()) {
      setImportError("Vui lòng dán chuỗi JSON của project.");
      return;
    }
    const res = parseIStudioFile(rawText);
    if (res.success && res.project) {
      const p = res.project;
      setProjectName(p.name);
      setCanvas(p.canvas);
      setTracks(p.tracks);
      setVariables(p.variables);
      setDuration(p.export.duration);
      setFps(p.export.fps);
      setFormat(p.export.format);
      setTime(p.export.duration * 0.4);
      if (p.canvas.elements[0]) {
        setSelectedId(p.canvas.elements[0].id);
      }
      setUndoStack([]);
      setRedoStack([]);
      setShowImportModal(false);
      setImportJsonText("");
      setLastSavedNotice(`Đã nhập thành công project '${p.name}'`);
      setTimeout(() => setLastSavedNotice(null), 3500);
    } else {
      setImportError(res.error || "Chuỗi JSON không đúng định dạng .istudio hợp lệ.");
    }
  }, []);

  const handleQuickSave = useCallback(() => {
    const project = createIStudioProject(
      projectName,
      canvas,
      tracks,
      variables,
      { duration, fps, format }
    );
    saveProjectToLocalStorage(project);
    const timeStr = new Date().toLocaleTimeString();
    setLastSavedNotice(`Đã lưu lúc ${timeStr}`);
    setTimeout(() => setLastSavedNotice(null), 3500);
  }, [projectName, canvas, tracks, variables, duration, fps, format]);

  const handleNewProject = useCallback(() => {
    setShowNewConfirmModal(true);
  }, []);

  const confirmNewProject = useCallback(() => {
    const preset = PRESETS[0];
    setProjectName("New Animation Project");
    setCanvas(preset.canvas);
    setTracks(preset.tracks);
    setVariables(DEFAULT_TEMPLATE_VARIABLES);
    setDuration(preset.duration);
    setFps(preset.fps);
    setFormat("gif");
    setTime(preset.duration * 0.4);
    setSelectedId(preset.canvas.elements[0]?.id || "");
    setSelectedKeyframeId(null);
    setUndoStack([]);
    setRedoStack([]);
    setShowNewConfirmModal(false);
    setLastSavedNotice("Đã tạo project mới");
    setTimeout(() => setLastSavedNotice(null), 3500);
  }, []);

  // Computed frame at current playhead time
  const rawFrame = useMemo(() => buildFrame(canvas, tracks, time), [canvas, tracks, time]);

  // Frame with variables parsed for live visual preview
  const frame = useMemo(() => {
    return {
      ...rawFrame,
      backgroundImageUrl: rawFrame.backgroundImageUrl
        ? parseTemplateString(rawFrame.backgroundImageUrl, variables)
        : undefined,
      elements: rawFrame.elements.map((el) => ({
        ...el,
        content: el.content ? parseTemplateString(el.content, variables) : undefined,
        imageUrl: el.imageUrl ? parseTemplateString(el.imageUrl, variables) : undefined,
      })),
    };
  }, [rawFrame, variables]);

  const frameCount = Math.max(1, Math.ceil(duration / (1000 / fps)));
  const delays = useMemo(
    () => Array.from({ length: frameCount }, () => Math.round(1000 / fps)),
    [frameCount, fps]
  );

  const selectedElement = canvas.elements.find((e) => e.id === selectedId) ?? canvas.elements[0];
  const selectedTrack = tracks.find((t) => t.elementId === selectedId);
  const selectedKeyframe =
    selectedTrack?.keyframes.find(
      (k) => (k.id || `${selectedTrack.elementId}-${k.time}`) === selectedKeyframeId
    ) ?? null;

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

  // Keyboard shortcuts: Space to play/pause, Ctrl+Z to undo, Ctrl+Y / Ctrl+Shift+Z to redo, Ctrl+S to save
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;
      if (isCtrlOrCmd && (e.key === "z" || e.key === "Z")) {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if (isCtrlOrCmd && (e.key === "y" || e.key === "Y")) {
        e.preventDefault();
        redo();
        return;
      }

      if (isCtrlOrCmd && (e.key === "s" || e.key === "S")) {
        e.preventDefault();
        handleQuickSave();
        return;
      }

      if (e.code === "Space") {
        e.preventDefault();
        setPlaying((p) => !p);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [undo, redo, handleQuickSave]);

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

  // Variable management helpers
  const handleAddVariable = () => {
    const cleanKey = newVarKey.trim().replace(/^\{+|\}+$/g, "");
    if (!cleanKey) return;
    setVariables((prev) => ({ ...prev, [cleanKey]: newVarValue }));
    setNewVarKey("");
    setNewVarValue("");
  };

  const handleDeleteVariable = (keyToDelete: string) => {
    setVariables((prev) => {
      const copy = { ...prev };
      delete copy[keyToDelete];
      return copy;
    });
  };

  const insertVariableIntoField = (varKey: string, field: "content" | "imageUrl") => {
    if (!selectedElement) return;
    const tag = `{${varKey}}`;
    const currentValue = selectedElement[field] || "";
    updateCurrentElement(selectedElement.id, { [field]: currentValue + tag });
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
    pushCommand({
      type: "REORDER_ELEMENTS",
      description: `Đổi thứ tự layer (#${fromIndex + 1} ↔ #${toIndex + 1})`,
      fromIndex,
      toIndex,
    });
  };

  // Timeline Ruler Scrubbing handler
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

    const trk = tracks.find((t) => t.elementId === elementId);
    const targetKf = trk?.keyframes.find(
      (k) => (k.id || `${elementId}-${k.time}`) === keyframeId
    );
    const initialTime = targetKf?.time ?? time;
    let finalTime = initialTime;

    const rect = laneEl.getBoundingClientRect();
    const updateKeyframeTime = (clientX: number) => {
      const ratio = clamp((clientX - rect.left) / rect.width, 0, 1);
      const newTime = Math.round(ratio * duration);
      finalTime = newTime;
      updateTrack(elementId, (t) => ({
        ...t,
        keyframes: t.keyframes
          .map((k) =>
            (k.id || `${elementId}-${k.time}`) === keyframeId ? { ...k, time: newTime } : k
          )
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
      if (finalTime !== initialTime) {
        pushCommand({
          type: "MOVE_KEYFRAME",
          description: `Chuyển keyframe ${elementId} (${initialTime}ms → ${finalTime}ms)`,
          elementId,
          keyframeId,
          fromTime: initialTime,
          toTime: finalTime,
        });
      }
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

      pushCommand({
        type: "ADD_KEYFRAME",
        description: `Thêm keyframe tại ${Math.round(at)}ms`,
        elementId: id,
        keyframe: k,
      });
    },
    [selectedId, time, canvas.elements, tracks, pushCommand]
  );

  const isTransformProp = (p: string) =>
    p === "x" ||
    p === "y" ||
    p === "width" ||
    p === "height" ||
    p === "rotation" ||
    p === "scaleX" ||
    p === "scaleY" ||
    p === "anchorX" ||
    p === "anchorY";

  const updateKf = (p: KeyframeProperty | "easing", v: any) => {
    if (!selectedKeyframeId) return;
    updateTrack(selectedId, (t) => ({
      ...t,
      keyframes: t.keyframes.map((k) => {
        if ((k.id || `${selectedId}-${k.time}`) !== selectedKeyframeId) return k;
        const next: Keyframe = { ...k, [p]: v };
        if (isTransformProp(p)) {
          const curTransform = k.transform || {
            x: k.x ?? selectedElement?.x ?? 0,
            y: k.y ?? selectedElement?.y ?? 0,
            width: k.width ?? selectedElement?.width ?? 100,
            height: k.height ?? selectedElement?.height ?? 100,
            rotation: k.rotation ?? selectedElement?.rotation ?? 0,
            scaleX: k.scaleX ?? selectedElement?.scaleX ?? 1,
            scaleY: k.scaleY ?? selectedElement?.scaleY ?? 1,
            anchorX: k.anchorX ?? selectedElement?.anchorX ?? 0.5,
            anchorY: k.anchorY ?? selectedElement?.anchorY ?? 0.5,
          };
          next.transform = {
            ...curTransform,
            [p]: v,
          };
        }
        return next;
      }),
    }));
  };

  const updateKfTransform = (patch: Partial<Transform>) => {
    if (!selectedKeyframeId) return;
    updateTrack(selectedId, (t) => ({
      ...t,
      keyframes: t.keyframes.map((k) => {
        if ((k.id || `${selectedId}-${k.time}`) !== selectedKeyframeId) return k;
        const curTransform = k.transform || {
          x: k.x ?? selectedElement?.x ?? 0,
          y: k.y ?? selectedElement?.y ?? 0,
          width: k.width ?? selectedElement?.width ?? 100,
          height: k.height ?? selectedElement?.height ?? 100,
          rotation: k.rotation ?? selectedElement?.rotation ?? 0,
          scaleX: k.scaleX ?? selectedElement?.scaleX ?? 1,
          scaleY: k.scaleY ?? selectedElement?.scaleY ?? 1,
          anchorX: k.anchorX ?? selectedElement?.anchorX ?? 0.5,
          anchorY: k.anchorY ?? selectedElement?.anchorY ?? 0.5,
        };
        const nextTransform = { ...curTransform, ...patch };
        return {
          ...k,
          ...patch,
          transform: nextTransform,
        };
      }),
    }));
  };

  const moveKf = (v: number) => {
    if (!selectedKeyframeId) return;
    const n = Math.round(clamp(v, 0, duration));
    updateTrack(selectedId, (t) => ({
      ...t,
      keyframes: t.keyframes
        .map((k) =>
          (k.id || `${selectedId}-${k.time}`) === selectedKeyframeId ? { ...k, time: n } : k
        )
        .sort((a, b) => a.time - b.time),
    }));
    setTime(n);
  };

  const deleteKf = (kfId = selectedKeyframeId) => {
    if (!kfId || !selectedTrack || selectedTrack.keyframes.length <= 1) return;
    const targetKf = selectedTrack.keyframes.find(
      (k) => (k.id || `${selectedId}-${k.time}`) === kfId
    );
    const kfIndex = selectedTrack.keyframes.findIndex(
      (k) => (k.id || `${selectedId}-${k.time}`) === kfId
    );

    if (targetKf) {
      pushCommand({
        type: "DELETE_KEYFRAME",
        description: `Xóa keyframe tại ${targetKf.time}ms`,
        elementId: selectedId,
        keyframe: targetKf,
        index: kfIndex,
      });
    }

    updateTrack(selectedId, (t) => ({
      ...t,
      keyframes: t.keyframes.filter(
        (k) => (k.id || `${selectedId}-${k.time}`) !== kfId
      ),
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
                    ...(typeof patch.rotation === "number" ? { rotation: patch.rotation } : {}),
                    ...(typeof patch.scaleX === "number" ? { scaleX: patch.scaleX } : {}),
                    ...(typeof patch.scaleY === "number" ? { scaleY: patch.scaleY } : {}),
                    ...(typeof patch.anchorX === "number" ? { anchorX: patch.anchorX } : {}),
                    ...(typeof patch.anchorY === "number" ? { anchorY: patch.anchorY } : {}),
                    ...(typeof patch.opacity === "number" ? { opacity: patch.opacity } : {}),
                    ...(typeof patch.blur === "number" ? { blur: patch.blur } : {}),
                    ...(typeof patch.brightness === "number" ? { brightness: patch.brightness } : {}),
                    ...(typeof patch.saturation === "number" ? { saturation: patch.saturation } : {}),
                    ...(typeof patch.contrast === "number" ? { contrast: patch.contrast } : {}),
                    ...(typeof patch.fontSize === "number" ? { fontSize: patch.fontSize } : {}),
                    ...(typeof patch.letterSpacing === "number" ? { letterSpacing: patch.letterSpacing } : {}),
                    ...(typeof patch.lineHeight === "number" ? { lineHeight: patch.lineHeight } : {}),
                    ...(typeof patch.textShadow === "string" ? { textShadow: patch.textShadow } : {}),
                    ...(typeof patch.color === "string" ? { color: patch.color } : {}),
                    ...(typeof patch.backgroundColor === "string" ? { backgroundColor: patch.backgroundColor } : {}),
                    ...(typeof patch.glowColor === "string" ? { glowColor: patch.glowColor } : {}),
                    ...(typeof patch.glowBlur === "number" ? { glowBlur: patch.glowBlur } : {}),
                    transform: {
                      ...(k.transform || {
                        x: k.x ?? e.x,
                        y: k.y ?? e.y,
                        width: k.width ?? e.width,
                        height: k.height ?? e.height,
                        rotation: k.rotation ?? e.rotation ?? 0,
                        scaleX: k.scaleX ?? e.scaleX ?? 1,
                        scaleY: k.scaleY ?? e.scaleY ?? 1,
                        anchorX: k.anchorX ?? e.anchorX ?? 0.5,
                        anchorY: k.anchorY ?? e.anchorY ?? 0.5,
                      }),
                      ...(typeof patch.x === "number" ? { x: patch.x } : {}),
                      ...(typeof patch.y === "number" ? { y: patch.y } : {}),
                      ...(typeof patch.width === "number" ? { width: patch.width } : {}),
                      ...(typeof patch.height === "number" ? { height: patch.height } : {}),
                      ...(typeof patch.rotation === "number" ? { rotation: patch.rotation } : {}),
                      ...(typeof patch.scaleX === "number" ? { scaleX: patch.scaleX } : {}),
                      ...(typeof patch.scaleY === "number" ? { scaleY: patch.scaleY } : {}),
                      ...(typeof patch.anchorX === "number" ? { anchorX: patch.anchorX } : {}),
                      ...(typeof patch.anchorY === "number" ? { anchorY: patch.anchorY } : {}),
                    },
                  }
                : k
            ),
          }));
        } else {
          const newKf = snapshotKeyframe({ ...e, ...patch }, t, time);
          updateTrack(id, (trk) => ({
            ...trk,
            keyframes: [...(trk.keyframes || []), newKf].sort((a, b) => a.time - b.time),
          }));
          setSelectedKeyframeId(newKf.id ?? null);
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
    const e = rawFrame.elements.find((x) => x.id === id);
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
      if (dragRef.current) {
        const d = dragRef.current;
        const finalEl = canvas.elements.find((x) => x.id === d.id);
        if (finalEl) {
          if (d.mode === "move" && (finalEl.x !== d.start.x || finalEl.y !== d.start.y)) {
            pushCommand({
              type: "MOVE_ELEMENT",
              description: `Di chuyển layer '${finalEl.content ? finalEl.content.slice(0, 16) : finalEl.id}'`,
              elementId: d.id,
              from: { x: d.start.x, y: d.start.y },
              to: { x: finalEl.x, y: finalEl.y },
            });
          } else if (
            d.mode === "resize" &&
            (finalEl.width !== d.start.width || finalEl.height !== d.start.height)
          ) {
            pushCommand({
              type: "RESIZE_ELEMENT",
              description: `Đổi kích thước '${finalEl.content ? finalEl.content.slice(0, 16) : finalEl.id}'`,
              elementId: d.id,
              from: { width: d.start.width, height: d.start.height },
              to: { width: finalEl.width, height: finalEl.height },
            });
          }
        }
        dragRef.current = null;
      }
    };

    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", up);
    return () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
    };
  }, [canvas.width, canvas.height, canvas.elements, updateCurrentElement, pushCommand]);

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
      x: type === "particle" ? 0 : 60,
      y: type === "particle" ? 0 : 60,
      width: type === "text" ? 360 : type === "badge" ? 140 : type === "progress" ? 400 : type === "particle" ? canvas.width : 140,
      height: type === "text" ? 48 : type === "badge" ? 32 : type === "progress" ? 14 : type === "particle" ? canvas.height : 140,
      opacity: 1,
      zIndex: canvas.elements.length,
    };

    if (type === "text") {
      Object.assign(base, {
        content: "New {userName} Layer",
        color: "#ffffff",
        fontSize: 32,
        fontWeight: 600,
        textShadow: "0 0 12px rgba(192, 132, 252, 0.7), 2px 3px 6px rgba(0, 0, 0, 0.85)",
        shadowEnabled: true,
        shadowOffsetX: 2,
        shadowOffsetY: 3,
        shadowBlur: 6,
        shadowColor: "rgba(0, 0, 0, 0.85)",
        glowEnabled: true,
        glowBlur: 12,
        glowColor: "#c084fc",
        glowIntensity: "medium",
      });
    } else if (type === "avatar" || type === "image") {
      Object.assign(base, {
        imageUrl: "{userAVTurl}",
        borderRadius: type === "avatar" ? 999 : 16,
      });
    } else if (type === "badge") {
      Object.assign(base, {
        content: "★ {guildName}",
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
    } else if (type === "particle") {
      Object.assign(base, {
        particleConfig: createDefaultParticleConfig("spark"),
      });
    }

    setCanvas((c) => ({ ...c, elements: [...c.elements, base] }));
    const newTrack: Track = {
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
    };
    setTracks((t) => [...t, newTrack]);
    select(id, `${id}-0`);

    pushCommand({
      type: "ADD_ELEMENT",
      description: `Thêm layer ${type.toUpperCase()}`,
      element: base,
      track: newTrack,
    });
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

    const newTrack: Track = { elementId: newId, keyframes: clonedKeyframes };
    setTracks((t) => [...t, newTrack]);
    select(newId);

    pushCommand({
      type: "ADD_ELEMENT",
      description: `Nhân bản layer '${selectedElement.id}'`,
      element: cloned,
      track: newTrack,
    });
  };

  // Remove Element
  const removeElement = () => {
    if (!selectedElement) return;
    const index = canvas.elements.findIndex((e) => e.id === selectedId);
    const existingTrack = tracks.find((x) => x.elementId === selectedId);

    pushCommand({
      type: "DELETE_ELEMENT",
      description: `Xóa layer '${selectedElement.content ? selectedElement.content.slice(0, 16) : selectedElement.id}'`,
      element: selectedElement,
      track: existingTrack,
      index,
    });

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

  // Export Animation with variables resolved
  const exportAnimation = async () => {
    setExportError(null);
    setExporting(true);
    setExportProgress("Compiling frames on server...");
    try {
      const frames = Array.from({ length: frameCount }, (_, i) => {
        const raw = buildFrame(
          canvas,
          tracks,
          Math.min(duration - 1, Math.round((i * 1000) / fps))
        );
        // Resolve all variables for export
        return {
          ...raw,
          backgroundImageUrl: raw.backgroundImageUrl
            ? parseTemplateString(raw.backgroundImageUrl, variables)
            : undefined,
          elements: raw.elements.map((el) => ({
            ...el,
            content: el.content ? parseTemplateString(el.content, variables) : undefined,
            imageUrl: el.imageUrl ? parseTemplateString(el.imageUrl, variables) : undefined,
          })),
        };
      });

      const payload = JSON.stringify({
        type: "animated",
        data: {
          title: parseTemplateString(canvas.title, variables),
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

      const headerTotal = r.headers.get("X-Total-Generated");
      recordGeneratedImage(headerTotal ? parseInt(headerTotal, 10) : undefined);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName =
        (parseTemplateString(canvas.title, variables) || "animated-banner")
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

  // Helper for serializing clean keyframe tracks
  const cleanTracks = tracks
    .filter((t) => t.keyframes && t.keyframes.length > 0)
    .map((t) => ({
      elementId: t.elementId,
      keyframes: t.keyframes.map((k) => {
        const kf: any = { time: Math.round(k.time) };
        if (k.easing && k.easing !== "ease-in-out") kf.easing = k.easing;
        if (k.x !== undefined) kf.x = Math.round(k.x);
        if (k.y !== undefined) kf.y = Math.round(k.y);
        if (k.width !== undefined) kf.width = Math.round(k.width);
        if (k.height !== undefined) kf.height = Math.round(k.height);
        if (k.rotation !== undefined) kf.rotation = Number(k.rotation.toFixed(2));
        if (k.scaleX !== undefined) kf.scaleX = Number(k.scaleX.toFixed(3));
        if (k.scaleY !== undefined) kf.scaleY = Number(k.scaleY.toFixed(3));
        if (k.anchorX !== undefined) kf.anchorX = Number(k.anchorX.toFixed(3));
        if (k.anchorY !== undefined) kf.anchorY = Number(k.anchorY.toFixed(3));
        if (k.opacity !== undefined) kf.opacity = Number(k.opacity.toFixed(3));
        if (k.blur !== undefined) kf.blur = Number(k.blur.toFixed(2));
        if (k.brightness !== undefined) kf.brightness = Math.round(k.brightness);
        if (k.saturation !== undefined) kf.saturation = Math.round(k.saturation);
        if (k.contrast !== undefined) kf.contrast = Math.round(k.contrast);
        if (k.fontSize !== undefined) kf.fontSize = Math.round(k.fontSize);
        if (k.letterSpacing !== undefined) kf.letterSpacing = Number(k.letterSpacing.toFixed(2));
        if (k.lineHeight !== undefined) kf.lineHeight = Number(k.lineHeight.toFixed(2));
        if (k.color !== undefined) kf.color = k.color;
        if (k.backgroundColor !== undefined) kf.backgroundColor = k.backgroundColor;
        if (k.glowColor !== undefined) kf.glowColor = k.glowColor;
        if (k.glowBlur !== undefined) kf.glowBlur = Math.round(k.glowBlur);
        if (k.textShadow !== undefined) kf.textShadow = k.textShadow;
        if (k.transform !== undefined) {
          kf.transform = k.transform;
        } else if (
          k.x !== undefined || k.y !== undefined || k.width !== undefined ||
          k.height !== undefined || k.rotation !== undefined || k.scaleX !== undefined ||
          k.scaleY !== undefined || k.anchorX !== undefined || k.anchorY !== undefined
        ) {
          kf.transform = {
            ...(k.x !== undefined ? { x: Math.round(k.x) } : {}),
            ...(k.y !== undefined ? { y: Math.round(k.y) } : {}),
            ...(k.width !== undefined ? { width: Math.round(k.width) } : {}),
            ...(k.height !== undefined ? { height: Math.round(k.height) } : {}),
            ...(k.rotation !== undefined ? { rotation: Number(k.rotation.toFixed(2)) } : {}),
            ...(k.scaleX !== undefined ? { scaleX: Number(k.scaleX.toFixed(3)) } : {}),
            ...(k.scaleY !== undefined ? { scaleY: Number(k.scaleY.toFixed(3)) } : {}),
            ...(k.anchorX !== undefined ? { anchorX: Number(k.anchorX.toFixed(3)) } : {}),
            ...(k.anchorY !== undefined ? { anchorY: Number(k.anchorY.toFixed(3)) } : {}),
          };
        }
        return kf;
      }),
    }));

  // Export Single PNG Frame at current playhead time
  const exportCurrentFramePng = async () => {
    setExportError(null);
    setExportingFrame(true);
    const roundedTime = Math.round(time);
    setExportProgress(`Compiling PNG frame at ${roundedTime}ms on server...`);
    try {
      const payload = {
        type: "animated",
        data: {
          title: parseTemplateString(canvas.title, variables),
          format: "png",
          frameTime: roundedTime,
          canvas,
          tracks: cleanTracks,
          templateVariables: variables,
        },
      };

      const r = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "image/png",
        },
        body: JSON.stringify(payload),
      });

      if (!r.ok) {
        const text = await r.text();
        let message = text;
        try {
          message = JSON.parse(text).error || text;
        } catch {}
        throw new Error(message || `Frame generation failed (${r.status})`);
      }

      setExportProgress("Downloading rendered PNG frame...");
      const blob = await r.blob();
      if (!blob.size) throw new Error("The server returned an empty file.");

      const headerTotal = r.headers.get("X-Total-Generated");
      recordGeneratedImage(headerTotal ? parseInt(headerTotal, 10) : undefined);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      const safeName =
        (parseTemplateString(canvas.title, variables) || "animation-frame")
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-+|-+$/g, "") || "animation-frame";
      a.href = url;
      a.download = `${safeName}-${roundedTime}ms.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : String(error));
      console.error("[Animation Studio] Frame PNG export failed:", error);
    } finally {
      setExportingFrame(false);
      setExportProgress("");
    }
  };

  const generatePayload = useCallback(
    (
      mode: "unparsed" | "parsed",
      target: "animation" | "frame-png" = payloadTarget
    ) => {
      const isParsed = mode === "parsed";
      const isFrame = target === "frame-png";

      // Super Compact Keyframes Format exclusively (~98% smaller payload)
      const payloadCanvas = isParsed
        ? {
            ...canvas,
            title: parseTemplateString(canvas.title, variables),
            backgroundImageUrl: canvas.backgroundImageUrl
              ? parseTemplateString(canvas.backgroundImageUrl, variables)
              : undefined,
            elements: canvas.elements.map((el) => ({
              ...el,
              content: el.content ? parseTemplateString(el.content, variables) : undefined,
              imageUrl: el.imageUrl ? parseTemplateString(el.imageUrl, variables) : undefined,
            })),
          }
        : canvas;

      const payloadObj: any = {
        type: "animated",
        data: {
          title: isParsed ? parseTemplateString(canvas.title, variables) : canvas.title,
          format: isFrame ? "png" : format,
          ...(isFrame
            ? { frameTime: Math.round(time) }
            : { duration, fps, loop: 0 }),
          canvas: payloadCanvas,
          tracks: cleanTracks,
        },
      };

      if (!isParsed) {
        payloadObj.data.templateVariables = variables;
      }

      return JSON.stringify(payloadObj, null, 2);
    },
    [canvas, tracks, duration, fps, format, variables, payloadTarget, time]
  );

  const openApiPayloadModal = (
    initialMode: "unparsed" | "parsed" = payloadMode,
    target: "animation" | "frame-png" = payloadTarget
  ) => {
    setPayloadMode(initialMode);
    setPayloadTarget(target);
    setEditablePayloadJson(generatePayload(initialMode, target));
    setShowApiPayloadModal(true);
  };

  const handleSwitchPayloadMode = (newMode: "unparsed" | "parsed") => {
    setPayloadMode(newMode);
    setEditablePayloadJson(generatePayload(newMode, payloadTarget));
  };

  const handleSwitchPayloadTarget = (newTarget: "animation" | "frame-png") => {
    setPayloadTarget(newTarget);
    setEditablePayloadJson(generatePayload(payloadMode, newTarget));
  };

  const handleCopyJson = async () => {
    await navigator.clipboard.writeText(editablePayloadJson);
    setCopiedJson(true);
    setTimeout(() => setCopiedJson(false), 2000);
  };

  const handleCopyCurl = async () => {
    let safeJson = editablePayloadJson;
    try {
      safeJson = JSON.stringify(JSON.parse(editablePayloadJson));
    } catch {}
    const isFrame = payloadTarget === "frame-png";
    const mime = isFrame ? "image/png" : format === "gif" ? "image/gif" : "image/webp";
    const endpoint = isFrame ? "http://localhost:3000/api/animation/frame" : "http://localhost:3000/api/generate";
    const outName = isFrame ? `frame-${Math.round(time)}ms.png` : `animation.${format}`;
    const curl = `curl -X POST ${endpoint} \\\n  -H "Content-Type: application/json" \\\n  -H "Accept: ${mime}" \\\n  -d '${safeJson.replace(/'/g, "'\\''")}' \\\n  --output ${outName}`;
    await navigator.clipboard.writeText(curl);
    setCopiedCurl(true);
    setTimeout(() => setCopiedCurl(false), 2000);
  };

  const handleDownloadPayloadJson = () => {
    const blob = new Blob([editablePayloadJson], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `payload-${payloadTarget}-${payloadMode}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 2000);
  };

  const isJsonValid = useMemo(() => {
    try {
      JSON.parse(editablePayloadJson);
      return true;
    } catch {
      return false;
    }
  }, [editablePayloadJson]);

  const handleTestRenderFromEditor = async () => {
    setExportError(null);
    setIsTestingRender(true);
    setExportProgress("Testing render from custom JSON payload...");
    try {
      const parsed = JSON.parse(editablePayloadJson);
      let payloadToSend = parsed;

      if (parsed.data?.frames) {
        const frames = parsed.data.frames.map((frameItem: any) => ({
          ...frameItem,
          backgroundImageUrl: frameItem.backgroundImageUrl
            ? parseTemplateString(frameItem.backgroundImageUrl, variables)
            : undefined,
          elements: frameItem.elements?.map((el: any) => ({
            ...el,
            content: el.content ? parseTemplateString(el.content, variables) : undefined,
            imageUrl: el.imageUrl ? parseTemplateString(el.imageUrl, variables) : undefined,
          })),
        }));
        payloadToSend = {
          ...parsed,
          data: {
            ...parsed.data,
            frames,
          },
        };
      } else if (parsed.data?.canvas) {
        payloadToSend = {
          ...parsed,
          data: {
            ...parsed.data,
            templateVariables: parsed.data.templateVariables || variables,
          },
        };
      }

      const isPng = parsed.data?.format === "png" || payloadTarget === "frame-png";
      const reqMime = isPng ? "image/png" : format === "gif" ? "image/gif" : "image/webp";
      const ext = isPng ? "png" : format;

      const r = await fetch("/api/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: reqMime,
        },
        body: JSON.stringify(payloadToSend),
      });

      if (!r.ok) {
        const text = await r.text();
        let message = text;
        try {
          message = JSON.parse(text).error || text;
        } catch {}
        throw new Error(message || `Generation failed (${r.status})`);
      }

      const blob = await r.blob();
      if (!blob.size) throw new Error("The server returned an empty file.");

      const headerTotal = r.headers.get("X-Total-Generated");
      recordGeneratedImage(headerTotal ? parseInt(headerTotal, 10) : undefined);

      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = isPng ? `custom-frame-${Math.round(time)}ms.png` : `custom-render.${ext}`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    } catch (err: any) {
      setExportError(err.message || String(err));
    } finally {
      setIsTestingRender(false);
      setExportProgress("");
    }
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
              Interactive timeline, draggable tracks & layers, keyframe sliding, color palette & variable parsing
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Variable Manager Button */}
          <button
            onClick={() => setShowVariableModal(true)}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 hover:border-purple-400 transition"
            title="Quản lý biến mẫu ({userName}, {guildName}, {userAVTurl}...)"
          >
            <SlidersHorizontal className="h-3.5 w-3.5 text-purple-400" />
            <span>Biến số ({Object.keys(variables).length})</span>
          </button>

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
            onClick={() => openApiPayloadModal("unparsed")}
            className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-purple-950/40 px-3 py-2 text-xs font-semibold text-purple-200 hover:bg-purple-900/50 hover:border-purple-400 transition"
            title="Xem, cấu hình (chưa parse / đã parse) và xuất API JSON Payload"
          >
            <Code2 className="h-3.5 w-3.5 text-purple-400" />
            <span>API Payload</span>
          </button>

          <button
            onClick={exportCurrentFramePng}
            disabled={exporting || exportingFrame}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-emerald-900/30 transition hover:from-emerald-500 hover:to-teal-500 disabled:opacity-50"
            title={`Xuất ảnh tĩnh PNG chất lượng cao tại thời điểm frame hiện tại (${Math.round(time)}ms)`}
          >
            {exportingFrame ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Camera className="h-3.5 w-3.5" />
            )}
            <span>{exportingFrame ? "Exporting PNG..." : `Export Frame PNG (${Math.round(time)}ms)`}</span>
          </button>

          <button
            onClick={exportAnimation}
            disabled={exporting || exportingFrame}
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

      {/* Project (.istudio) & Command History Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0d091d]/90 px-4 py-3 shadow-xl backdrop-blur-md">
        {/* Left: Project File Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-xl border border-purple-500/30 bg-black/50 px-3 py-1.5 text-xs shadow-inner">
            <FileCode className="h-4 w-4 text-purple-400 shrink-0" />
            <input
              type="text"
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Tên project"
              className="w-36 sm:w-48 bg-transparent text-xs font-semibold text-white outline-none focus:text-purple-200"
              title="Bấm để đổi tên project"
            />
            <span className="rounded bg-purple-900/60 px-1.5 py-0.5 text-[10px] font-mono font-bold text-purple-300">
              .istudio
            </span>
          </div>

          {/* File operations: New, Open, Save, Save As, Import, Export */}
          <button
            onClick={handleNewProject}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            title="Tạo mới animation project (New)"
          >
            <FilePlus className="h-3.5 w-3.5 text-slate-400" />
            <span>Mới</span>
          </button>

          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            title="Mở file .istudio hoặc .json từ máy tính (Open)"
          >
            <FolderOpen className="h-3.5 w-3.5 text-amber-400" />
            <span>Mở</span>
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".istudio,.json"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleOpenIStudioFile(file);
              e.target.value = "";
            }}
          />

          <button
            onClick={handleQuickSave}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            title="Lưu nhanh vào bộ nhớ trình duyệt (Ctrl+S)"
          >
            <Save className="h-3.5 w-3.5 text-emerald-400" />
            <span>Lưu</span>
          </button>

          <button
            onClick={() => {
              setSaveAsFilename(projectName);
              setShowSaveAsModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            title="Lưu với tên mới hoặc vị trí khác (Save As)"
          >
            <Copy className="h-3.5 w-3.5 text-cyan-400" />
            <span>Lưu thành...</span>
          </button>

          <button
            onClick={() => {
              setImportError(null);
              setImportJsonText("");
              setShowImportModal(true);
            }}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition"
            title="Nhập dữ liệu project từ file hoặc dán JSON (Import)"
          >
            <Upload className="h-3.5 w-3.5 text-sky-400" />
            <span>Nhập</span>
          </button>

          <button
            onClick={handleSaveAsIStudio}
            className="flex items-center gap-1.5 rounded-xl border border-indigo-500/30 bg-indigo-950/40 px-3 py-1.5 text-xs font-semibold text-indigo-200 hover:bg-indigo-900/60 hover:text-white transition shadow-sm"
            title="Xuất tải về máy tính tệp dự án .istudio (Export)"
          >
            <FileDown className="h-3.5 w-3.5 text-indigo-400" />
            <span>Xuất .istudio</span>
          </button>

          {lastSavedNotice && (
            <span className="text-[11px] text-emerald-400 flex items-center gap-1 font-mono animate-in fade-in ml-2">
              <Check className="h-3.5 w-3.5" /> {lastSavedNotice}
            </span>
          )}
        </div>

        {/* Right: History Undo / Redo / History List */}
        <div className="flex items-center gap-1.5 relative">
          <button
            onClick={undo}
            disabled={undoStack.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={`Hoàn tác (Ctrl+Z) - ${undoStack.length > 0 ? undoStack[undoStack.length - 1].description : "Không có thao tác"}`}
          >
            <Undo2 className="h-3.5 w-3.5" />
            <span>Undo</span>
            {undoStack.length > 0 && (
              <span className="ml-0.5 rounded-full bg-purple-500/30 px-1.5 py-0.2 text-[10px] font-mono text-purple-300">
                {undoStack.length}
              </span>
            )}
          </button>

          <button
            onClick={redo}
            disabled={redoStack.length === 0}
            className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-white/10 hover:text-white transition disabled:opacity-40 disabled:cursor-not-allowed"
            title={`Làm lại (Ctrl+Y / Ctrl+Shift+Z) - ${redoStack.length > 0 ? redoStack[redoStack.length - 1].description : "Không có thao tác"}`}
          >
            <Redo2 className="h-3.5 w-3.5" />
            <span>Redo</span>
            {redoStack.length > 0 && (
              <span className="ml-0.5 rounded-full bg-indigo-500/30 px-1.5 py-0.2 text-[10px] font-mono text-indigo-300">
                {redoStack.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setShowHistoryDropdown((v) => !v)}
            className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
              showHistoryDropdown
                ? "border-purple-400 bg-purple-900/40 text-purple-200 ring-2 ring-purple-400/40"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
            }`}
            title="Xem danh sách lịch sử lệnh"
          >
            <HistoryIcon className="h-3.5 w-3.5 text-purple-400" />
            <span className="hidden sm:inline">Lịch sử</span>
          </button>

          {/* Floating History Dropdown */}
          {showHistoryDropdown && (
            <div className="absolute right-0 top-12 z-50 w-80 rounded-2xl border border-white/15 bg-[#140f28] p-3.5 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150">
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5 mb-2.5">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <HistoryIcon className="h-3.5 w-3.5 text-purple-400" />
                  Lịch sử thao tác ({undoStack.length})
                </span>
                <button
                  onClick={() => {
                    setUndoStack([]);
                    setRedoStack([]);
                  }}
                  className="text-[10px] text-slate-400 hover:text-red-400 transition"
                  title="Xóa bộ nhớ lịch sử"
                >
                  Xóa lịch sử
                </button>
              </div>
              {undoStack.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">Chưa có thao tác nào trong bộ nhớ</div>
              ) : (
                <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
                  {[...undoStack].reverse().map((cmd, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between rounded-xl bg-white/5 px-2.5 py-2 text-[11px] text-slate-300 hover:bg-white/10"
                    >
                      <span className="truncate max-w-[200px]">
                        {undoStack.length - idx}. {cmd.description}
                      </span>
                      <span className="font-mono text-[9px] text-purple-400 bg-purple-950/60 border border-purple-500/20 px-1 py-0.5 rounded shrink-0">
                        {cmd.type.replace("_ELEMENT", "").replace("_KEYFRAME", "")}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

      {/* Main 3-Column Layout */}
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
              <button
                onClick={() => addElement("particle")}
                className="col-span-2 flex items-center justify-center gap-1.5 rounded-lg border border-amber-500/30 bg-gradient-to-r from-amber-500/20 via-purple-500/20 to-rose-500/20 p-2 text-[11px] font-semibold text-amber-200 hover:border-amber-400 hover:text-white transition shadow-sm"
                title="Thêm Layer hiệu ứng hạt chuyển động (Particle System)"
              >
                <Sparkles className="h-3.5 w-3.5 text-amber-400 animate-pulse" />
                <span>+ Thêm Particle System</span>
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
                const parsedContent = parseTemplateString(e.content, variables);

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
                        {parsedContent || e.content || e.id}
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
                  {parseTemplateString(canvas.title, variables)}
                </span>
                <span className="rounded bg-white/5 px-2 py-0.5 text-[10px] font-mono text-slate-400">
                  {canvas.width} × {canvas.height}px
                </span>
              </div>

              {/* Zoom & Alignment Controls */}
              <div className="flex items-center gap-2">
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

            {/* Canvas Viewport Box with drag-and-drop .istudio project file support */}
            <div
              ref={previewContainerRef}
              onDragOver={(e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = "copy";
              }}
              onDrop={(e) => {
                e.preventDefault();
                const file = e.dataTransfer.files?.[0];
                if (file && (file.name.endsWith(".istudio") || file.name.endsWith(".json"))) {
                  handleOpenIStudioFile(file);
                }
              }}
              className="relative flex min-h-[380px] max-h-[520px] items-center justify-center overflow-auto rounded-xl border border-white/10 bg-black/50 p-6 group/viewport"
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
                {frame.backgroundImageUrl && (
                  <img
                    src={frame.backgroundImageUrl}
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
                          transform:
                            (e.rotation || (e.scaleX !== undefined && e.scaleX !== 1) || (e.scaleY !== undefined && e.scaleY !== 1))
                              ? `rotate(${e.rotation ?? 0}deg) scale(${e.scaleX ?? 1}, ${e.scaleY ?? 1})`
                              : undefined,
                          transformOrigin: `${(e.anchorX ?? 0.5) * 100}% ${(e.anchorY ?? 0.5) * 100}%`,
                          filter:
                            [
                              e.blur ? `blur(${e.blur}px)` : "",
                              e.brightness !== undefined && e.brightness !== 100 ? `brightness(${e.brightness}%)` : "",
                              e.saturation !== undefined && e.saturation !== 100 ? `saturate(${e.saturation}%)` : "",
                              e.contrast !== undefined && e.contrast !== 100 ? `contrast(${e.contrast}%)` : "",
                            ]
                              .filter(Boolean)
                              .join(" ") || undefined,
                        }}
                      >
                        {/* Visual content */}
                        {e.type === "text" || e.type === "badge" ? (
                          <div
                            className="h-full w-full"
                            style={{
                              color: e.color,
                              textShadow: computeElementTextShadow(e),
                              background: e.type === "badge" ? e.backgroundColor : undefined,
                              borderRadius: (e.borderRadius ?? 0) * zoom,
                              border: e.border,
                              fontSize: (e.fontSize ?? 24) * zoom,
                              fontWeight: e.fontWeight ?? 400,
                              letterSpacing: e.letterSpacing !== undefined ? `${e.letterSpacing * zoom}px` : undefined,
                              lineHeight: e.lineHeight ?? 1.2,
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
                              overflow: e.type === "text" ? "visible" : "hidden",
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
                        ) : e.type === "particle" ? (
                          <div
                            className="h-full w-full relative overflow-hidden pointer-events-none"
                            style={{
                              borderRadius: (e.borderRadius ?? 0) * zoom,
                              border: e.border,
                            }}
                          >
                            <ParticleCanvas
                              config={e.particleConfig || createDefaultParticleConfig("spark")}
                              width={Math.round(e.width * zoom)}
                              height={Math.round(e.height * zoom)}
                              timeMs={time}
                              playing={playing}
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
                <button
                  onClick={exportCurrentFramePng}
                  disabled={exporting || exportingFrame}
                  className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-950/40 px-2.5 py-1 text-[11px] font-semibold text-emerald-300 hover:bg-emerald-900/50 hover:border-emerald-400 transition disabled:opacity-50"
                  title={`Xuất ảnh PNG frame này (${Math.round(time)}ms)`}
                >
                  <Camera className="h-3.5 w-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">Snap PNG</span>
                </button>
              </div>
            </div>
          </div>

          {/* Interactive Multi-track Timeline */}
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

                  {/* Interactive Ruler Header */}
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

                    {/* Draggable Playhead Scrubber Badge */}
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

                {/* Track Rows */}
                {canvas.elements.map((e, index) => {
                  const t = tracks.find((x) => x.elementId === e.id);
                  const isTrackSelected = selectedId === e.id;
                  const keyframes = t?.keyframes || [];
                  const isDragging = draggedElementIndex === index;
                  const isOver = dragOverElementIndex === index;
                  const parsedContent = parseTemplateString(e.content, variables);

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
                      {/* Track Header with Drag Handle */}
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
                        <span className="truncate flex-1">{parsedContent || e.content || e.id}</span>
                      </div>

                      {/* Track keyframes lane */}
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

                        {/* Keyframe diamonds */}
                        {keyframes.map((k) => {
                          const kfId = k.id || `${e.id}-${k.time}`;
                          const isKfSelected = selectedKeyframeId === kfId && isTrackSelected;
                          return (
                            <div
                              key={kfId}
                              onPointerDown={(ev) => {
                                const laneEl = ev.currentTarget.parentElement as HTMLDivElement;
                                beginKeyframeDrag(ev, e.id, kfId, laneEl);
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
          {/* Keyframe Inspector Panel */}
          {selectedKeyframe && (
            <div className="rounded-2xl border border-purple-500/30 bg-purple-950/30 p-4 shadow-xl backdrop-blur-md space-y-3.5 max-h-[600px] overflow-y-auto pr-1">
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
                    className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
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
                    <option value="elastic">Elastic</option>
                    <option value="spring">Spring</option>
                  </select>
                </label>
              </div>

              {/* 1. POSITION */}
              <div className="rounded-xl border border-white/5 bg-black/25 p-2.5 space-y-2">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300 flex items-center gap-1">
                  <span>📍 Position</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[11px] text-slate-400">
                    X
                    <input
                      type="number"
                      value={selectedKeyframe.x ?? selectedElement?.x ?? 0}
                      onChange={(e) => updateKf("x", Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-400">
                    Y
                    <input
                      type="number"
                      value={selectedKeyframe.y ?? selectedElement?.y ?? 0}
                      onChange={(e) => updateKf("y", Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                </div>
              </div>

              {/* 2. TRANSFORM (Width, Height, Rotation, Scale X, Scale Y, Anchor) */}
              <div className="rounded-xl border border-white/5 bg-black/25 p-2.5 space-y-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300 flex items-center justify-between">
                  <span>🔄 Transform</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const tr = {
                          transform: {
                            x: Math.round(selectedKeyframe.x ?? selectedElement?.x ?? 0),
                            y: Math.round(selectedKeyframe.y ?? selectedElement?.y ?? 0),
                            width: Math.round(selectedKeyframe.width ?? selectedElement?.width ?? 100),
                            height: Math.round(selectedKeyframe.height ?? selectedElement?.height ?? 100),
                            rotation: Number((selectedKeyframe.rotation ?? selectedElement?.rotation ?? 0).toFixed(2)),
                            scaleX: Number((selectedKeyframe.scaleX ?? selectedElement?.scaleX ?? 1).toFixed(3)),
                            scaleY: Number((selectedKeyframe.scaleY ?? selectedElement?.scaleY ?? 1).toFixed(3)),
                            anchorX: Number((selectedKeyframe.anchorX ?? selectedElement?.anchorX ?? 0.5).toFixed(3)),
                            anchorY: Number((selectedKeyframe.anchorY ?? selectedElement?.anchorY ?? 0.5).toFixed(3)),
                          },
                        };
                        navigator.clipboard.writeText(JSON.stringify(tr, null, 2));
                        setCopiedTransformKf(true);
                        setTimeout(() => setCopiedTransformKf(false), 2000);
                      }}
                      className="text-[9px] text-purple-400 hover:text-purple-300 underline font-medium"
                      title="Sao chép đối tượng transform thống nhất theo chuẩn interface Transform"
                    >
                      {copiedTransformKf ? "✓ Đã chép JSON" : "Copy Transform JSON"}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        updateKf("rotation", 0);
                        updateKf("scaleX", 1);
                        updateKf("scaleY", 1);
                      }}
                      className="text-[9px] text-slate-400 hover:text-purple-300 underline"
                      title="Reset Rotation & Scale to defaults"
                    >
                      Reset 0°/1x
                    </button>
                  </div>
                </div>

                {/* Size: Width & Height */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[11px] text-slate-400">
                    Width
                    <input
                      type="number"
                      value={selectedKeyframe.width ?? selectedElement?.width ?? 100}
                      onChange={(e) => updateKf("width", Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                  <label className="block text-[11px] text-slate-400">
                    Height
                    <input
                      type="number"
                      value={selectedKeyframe.height ?? selectedElement?.height ?? 100}
                      onChange={(e) => updateKf("height", Number(e.target.value))}
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                </div>

                {/* Rotation: Slider & Input */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Rotation</span>
                    <div className="flex items-center gap-1">
                      <span className="font-mono text-purple-300 font-medium">
                        {Math.round(selectedKeyframe.rotation ?? selectedElement?.rotation ?? 0)}°
                      </span>
                      <button
                        type="button"
                        onClick={() => updateKf("rotation", 0)}
                        className="text-[9px] text-slate-500 hover:text-white px-1 rounded bg-white/5"
                        title="Set rotation to 0°"
                      >
                        0°
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedKeyframe.rotation ?? selectedElement?.rotation ?? 0}
                      onChange={(e) => updateKf("rotation", Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="-360"
                      max="360"
                      value={selectedKeyframe.rotation ?? selectedElement?.rotation ?? 0}
                      onChange={(e) => updateKf("rotation", Number(e.target.value))}
                      className="w-16 rounded-lg border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-right text-white font-mono"
                    />
                  </div>
                  {/* Quick rotation degree chips */}
                  <div className="flex items-center gap-1 pt-0.5">
                    {[-45, -15, -10, 0, 10, 15, 45, 90].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => updateKf("rotation", deg)}
                        className={`text-[9px] px-1 py-0.5 rounded font-mono transition ${
                          Math.round(selectedKeyframe.rotation ?? selectedElement?.rotation ?? 0) === deg
                            ? "bg-purple-600 text-white font-bold"
                            : "bg-white/5 text-slate-400 hover:bg-white/10 hover:text-white"
                        }`}
                      >
                        {deg}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Scale X & Scale Y */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Scale X</span>
                      <span className="font-mono text-purple-300">
                        {Number((selectedKeyframe.scaleX ?? selectedElement?.scaleX ?? 1).toFixed(2))}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.05"
                      value={selectedKeyframe.scaleX ?? selectedElement?.scaleX ?? 1}
                      onChange={(e) => updateKf("scaleX", Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Scale Y</span>
                      <span className="font-mono text-purple-300">
                        {Number((selectedKeyframe.scaleY ?? selectedElement?.scaleY ?? 1).toFixed(2))}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.05"
                      value={selectedKeyframe.scaleY ?? selectedElement?.scaleY ?? 1}
                      onChange={(e) => updateKf("scaleY", Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Anchor Point X & Y */}
                <div className="pt-1 border-t border-white/5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                    <span>Anchor (Tâm xoay)</span>
                    <div className="flex items-center gap-1 text-[9px]">
                      <button
                        type="button"
                        onClick={() => {
                          updateKf("anchorX", 0.5);
                          updateKf("anchorY", 0.5);
                        }}
                        className="px-1 py-0.5 rounded bg-white/5 hover:bg-purple-900/50 hover:text-white"
                      >
                        Center (50%)
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          updateKf("anchorX", 0);
                          updateKf("anchorY", 0);
                        }}
                        className="px-1 py-0.5 rounded bg-white/5 hover:bg-purple-900/50 hover:text-white"
                      >
                        Top-Left
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[10px] text-slate-500">
                      Anchor X (0..1)
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedKeyframe.anchorX ?? selectedElement?.anchorX ?? 0.5}
                        onChange={(e) => updateKf("anchorX", Number(e.target.value))}
                        className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                    </label>
                    <label className="block text-[10px] text-slate-500">
                      Anchor Y (0..1)
                      <input
                        type="number"
                        min="0"
                        max="1"
                        step="0.1"
                        value={selectedKeyframe.anchorY ?? selectedElement?.anchorY ?? 0.5}
                        onChange={(e) => updateKf("anchorY", Number(e.target.value))}
                        className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                    </label>
                  </div>
                </div>
              </div>

              {/* 3. APPEARANCE (Opacity, Blur, Brightness, Saturation, Contrast) */}
              <div className="rounded-xl border border-white/5 bg-black/25 p-2.5 space-y-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                  ✨ Appearance & Filters
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                    <span>Opacity</span>
                    <span className="font-mono text-purple-300">
                      {Math.round((selectedKeyframe.opacity ?? selectedElement?.opacity ?? 1) * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedKeyframe.opacity ?? selectedElement?.opacity ?? 1}
                    onChange={(e) => updateKf("opacity", Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                    <span>Blur (Độ mờ)</span>
                    <span className="font-mono text-purple-300">
                      {selectedKeyframe.blur ?? selectedElement?.blur ?? 0}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={selectedKeyframe.blur ?? selectedElement?.blur ?? 0}
                    onChange={(e) => updateKf("blur", Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Brightness & Contrast */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Brightness</span>
                      <span className="font-mono text-purple-300">
                        {selectedKeyframe.brightness ?? selectedElement?.brightness ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="5"
                      value={selectedKeyframe.brightness ?? selectedElement?.brightness ?? 100}
                      onChange={(e) => updateKf("brightness", Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                      <span>Contrast</span>
                      <span className="font-mono text-purple-300">
                        {selectedKeyframe.contrast ?? selectedElement?.contrast ?? 100}%
                      </span>
                    </div>
                    <input
                      type="range"
                      min="20"
                      max="200"
                      step="5"
                      value={selectedKeyframe.contrast ?? selectedElement?.contrast ?? 100}
                      onChange={(e) => updateKf("contrast", Number(e.target.value))}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Saturation */}
                <div>
                  <div className="flex justify-between text-[11px] text-slate-400 mb-0.5">
                    <span>Saturation (Độ bão hòa màu)</span>
                    <span className="font-mono text-purple-300">
                      {selectedKeyframe.saturation ?? selectedElement?.saturation ?? 100}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="200"
                    step="5"
                    value={selectedKeyframe.saturation ?? selectedElement?.saturation ?? 100}
                    onChange={(e) => updateKf("saturation", Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>
              </div>

              {/* 4. COLOR & GLOW */}
              <div className="rounded-xl border border-white/5 bg-black/25 p-2.5 space-y-2.5">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                  🎨 Color & Glow
                </div>

                {selectedElement?.type === "text" || selectedElement?.type === "badge" ? (
                  <ColorPalettePicker
                    label="Màu chữ (Text Color)"
                    value={selectedKeyframe.color || selectedElement?.color || "#ffffff"}
                    onChange={(newCol) => updateKf("color", newCol)}
                  />
                ) : null}

                {selectedElement?.type === "badge" || selectedElement?.type === "box" || selectedElement?.type === "progress" ? (
                  <ColorPalettePicker
                    label="Màu nền (Background)"
                    value={selectedKeyframe.backgroundColor || selectedElement?.backgroundColor || "#7c3aed"}
                    onChange={(newCol) => updateKf("backgroundColor", newCol)}
                  />
                ) : null}

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Glow Blur</span>
                    <span className="font-mono text-purple-300">
                      {selectedKeyframe.glowBlur ?? selectedElement?.glowBlur ?? 16}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={selectedKeyframe.glowBlur ?? selectedElement?.glowBlur ?? 16}
                    onChange={(e) => updateKf("glowBlur", Number(e.target.value))}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                <ColorPalettePicker
                  label="Màu hào quang (Glow Color)"
                  value={selectedKeyframe.glowColor || selectedElement?.glowColor || "#c084fc"}
                  onChange={(newCol) => updateKf("glowColor", newCol)}
                />
              </div>

              {/* 5. TYPOGRAPHY (For text/badge) */}
              {(selectedElement?.type === "text" || selectedElement?.type === "badge") && (
                <div className="rounded-xl border border-white/5 bg-black/25 p-2.5 space-y-2.5">
                  <div className="text-[10px] font-semibold uppercase tracking-wider text-purple-300">
                    ✍️ Typography
                  </div>
                  <div className="grid grid-cols-3 gap-1.5">
                    <label className="block text-[10px] text-slate-400">
                      Font Size
                      <input
                        type="number"
                        value={selectedKeyframe.fontSize ?? selectedElement?.fontSize ?? 24}
                        onChange={(e) => updateKf("fontSize", Number(e.target.value))}
                        className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                    </label>
                    <label className="block text-[10px] text-slate-400">
                      Spacing
                      <input
                        type="number"
                        step="0.5"
                        value={selectedKeyframe.letterSpacing ?? selectedElement?.letterSpacing ?? 0}
                        onChange={(e) => updateKf("letterSpacing", Number(e.target.value))}
                        className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                    </label>
                    <label className="block text-[10px] text-slate-400">
                      Line Height
                      <input
                        type="number"
                        step="0.1"
                        value={selectedKeyframe.lineHeight ?? selectedElement?.lineHeight ?? 1.2}
                        onChange={(e) => updateKf("lineHeight", Number(e.target.value))}
                        className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                    </label>
                  </div>

                  {/* Text Shadow */}
                  <div className="space-y-1.5 pt-1.5 border-t border-white/5">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span>Text Shadow & Glow</span>
                      {selectedKeyframe.textShadow && (
                        <button
                          type="button"
                          onClick={() => updateKf("textShadow", "")}
                          className="text-[9px] text-red-400 hover:text-red-300 underline"
                        >
                          Tắt hiệu ứng
                        </button>
                      )}
                    </div>

                    <select
                      value={
                        TEXT_SHADOW_PRESETS.find((p) => p.value === (selectedKeyframe.textShadow ?? selectedElement?.textShadow))?.id ||
                        (selectedKeyframe.textShadow ? "custom" : "none")
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "none") {
                          updateKf("textShadow", "");
                        } else if (val === "custom") {
                          // keep current custom value
                        } else {
                          const p = TEXT_SHADOW_PRESETS.find((x) => x.id === val);
                          if (p) updateKf("textShadow", p.value);
                        }
                      }}
                      className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    >
                      {TEXT_SHADOW_PRESETS.map((preset) => (
                        <option key={preset.id} value={preset.id}>
                          {preset.name} {preset.value ? `(${preset.value.slice(0, 24)}...)` : "(Tắt)"}
                        </option>
                      ))}
                      <option value="custom">Tự tùy chỉnh (Custom CSS)</option>
                    </select>

                    <input
                      type="text"
                      placeholder="e.g. 0 0 16px #c084fc, 2px 3px 6px rgba(0,0,0,0.85)"
                      value={selectedKeyframe.textShadow ?? selectedElement?.textShadow ?? ""}
                      onChange={(e) => updateKf("textShadow", e.target.value)}
                      className="w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono text-[11px]"
                    />
                  </div>
                </div>
              )}
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

              {/* Text content if text or badge with Variable insert chips */}
              {(selectedElement.type === "text" || selectedElement.type === "badge") && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400">Content (Nội dung)</label>
                    <button
                      type="button"
                      onClick={() => setShowVariableModal(true)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Thêm biến</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={selectedElement.content || ""}
                    onChange={(e) => updateCurrentElement(selectedElement.id, { content: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                  />

                  {/* Variable quick insert chips */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-500">Chèn:</span>
                    {Object.keys(variables).map((varKey) => (
                      <button
                        key={varKey}
                        type="button"
                        onClick={() => insertVariableIntoField(varKey, "content")}
                        className="rounded bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-mono text-purple-300 hover:bg-purple-800 hover:text-white transition"
                        title={`Chèn {${varKey}} = "${variables[varKey]}"`}
                      >
                        +{`{${varKey}}`}
                      </button>
                    ))}
                  </div>

                  {/* Live parsed preview */}
                  {selectedElement.content && selectedElement.content.includes("{") && (
                    <div className="rounded-lg bg-black/40 border border-white/5 p-2 text-[11px] text-slate-300">
                      <span className="text-[10px] font-semibold text-purple-400 uppercase tracking-wide block mb-0.5">
                        👉 Đã parse:
                      </span>
                      <span className="break-words font-medium">
                        {parseTemplateString(selectedElement.content, variables)}
                      </span>
                    </div>
                  )}
                </div>
              )}

              {/* Typography & Color Palette for text */}
              {selectedElement.type === "text" && (
                <div className="space-y-3 pt-2 border-t border-white/5">
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
                  </div>

                  {/* Text Color with Color Palette */}
                  <ColorPalettePicker
                    label="Màu chữ (Text Color)"
                    value={selectedElement.color || "#ffffff"}
                    onChange={(newColor) => updateCurrentElement(selectedElement.id, { color: newColor })}
                  />

                  <label className="block text-[11px] text-slate-400">
                    Căn lề (Align)
                    <select
                      value={selectedElement.textAlign || "left"}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, {
                          textAlign: e.target.value as "left" | "center" | "right",
                        })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    >
                      <option value="left">Trái (Left)</option>
                      <option value="center">Giữa (Center)</option>
                      <option value="right">Phải (Right)</option>
                    </select>
                  </label>

                  {/* Text Drop Shadow & Outer Glow Controls */}
                  <TextShadowControlPanel
                    element={selectedElement}
                    onChange={(patch) => updateCurrentElement(selectedElement.id, patch)}
                  />
                </div>
              )}

              {/* Image URL for avatar / image with Variable chips */}
              {(selectedElement.type === "image" || selectedElement.type === "avatar") && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-[11px] text-slate-400">Image URL</label>
                    <button
                      type="button"
                      onClick={() => setShowVariableModal(true)}
                      className="text-[10px] text-purple-400 hover:text-purple-300 flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Thêm biến</span>
                    </button>
                  </div>

                  <input
                    type="text"
                    value={selectedElement.imageUrl || ""}
                    onChange={(e) => updateCurrentElement(selectedElement.id, { imageUrl: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    placeholder="https://... hoặc {userAVTurl}"
                  />

                  {/* Variable quick insert chips for image */}
                  <div className="flex flex-wrap items-center gap-1 pt-0.5">
                    <span className="text-[10px] text-slate-500">Chèn:</span>
                    {Object.keys(variables).map((varKey) => (
                      <button
                        key={varKey}
                        type="button"
                        onClick={() => insertVariableIntoField(varKey, "imageUrl")}
                        className="rounded bg-purple-950/60 border border-purple-500/30 px-1.5 py-0.5 text-[10px] font-mono text-purple-300 hover:bg-purple-800 hover:text-white transition"
                        title={`Chèn {${varKey}}`}
                      >
                        +{`{${varKey}}`}
                      </button>
                    ))}
                  </div>

                  {/* Live parsed preview */}
                  {selectedElement.imageUrl && selectedElement.imageUrl.includes("{") && (
                    <div className="rounded-lg bg-black/40 border border-white/5 p-2 text-[10px] text-slate-400 break-all font-mono">
                      <span className="text-purple-400 font-semibold block mb-0.5">URL sau khi parse:</span>
                      {parseTemplateString(selectedElement.imageUrl, variables)}
                    </div>
                  )}

                  {/* Border radius */}
                  <label className="block text-[11px] text-slate-400 pt-1">
                    Bo góc (Border Radius)
                    <input
                      type="number"
                      value={selectedElement.borderRadius ?? (selectedElement.type === "avatar" ? 999 : 12)}
                      onChange={(e) =>
                        updateCurrentElement(selectedElement.id, { borderRadius: Number(e.target.value) })
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                    />
                  </label>
                </div>
              )}

              {/* Progress properties */}
              {selectedElement.type === "progress" && (
                <div className="space-y-3">
                  <div className="space-y-1">
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
                  </div>

                  <ColorPalettePicker
                    label="Màu thanh chạy (Progress Bar Color)"
                    value={selectedElement.progressColor || "#a855f7"}
                    onChange={(newColor) =>
                      updateCurrentElement(selectedElement.id, { progressColor: newColor })
                    }
                  />

                  <ColorPalettePicker
                    label="Màu nền thanh (Track Background)"
                    value={selectedElement.backgroundColor || "rgba(255,255,255,0.1)"}
                    onChange={(newColor) =>
                      updateCurrentElement(selectedElement.id, { backgroundColor: newColor })
                    }
                  />
                </div>
              )}

              {/* Colors & borders for Badge or Box */}
              {(selectedElement.type === "badge" || selectedElement.type === "box") && (
                <div className="space-y-3">
                  <ColorPalettePicker
                    label="Màu nền (Background Color)"
                    value={selectedElement.backgroundColor || "#7c3aed"}
                    onChange={(newColor) =>
                      updateCurrentElement(selectedElement.id, { backgroundColor: newColor })
                    }
                  />

                  {selectedElement.type === "badge" && (
                    <ColorPalettePicker
                      label="Màu chữ (Text Color)"
                      value={selectedElement.color || "#ffffff"}
                      onChange={(newColor) => updateCurrentElement(selectedElement.id, { color: newColor })}
                    />
                  )}

                  <label className="block text-[11px] text-slate-400">
                    Border (Viền)
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

                  {selectedElement.type === "badge" && (
                    <TextShadowControlPanel
                      element={selectedElement}
                      onChange={(patch) => updateCurrentElement(selectedElement.id, patch)}
                    />
                  )}
                </div>
              )}

              {/* Particle System Properties */}
              {selectedElement.type === "particle" && (
                <div className="pt-1">
                  <ParticleControlPanel
                    config={selectedElement.particleConfig || createDefaultParticleConfig("spark")}
                    onChange={(newConfig) => {
                      updateCurrentElement(selectedElement.id, {
                        particleConfig: newConfig,
                      });
                    }}
                  />
                </div>
              )}

              {/* Extended Typography for text or badge */}
              {(selectedElement.type === "text" || selectedElement.type === "badge") && (
                <div className="rounded-xl border border-white/5 bg-black/20 p-2.5 space-y-2">
                  <div className="text-[11px] font-semibold text-slate-300">
                    ✍️ Typography chi tiết
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="block text-[10px] text-slate-400">
                      Letter Spacing (px)
                      <input
                        type="number"
                        step="0.5"
                        value={selectedElement.letterSpacing ?? 0}
                        onChange={(e) =>
                          updateCurrentElement(selectedElement.id, { letterSpacing: Number(e.target.value) })
                        }
                        className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                    </label>
                    <label className="block text-[10px] text-slate-400">
                      Line Height
                      <input
                        type="number"
                        step="0.1"
                        value={selectedElement.lineHeight ?? 1.2}
                        onChange={(e) =>
                          updateCurrentElement(selectedElement.id, { lineHeight: Number(e.target.value) })
                        }
                        className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Position & Transform Controls for Element */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-2.5 space-y-2.5">
                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-300">
                  <span>🔄 Transform & Vị trí</span>
                  <button
                    type="button"
                    onClick={() =>
                      updateCurrentElement(selectedElement.id, {
                        rotation: 0,
                        scaleX: 1,
                        scaleY: 1,
                      })
                    }
                    className="text-[9px] text-slate-400 hover:text-purple-300 underline"
                  >
                    Reset 0°/1x
                  </button>
                </div>

                {/* X & Y */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] text-slate-400">
                    X (px)
                    <input
                      type="number"
                      value={selectedElement.x}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { x: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                  <label className="block text-[10px] text-slate-400">
                    Y (px)
                    <input
                      type="number"
                      value={selectedElement.y}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { y: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                </div>

                {/* Width & Height */}
                <div className="grid grid-cols-2 gap-2">
                  <label className="block text-[10px] text-slate-400">
                    Width (px)
                    <input
                      type="number"
                      value={selectedElement.width}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { width: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                  <label className="block text-[10px] text-slate-400">
                    Height (px)
                    <input
                      type="number"
                      value={selectedElement.height}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { height: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono"
                    />
                  </label>
                </div>

                {/* Rotation */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] text-slate-400">
                    <span>Rotation (° Xoay)</span>
                    <span className="font-mono text-purple-300 font-medium">{Math.round(selectedElement.rotation ?? 0)}°</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="range"
                      min="-180"
                      max="180"
                      step="1"
                      value={selectedElement.rotation ?? 0}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { rotation: Number(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                    <input
                      type="number"
                      min="-360"
                      max="360"
                      value={selectedElement.rotation ?? 0}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { rotation: Number(e.target.value) })}
                      className="w-16 rounded border border-white/10 bg-black/40 px-1.5 py-1 text-xs text-right text-white font-mono"
                    />
                  </div>
                </div>

                {/* Scale X & Scale Y */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Scale X</span>
                      <span className="font-mono text-purple-300">
                        {Number((selectedElement.scaleX ?? 1).toFixed(2))}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.05"
                      value={selectedElement.scaleX ?? 1}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { scaleX: Number(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Scale Y</span>
                      <span className="font-mono text-purple-300">
                        {Number((selectedElement.scaleY ?? 1).toFixed(2))}x
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="3"
                      step="0.05"
                      value={selectedElement.scaleY ?? 1}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { scaleY: Number(e.target.value) })}
                      className="w-full accent-purple-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Anchor Point X & Y */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <label className="block text-[10px] text-slate-500">
                    Anchor X (0..1)
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedElement.anchorX ?? 0.5}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { anchorX: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none font-mono"
                    />
                  </label>
                  <label className="block text-[10px] text-slate-500">
                    Anchor Y (0..1)
                    <input
                      type="number"
                      min="0"
                      max="1"
                      step="0.1"
                      value={selectedElement.anchorY ?? 0.5}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { anchorY: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-2 py-1 text-xs text-white outline-none font-mono"
                    />
                  </label>
                </div>
              </div>

              {/* Appearance Filters for Element */}
              <div className="rounded-xl border border-white/5 bg-black/20 p-2.5 space-y-2">
                <div className="text-[11px] font-semibold text-slate-300">
                  ✨ Appearance & Hiệu ứng
                </div>

                {/* Opacity */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Opacity (Độ trong suốt)</span>
                    <span className="font-mono text-purple-300">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={selectedElement.opacity ?? 1}
                    onChange={(e) => updateCurrentElement(selectedElement.id, { opacity: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Blur */}
                <div>
                  <div className="flex justify-between text-[10px] text-slate-400 mb-0.5">
                    <span>Blur (Độ mờ)</span>
                    <span className="font-mono text-purple-300">{selectedElement.blur ?? 0}px</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="20"
                    step="0.5"
                    value={selectedElement.blur ?? 0}
                    onChange={(e) => updateCurrentElement(selectedElement.id, { blur: Number(e.target.value) })}
                    className="w-full accent-purple-500 cursor-pointer"
                  />
                </div>

                {/* Brightness, Contrast, Saturation */}
                <div className="grid grid-cols-3 gap-1.5 pt-0.5">
                  <label className="block text-[9px] text-slate-400">
                    Brightness
                    <input
                      type="number"
                      min="20"
                      max="200"
                      step="5"
                      value={selectedElement.brightness ?? 100}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { brightness: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1 py-1 text-xs text-white outline-none font-mono"
                    />
                  </label>
                  <label className="block text-[9px] text-slate-400">
                    Contrast
                    <input
                      type="number"
                      min="20"
                      max="200"
                      step="5"
                      value={selectedElement.contrast ?? 100}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { contrast: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1 py-1 text-xs text-white outline-none font-mono"
                    />
                  </label>
                  <label className="block text-[9px] text-slate-400">
                    Saturate
                    <input
                      type="number"
                      min="0"
                      max="200"
                      step="5"
                      value={selectedElement.saturation ?? 100}
                      onChange={(e) => updateCurrentElement(selectedElement.id, { saturation: Number(e.target.value) })}
                      className="mt-0.5 w-full rounded border border-white/10 bg-black/40 px-1 py-1 text-xs text-white outline-none font-mono"
                    />
                  </label>
                </div>
              </div>
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
                  placeholder="https://.../ambient.gif hoặc {bgUrl}"
                />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* Template Variables Management Modal */}
      {showVariableModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl border border-purple-500/30 bg-[#0f0b21] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5 text-purple-400" />
                <h3 className="text-base font-bold text-white">Quản lý Biến số (Template Variables)</h3>
              </div>
              <button
                onClick={() => setShowVariableModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Các biến số sẽ tự động được parse trong <strong>Text Content</strong> và <strong>Image URL</strong> khi nhập định dạng <code className="text-purple-300 font-mono font-semibold">{"{tênBiến}"}</code>.
            </p>

            {/* List of existing variables */}
            <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
              {Object.entries(variables).map(([key, val]) => (
                <div
                  key={key}
                  className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 p-2.5"
                >
                  <div className="w-28 flex-shrink-0">
                    <span className="text-xs font-mono font-bold text-purple-300 block truncate">
                      {`{${key}}`}
                    </span>
                  </div>
                  <input
                    type="text"
                    value={val}
                    onChange={(e) => {
                      const updatedValue = e.target.value;
                      setVariables((prev) => ({ ...prev, [key]: updatedValue }));
                    }}
                    className="w-full rounded-lg border border-white/10 bg-white/5 px-2.5 py-1 text-xs text-white outline-none focus:border-purple-500 font-mono truncate"
                  />
                  <button
                    onClick={() => handleDeleteVariable(key)}
                    className="rounded p-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 flex-shrink-0"
                    title="Xóa biến"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new variable section */}
            <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 space-y-2">
              <span className="text-xs font-semibold text-purple-300 block">Thêm biến mới:</span>
              <div className="grid grid-cols-[130px_1fr_auto] gap-2">
                <input
                  type="text"
                  placeholder="tênBiến (vd: role)"
                  value={newVarKey}
                  onChange={(e) => setNewVarKey(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500 font-mono"
                />
                <input
                  type="text"
                  placeholder="giá trị (vd: Admin / URL)"
                  value={newVarValue}
                  onChange={(e) => setNewVarValue(e.target.value)}
                  className="rounded-lg border border-white/10 bg-black/50 px-2.5 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                />
                <button
                  onClick={handleAddVariable}
                  disabled={!newVarKey.trim()}
                  className="rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition"
                >
                  Thêm
                </button>
              </div>
            </div>

            {/* Modal actions */}
            <div className="flex items-center justify-between border-t border-white/10 pt-3">
              <button
                onClick={() => setVariables(DEFAULT_TEMPLATE_VARIABLES)}
                className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Khôi phục mặc định</span>
              </button>

              <button
                onClick={() => setShowVariableModal(false)}
                className="rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-md hover:bg-purple-500 transition"
              >
                Xong
              </button>
            </div>
          </div>
        </div>
      )}

      {/* API Payload Inspector & Exporter Modal */}
      {showApiPayloadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md">
          <div className="relative flex flex-col w-full max-w-3xl max-h-[90vh] rounded-2xl border border-purple-500/30 bg-[#0e0a1f] p-5 shadow-2xl space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-400" />
                <div>
                  <h3 className="text-base font-bold text-white">API Payload Inspector & Exporter</h3>
                  <p className="text-[11px] text-slate-400">
                    Cấu hình và xuất JSON payload gửi tới <code className="text-purple-300 font-mono">POST /api/generate</code>
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowApiPayloadModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:text-white hover:bg-white/10"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Modal Controls: Định dạng xuất & Biến số */}
            <div className="flex flex-wrap items-center justify-between gap-3 bg-black/40 p-3 rounded-xl border border-white/10">
              {/* Target Switcher (Full Animation vs Single Frame PNG) */}
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs text-slate-400 font-medium">Mục tiêu:</span>
                  <button
                    type="button"
                    onClick={() => handleSwitchPayloadTarget("animation")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      payloadTarget === "animation"
                        ? "bg-purple-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    🎬 Cả Animation ({format.toUpperCase()})
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchPayloadTarget("frame-png")}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                      payloadTarget === "frame-png"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    📸 Frame PNG ({Math.round(time)}ms)
                  </button>
                </div>

                {/* Variables Switcher (Unparsed vs Parsed) */}
                <div className="flex items-center gap-1.5 border-l border-white/10 pl-3">
                  <span className="text-xs text-slate-400 font-medium">Biến:</span>
                  <button
                    type="button"
                    onClick={() => handleSwitchPayloadMode("unparsed")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      payloadMode === "unparsed"
                        ? "bg-purple-600/80 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    📄 Chưa parse
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSwitchPayloadMode("parsed")}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                      payloadMode === "parsed"
                        ? "bg-purple-600/80 text-white shadow-sm"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    🚀 Đã parse
                  </button>
                </div>
              </div>

              {/* Status Info & Reset */}
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1.5 rounded bg-purple-500/15 border border-purple-500/30 px-2.5 py-1 text-xs font-semibold text-purple-300">
                  <span>⚡ Siêu ngắn (Keyframes)</span>
                  <span className="rounded bg-emerald-500/25 px-1 py-0.2 text-[10px] text-emerald-300 font-bold border border-emerald-500/40">
                    -98% size
                  </span>
                </span>

                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                    isJsonValid
                      ? "bg-emerald-950/60 text-emerald-300 border border-emerald-500/30"
                      : "bg-red-950/60 text-red-300 border border-red-500/30"
                  }`}
                >
                  {isJsonValid ? "✅ JSON hợp lệ" : "❌ Cú pháp JSON lỗi"}
                </span>

                <button
                  type="button"
                  onClick={() => setEditablePayloadJson(generatePayload(payloadMode))}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition px-2 py-1 rounded hover:bg-white/5"
                  title="Khôi phục lại payload gốc theo canvas hiện tại"
                >
                  <RotateCcw className="h-3 w-3" />
                  <span>Đặt lại</span>
                </button>
              </div>
            </div>

            {/* Editable JSON Area */}
            <div className="relative flex-1 min-h-[300px] flex flex-col">
              <div className="flex items-center justify-between text-[11px] text-slate-400 pb-1 px-1">
                <span>Nội dung JSON (có thể chỉnh sửa trực tiếp):</span>
                <span className="font-mono text-[10px] text-slate-500">
                  {editablePayloadJson.length} ký tự
                </span>
              </div>
              <textarea
                value={editablePayloadJson}
                onChange={(e) => setEditablePayloadJson(e.target.value)}
                spellCheck={false}
                className="w-full flex-1 min-h-[280px] max-h-[420px] rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-xs text-purple-200 outline-none focus:border-purple-500/60 resize-y leading-relaxed select-text"
              />
            </div>

            {/* Modal Actions */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 pt-3">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadPayloadJson}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Tải .json</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyCurl}
                  className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:bg-white/10 transition"
                  title="Sao chép lệnh cURL gọi API"
                >
                  {copiedCurl ? (
                    <Check className="h-3.5 w-3.5 text-emerald-400" />
                  ) : (
                    <Terminal className="h-3.5 w-3.5 text-indigo-400" />
                  )}
                  <span>{copiedCurl ? "Đã chép cURL!" : "Sao chép cURL"}</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTestRenderFromEditor}
                  disabled={isTestingRender || !isJsonValid}
                  className="flex items-center gap-1.5 rounded-xl border border-purple-500/40 bg-purple-950/50 px-3.5 py-1.5 text-xs font-semibold text-purple-200 hover:bg-purple-900/60 disabled:opacity-50 transition"
                  title="Chạy render trực tiếp từ JSON đang sửa"
                >
                  {isTestingRender ? (
                    <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-purple-300 border-t-transparent" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-purple-300 text-purple-300" />
                  )}
                  <span>{isTestingRender ? "Đang render..." : "Render thử JSON"}</span>
                </button>

                <button
                  type="button"
                  onClick={handleCopyJson}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 px-4 py-1.5 text-xs font-bold text-white shadow-md hover:bg-purple-500 transition"
                >
                  {copiedJson ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedJson ? "Đã sao chép!" : "Sao chép JSON"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* New Project Confirmation Modal */}
      {showNewConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-2xl border border-white/15 bg-[#120d24] p-5 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-600/30 border border-purple-500/40 text-purple-300">
                <FilePlus className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">Tạo Project Mới?</h3>
                <p className="text-[11px] text-slate-400">Khởi tạo lại toàn bộ timeline & canvas</p>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              Toàn bộ layer và keyframe chưa lưu sẽ bị làm mới về mẫu chuẩn. Bạn có thể nhấn <strong>Xuất .istudio</strong> trước để lưu lại dự án hiện tại.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowNewConfirmModal(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={confirmNewProject}
                className="rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-1.5 text-xs font-bold text-white shadow-lg shadow-purple-600/30 transition"
              >
                Tạo mới ngay
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Save As Modal */}
      {showSaveAsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-md rounded-2xl border border-white/15 bg-[#120d24] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-600/20 border border-cyan-500/30 text-cyan-400">
                  <Copy className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Lưu Dự Án Mới (Save As)</h3>
                  <p className="text-[11px] text-slate-400">Lưu thành tệp dự án .istudio độc lập</p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveAsModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Tên tệp dự án
                </label>
                <div className="flex items-center rounded-xl border border-white/15 bg-black/50 px-3 py-2 text-xs text-white focus-within:border-cyan-400">
                  <input
                    type="text"
                    value={saveAsFilename}
                    onChange={(e) => setSaveAsFilename(e.target.value)}
                    placeholder="my-animation"
                    className="w-full bg-transparent outline-none text-white font-medium"
                    autoFocus
                  />
                  <span className="font-mono text-cyan-400 text-xs font-bold pl-1">.istudio</span>
                </div>
              </div>

              {/* Package summary */}
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-3 text-xs space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                  Thông tin gói dự án (.istudio v1)
                </span>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="text-slate-400">
                    Kích thước: <span className="font-mono text-white">{canvas.width} × {canvas.height}px</span>
                  </div>
                  <div className="text-slate-400">
                    Số Layers: <span className="font-mono text-white">{canvas.elements.length}</span>
                  </div>
                  <div className="text-slate-400">
                    Thời lượng: <span className="font-mono text-white">{duration}ms ({fps}fps)</span>
                  </div>
                  <div className="text-slate-400">
                    Biến mẫu: <span className="font-mono text-white">{Object.keys(variables).length} biến</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowSaveAsModal(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                Hủy
              </button>
              <button
                type="button"
                onClick={() => handleSaveAsWithCustomName(saveAsFilename)}
                className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-cyan-900/30 transition"
              >
                <FileDown className="h-3.5 w-3.5" />
                <span>Lưu & Tải .istudio</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-lg rounded-2xl border border-white/15 bg-[#120d24] p-5 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-sky-600/20 border border-sky-500/30 text-sky-400">
                  <Upload className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Nhập Project (.istudio / JSON)</h3>
                  <p className="text-[11px] text-slate-400">Mở lại tệp hoặc chuyển giao từ máy khác</p>
                </div>
              </div>
              <button
                onClick={() => setShowImportModal(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Mode Tabs */}
            <div className="flex items-center rounded-xl bg-black/40 border border-white/10 p-0.5">
              <button
                type="button"
                onClick={() => setImportTab("file")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  importTab === "file"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Từ Tệp Tin (.istudio / .json)
              </button>
              <button
                type="button"
                onClick={() => setImportTab("text")}
                className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                  importTab === "text"
                    ? "bg-purple-600 text-white shadow-sm"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                Dán Mã JSON Dự Án
              </button>
            </div>

            {importError && (
              <div className="rounded-xl border border-red-500/30 bg-red-950/60 p-3 text-xs text-red-200">
                {importError}
              </div>
            )}

            {importTab === "file" ? (
              <div className="space-y-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = "copy";
                  }}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file) {
                      handleOpenIStudioFile(file);
                      setShowImportModal(false);
                    }
                  }}
                  className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-white/20 bg-white/[0.02] p-8 text-center cursor-pointer hover:border-purple-400 hover:bg-purple-950/20 transition group"
                >
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-600/20 text-purple-300 group-hover:scale-110 transition">
                    <FolderOpen className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-white">
                      Bấm để chọn tệp .istudio hoặc .json
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      Hoặc kéo và thả tệp trực tiếp vào đây
                    </div>
                  </div>
                  <span className="rounded-full bg-purple-500/20 px-2.5 py-0.5 text-[10px] font-mono text-purple-300 border border-purple-500/30 mt-1">
                    Định dạng hỗ trợ: *.istudio, *.json
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <label className="block text-xs font-medium text-slate-300">
                  Dán nội dung JSON của file .istudio
                </label>
                <textarea
                  value={importJsonText}
                  onChange={(e) => {
                    setImportJsonText(e.target.value);
                    setImportError(null);
                  }}
                  placeholder={'{\n  "version": 1,\n  "canvas": { ... },\n  "elements": [ ... ],\n  "tracks": [ ... ]\n}'}
                  rows={8}
                  className="w-full rounded-xl border border-white/10 bg-black/60 p-3 font-mono text-xs text-slate-200 outline-none focus:border-purple-500 resize-none"
                />
              </div>
            )}

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="rounded-xl px-3 py-1.5 text-xs font-semibold text-slate-400 hover:bg-white/10 hover:text-white transition"
              >
                Hủy
              </button>
              {importTab === "text" && (
                <button
                  type="button"
                  onClick={() => handleImportFromJsonText(importJsonText)}
                  disabled={!importJsonText.trim()}
                  className="flex items-center gap-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 px-4 py-2 text-xs font-bold text-white shadow-lg shadow-purple-600/30 disabled:opacity-50 transition"
                >
                  <Upload className="h-3.5 w-3.5" />
                  <span>Nhập Dự Án</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
