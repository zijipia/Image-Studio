import React, { useState, useRef, useEffect, useCallback } from "react";
import type { CustomCanvasData, CustomElement, CustomElementType } from "../lib/types";
import { DEFAULT_CUSTOM_CANVAS, CANVAS_PRESET_BACKGROUNDS } from "../lib/constants";
import { TextShadowControlPanel } from "./TextShadowControlPanel";
import { computeElementTextShadow } from "../lib/text-effects";
import {
  Type,
  Image as ImageIcon,
  User,
  Tag,
  BarChart2,
  Square,
  Plus,
  Trash2,
  Copy,
  Check,
  Download,
  Code2,
  Layers,
  Sparkles,
  Sliders,
  Terminal,
  ExternalLink,
  Move,
  RefreshCw,
  AlertCircle,
  FileCheck,
  CheckCheck,
} from "lucide-react";

interface CustomBuilderProps {
  onGenerate: (canvasData: CustomCanvasData) => void;
  isGenerating: boolean;
  lastGeneratedBlob?: Blob | null;
}

type ResizeHandle = "nw" | "ne" | "sw" | "se" | "n" | "s" | "w" | "e";

export function CustomBuilder({
  onGenerate,
  isGenerating,
  lastGeneratedBlob,
}: CustomBuilderProps) {
  const [canvas, setCanvas] = useState<CustomCanvasData>(DEFAULT_CUSTOM_CANVAS);
  const [selectedId, setSelectedId] = useState<string | null>("el-text-name");
  const [inspectorTab, setInspectorTab] = useState<"design" | "json" | "api">("design");
  const [codeLang, setCodeLang] = useState<"curl" | "fetch" | "python">("fetch");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);
  const [copiedImage, setCopiedImage] = useState<boolean>(false);
  const [zoomScale, setZoomScale] = useState<number>(0.75);

  // Editable JSON Schema State
  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify({ type: "custom", data: DEFAULT_CUSTOM_CANVAS }, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [isEditingJson, setIsEditingJson] = useState<boolean>(false);
  const [appliedNotification, setAppliedNotification] = useState<boolean>(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  // References for active drag and resize operations
  const activeOpRef = useRef<
    | {
        mode: "move";
        id: string;
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
      }
    | {
        mode: "resize";
        id: string;
        handle: ResizeHandle;
        startX: number;
        startY: number;
        initialX: number;
        initialY: number;
        initialWidth: number;
        initialHeight: number;
      }
    | null
  >(null);

  const selectedElement = canvas.elements.find((el) => el.id === selectedId) || null;

  // Auto fit zoom scale on mount or resize
  useEffect(() => {
    function handleResize() {
      if (!canvasRef.current) return;
      const parent = canvasRef.current.parentElement;
      if (!parent) return;
      const available = parent.clientWidth - 48;
      const fit = Math.min(1, Math.max(0.35, available / canvas.width));
      setZoomScale(fit);
    }
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [canvas.width]);

  // Sync JSON text when canvas changes from visual designer (unless user is actively typing in JSON tab)
  useEffect(() => {
    if (!isEditingJson) {
      setJsonText(JSON.stringify({ type: "custom", data: canvas }, null, 2));
      setJsonError(null);
    }
  }, [canvas, isEditingJson]);

  // Pointer move handler (drag or resize)
  const handleWindowPointerMove = useCallback(
    (e: PointerEvent) => {
      if (!activeOpRef.current) return;
      const op = activeOpRef.current;

      const deltaX = Math.round((e.clientX - op.startX) / zoomScale);
      const deltaY = Math.round((e.clientY - op.startY) / zoomScale);

      if (op.mode === "move") {
        setCanvas((prev) => {
          const currentElem = prev.elements.find((el) => el.id === op.id);
          if (!currentElem) return prev;
          const newX = Math.max(0, Math.min(prev.width - currentElem.width, op.initialX + deltaX));
          const newY = Math.max(0, Math.min(prev.height - currentElem.height, op.initialY + deltaY));
          return {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === op.id ? { ...el, x: newX, y: newY } : el
            ),
          };
        });
      } else if (op.mode === "resize") {
        setCanvas((prev) => {
          const currentElem = prev.elements.find((el) => el.id === op.id);
          if (!currentElem) return prev;

          let newX = op.initialX;
          let newY = op.initialY;
          let newWidth = op.initialWidth;
          let newHeight = op.initialHeight;
          const minSize = 20;

          switch (op.handle) {
            case "se": // Bottom-right corner
              newWidth = Math.max(minSize, op.initialWidth + deltaX);
              newHeight = Math.max(minSize, op.initialHeight + deltaY);
              break;
            case "sw": // Bottom-left corner
              newWidth = Math.max(minSize, op.initialWidth - deltaX);
              newX = Math.max(0, op.initialX + (op.initialWidth - newWidth));
              newHeight = Math.max(minSize, op.initialHeight + deltaY);
              break;
            case "ne": // Top-right corner
              newWidth = Math.max(minSize, op.initialWidth + deltaX);
              newHeight = Math.max(minSize, op.initialHeight - deltaY);
              newY = Math.max(0, op.initialY + (op.initialHeight - newHeight));
              break;
            case "nw": // Top-left corner
              newWidth = Math.max(minSize, op.initialWidth - deltaX);
              newX = Math.max(0, op.initialX + (op.initialWidth - newWidth));
              newHeight = Math.max(minSize, op.initialHeight - deltaY);
              newY = Math.max(0, op.initialY + (op.initialHeight - newHeight));
              break;
            case "e": // Right edge
              newWidth = Math.max(minSize, op.initialWidth + deltaX);
              break;
            case "w": // Left edge
              newWidth = Math.max(minSize, op.initialWidth - deltaX);
              newX = Math.max(0, op.initialX + (op.initialWidth - newWidth));
              break;
            case "s": // Bottom edge
              newHeight = Math.max(minSize, op.initialHeight + deltaY);
              break;
            case "n": // Top edge
              newHeight = Math.max(minSize, op.initialHeight - deltaY);
              newY = Math.max(0, op.initialY + (op.initialHeight - newHeight));
              break;
          }

          // Boundary checks to keep element inside canvas bounds
          newWidth = Math.min(newWidth, prev.width - newX);
          newHeight = Math.min(newHeight, prev.height - newY);

          return {
            ...prev,
            elements: prev.elements.map((el) =>
              el.id === op.id
                ? {
                    ...el,
                    x: Math.round(newX),
                    y: Math.round(newY),
                    width: Math.round(newWidth),
                    height: Math.round(newHeight),
                  }
                : el
            ),
          };
        });
      }
    },
    [zoomScale]
  );

  const handleWindowPointerUp = useCallback(() => {
    activeOpRef.current = null;
  }, []);

  // Attach global pointer listeners for smooth 60fps drag & resize across the window
  useEffect(() => {
    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);
    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [handleWindowPointerMove, handleWindowPointerUp]);

  // Start element move
  const handleElementPointerDown = (e: React.PointerEvent, id: string) => {
    e.stopPropagation();
    setSelectedId(id);
    const elem = canvas.elements.find((el) => el.id === id);
    if (!elem) return;

    activeOpRef.current = {
      mode: "move",
      id,
      startX: e.clientX,
      startY: e.clientY,
      initialX: elem.x,
      initialY: elem.y,
    };
  };

  // Start corner or edge resize
  const handleResizePointerDown = (e: React.PointerEvent, id: string, handle: ResizeHandle) => {
    e.stopPropagation();
    setSelectedId(id);
    const elem = canvas.elements.find((el) => el.id === id);
    if (!elem) return;

    activeOpRef.current = {
      mode: "resize",
      id,
      handle,
      startX: e.clientX,
      startY: e.clientY,
      initialX: elem.x,
      initialY: elem.y,
      initialWidth: elem.width,
      initialHeight: elem.height,
    };
  };

  // Add Element
  const addElement = (type: CustomElementType) => {
    const id = `el-${type}-${Date.now().toString().slice(-4)}`;
    let newElement: CustomElement;

    switch (type) {
      case "text":
        newElement = {
          id,
          type: "text",
          x: 50,
          y: 50,
          width: 280,
          height: 36,
          content: "Heading Text",
          color: "#ffffff",
          fontSize: 24,
          fontWeight: 600,
          textShadow: "0 0 10px rgba(192, 132, 252, 0.7), 2px 3px 6px rgba(0, 0, 0, 0.85)",
          shadowEnabled: true,
          shadowOffsetX: 2,
          shadowOffsetY: 3,
          shadowBlur: 6,
          shadowColor: "rgba(0, 0, 0, 0.85)",
          glowEnabled: true,
          glowBlur: 10,
          glowColor: "#c084fc",
          glowIntensity: "medium",
        };
        break;
      case "avatar":
        newElement = {
          id,
          type: "avatar",
          x: 50,
          y: 50,
          width: 90,
          height: 90,
          imageUrl: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg",
          borderRadius: 999,
          border: "2px solid #a855f7",
        };
        break;
      case "image":
        newElement = {
          id,
          type: "image",
          x: 50,
          y: 50,
          width: 140,
          height: 140,
          imageUrl: "https://i.ytimg.com/vi/NRRXrZnhT5s/hq720.jpg",
          borderRadius: 12,
        };
        break;
      case "badge":
        newElement = {
          id,
          type: "badge",
          x: 50,
          y: 50,
          width: 110,
          height: 28,
          content: "FEATURED",
          color: "#ffffff",
          backgroundColor: "#9333ea",
          fontSize: 12,
          fontWeight: 600,
          borderRadius: 999,
        };
        break;
      case "progress":
        newElement = {
          id,
          type: "progress",
          x: 50,
          y: 50,
          width: 320,
          height: 18,
          progressPercent: 65,
          progressColor: "linear-gradient(90deg, #a855f7, #ec4899)",
          backgroundColor: "#27272a",
          borderRadius: 999,
        };
        break;
      case "box":
      default:
        newElement = {
          id,
          type: "box",
          x: 50,
          y: 50,
          width: 250,
          height: 120,
          backgroundColor: "rgba(255, 255, 255, 0.08)",
          borderRadius: 16,
          border: "1px solid rgba(255, 255, 255, 0.15)",
        };
        break;
    }

    setCanvas((prev) => ({
      ...prev,
      elements: [...prev.elements, newElement],
    }));
    setSelectedId(id);
  };

  const updateSelectedElement = (partial: Partial<CustomElement>) => {
    if (!selectedId) return;
    setCanvas((prev) => ({
      ...prev,
      elements: prev.elements.map((el) => (el.id === selectedId ? { ...el, ...partial } : el)),
    }));
  };

  const deleteSelectedElement = () => {
    if (!selectedId) return;
    setCanvas((prev) => ({
      ...prev,
      elements: prev.elements.filter((el) => el.id !== selectedId),
    }));
    setSelectedId(null);
  };

  const duplicateSelectedElement = () => {
    if (!selectedElement) return;
    const duplicated: CustomElement = {
      ...selectedElement,
      id: `el-${selectedElement.type}-${Date.now().toString().slice(-4)}`,
      x: Math.min(canvas.width - selectedElement.width, selectedElement.x + 20),
      y: Math.min(canvas.height - selectedElement.height, selectedElement.y + 20),
    };
    setCanvas((prev) => ({
      ...prev,
      elements: [...prev.elements, duplicated],
    }));
    setSelectedId(duplicated.id);
  };

  // JSON Schema Editor Handlers
  const handleJsonChange = (val: string) => {
    setJsonText(val);
    setIsEditingJson(true);
    try {
      if (!val.trim()) {
        setJsonError("JSON cannot be empty");
        return;
      }
      const parsed = JSON.parse(val);
      const canvasPayload: CustomCanvasData = parsed.type === "custom" && parsed.data ? parsed.data : parsed;

      if (!canvasPayload || !Array.isArray(canvasPayload.elements)) {
        setJsonError("Invalid schema: 'elements' must be an array");
        return;
      }

      setJsonError(null);
      setCanvas({
        title: canvasPayload.title || "Custom Card",
        width: canvasPayload.width || 900,
        height: canvasPayload.height || 400,
        background: canvasPayload.background || "#000000",
        elements: canvasPayload.elements,
      });
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON syntax");
    }
  };

  const handleApplyJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const canvasPayload: CustomCanvasData = parsed.type === "custom" && parsed.data ? parsed.data : parsed;

      if (!canvasPayload || !Array.isArray(canvasPayload.elements)) {
        throw new Error("Invalid schema: 'elements' array is required.");
      }

      setCanvas({
        title: canvasPayload.title || "Custom Card",
        width: canvasPayload.width || 900,
        height: canvasPayload.height || 400,
        background: canvasPayload.background || "#000000",
        elements: canvasPayload.elements,
      });

      setIsEditingJson(false);
      setJsonError(null);
      setAppliedNotification(true);
      setTimeout(() => setAppliedNotification(false), 2500);
    } catch (err: any) {
      setJsonError(err.message || "Failed to parse JSON");
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setJsonError(null);
    } catch (err: any) {
      setJsonError("Cannot format: " + err.message);
    }
  };

  const handleCopyCode = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyBlob = async () => {
    if (!lastGeneratedBlob) {
      onGenerate(canvas);
      return;
    }
    try {
      if (navigator.clipboard && "write" in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": lastGeneratedBlob }),
        ]);
        setCopiedImage(true);
        setTimeout(() => setCopiedImage(false), 2000);
      }
    } catch (err) {
      console.warn("Failed to copy image:", err);
    }
  };

  // Generate API code snippets
  const curlSnippet = `curl -X POST https://your-domain.com/api/generate \\
  -H "Content-Type: application/json" \\
  -d '${JSON.stringify({ type: "custom", data: canvas })}' \\
  --output custom-card.png`;

  const fetchSnippet = `// Node.js / Browser Fetch
const response = await fetch('/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    type: 'custom',
    data: ${JSON.stringify(canvas, null, 2)}
  })
});

const blob = await response.blob();
const imageUrl = URL.createObjectURL(blob);
// Open, preview or download the PNG
const a = document.createElement('a');
a.href = imageUrl;
a.download = 'custom-card.png';
a.click();`;

  const pythonSnippet = `import requests

payload = {
    "type": "custom",
    "data": ${JSON.stringify(canvas, null, 4)}
}

response = requests.post("https://your-domain.com/api/generate", json=payload)

if response.status_code == 200:
    with open("custom_card.png", "wb") as f:
        f.write(response.content)
    print("PNG generated successfully!")`;

  return (
    <div className="flex flex-col gap-6">
      {/* Top Action Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-white/10 bg-[#0e0a1e]/90 p-4 shadow-xl backdrop-blur-md">
        {/* Component Adders */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300 mr-1">
            Add Element:
          </span>
          <button
            onClick={() => addElement("text")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15"
          >
            <Type className="h-3.5 w-3.5 text-purple-400" />
            <span>Text</span>
          </button>
          <button
            onClick={() => addElement("avatar")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15"
          >
            <User className="h-3.5 w-3.5 text-rose-400" />
            <span>Avatar</span>
          </button>
          <button
            onClick={() => addElement("image")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15"
          >
            <ImageIcon className="h-3.5 w-3.5 text-blue-400" />
            <span>Image</span>
          </button>
          <button
            onClick={() => addElement("badge")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15"
          >
            <Tag className="h-3.5 w-3.5 text-amber-400" />
            <span>Badge</span>
          </button>
          <button
            onClick={() => addElement("progress")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15"
          >
            <BarChart2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Progress Bar</span>
          </button>
          <button
            onClick={() => addElement("box")}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs text-slate-200 hover:bg-white/15"
          >
            <Square className="h-3.5 w-3.5 text-slate-400" />
            <span>Card Box</span>
          </button>
        </div>

        {/* Export & Actions */}
        <div className="flex items-center gap-2">
          {lastGeneratedBlob && (
            <button
              onClick={handleCopyBlob}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
            >
              {copiedImage ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copiedImage ? "Copied Image!" : "Copy Image"}</span>
            </button>
          )}

          <button
            onClick={() => onGenerate(canvas)}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Exporting PNG...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Export PNG ({canvas.width}×{canvas.height})</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Main Grid: Left Canvas Area / Right Inspector & JSON Panel */}
      <div className="grid grid-cols-1 gap-8 xl:grid-cols-[1fr_480px]">
        {/* Left Column: Visual Drag & Drop Canvas */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e0a1e]/90 shadow-2xl backdrop-blur-xl">
          {/* Canvas Sub-bar */}
          <div className="flex flex-wrap items-center justify-between border-b border-white/10 px-5 py-3 text-xs text-slate-300">
            <div className="flex items-center gap-3">
              <span className="font-semibold text-white">Visual Designer Canvas</span>
              <span className="font-mono text-purple-300">
                {canvas.width} × {canvas.height} px
              </span>
              <span className="text-slate-500">
                ({canvas.elements.length} components · drag to move, drag corners to resize)
              </span>
            </div>

            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400">Zoom:</span>
                <span className="font-mono text-purple-300">{Math.round(zoomScale * 100)}%</span>
              </div>
              <button
                onClick={() => setCanvas(DEFAULT_CUSTOM_CANVAS)}
                className="flex items-center gap-1 text-slate-400 hover:text-white"
                title="Reset to default canvas"
              >
                <RefreshCw className="h-3 w-3" />
                <span>Reset</span>
              </button>
            </div>
          </div>

          {/* Interactive Drag & Drop + Resize Viewport */}
          <div
            className="relative flex min-h-[520px] flex-1 items-center justify-center overflow-auto p-8 select-none"
            style={{
              background:
                "radial-gradient(ellipse at 50% 50%, rgba(91, 0, 184, 0.12) 0%, transparent 70%), #06040d",
            }}
          >
            <div
              className="origin-center transition-transform duration-100 ease-out"
              style={{
                transform: `scale(${zoomScale})`,
                width: `${canvas.width}px`,
                height: `${canvas.height}px`,
              }}
            >
              {/* Visual Canvas Box */}
              <div
                ref={canvasRef}
                onClick={() => setSelectedId(null)}
                className="relative overflow-hidden rounded-[16px] shadow-2xl cursor-default"
                style={{
                  width: `${canvas.width}px`,
                  height: `${canvas.height}px`,
                  background: canvas.background,
                  boxShadow: "0 25px 60px -15px rgba(0,0,0,0.9), 0 0 30px rgba(91, 0, 184, 0.2)",
                }}
              >
                {canvas.elements.map((el) => {
                  const isSelected = el.id === selectedId;

                  return (
                    <div
                      key={el.id}
                      onPointerDown={(e) => handleElementPointerDown(e, el.id)}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedId(el.id);
                      }}
                      className={`group absolute cursor-move select-none transition-shadow ${
                        isSelected
                          ? "ring-2 ring-purple-400 ring-offset-2 ring-offset-black shadow-lg"
                          : "hover:ring-1 hover:ring-white/40"
                      }`}
                      style={{
                        left: `${el.x}px`,
                        top: `${el.y}px`,
                        width: `${el.width}px`,
                        height: `${el.height}px`,
                        zIndex: el.zIndex || 1,
                      }}
                    >
                      {/* Selection handle pill & coordinates */}
                      {isSelected && (
                        <div className="absolute -top-7 left-0 flex items-center gap-1.5 rounded bg-purple-600 px-2 py-0.5 text-[10px] font-mono text-white shadow pointer-events-none z-30 whitespace-nowrap">
                          <Move className="h-2.5 w-2.5" />
                          <span>{el.type} | {el.width}×{el.height} ({el.x}, {el.y})</span>
                        </div>
                      )}

                      {/* Element Renderers */}
                      {el.type === "text" && (
                        <div
                          className="flex h-full w-full items-center pointer-events-none"
                          style={{
                            color: el.color || "#ffffff",
                            textShadow: computeElementTextShadow(el),
                            fontSize: `${el.fontSize || 18}px`,
                            fontWeight: el.fontWeight || 400,
                            overflow: "visible",
                            justifyContent:
                              el.textAlign === "center"
                                ? "center"
                                : el.textAlign === "right"
                                ? "flex-end"
                                : "flex-start",
                          }}
                        >
                          {el.content || "Text"}
                        </div>
                      )}

                      {el.type === "badge" && (
                        <div
                          className="flex h-full w-full items-center justify-center font-semibold pointer-events-none"
                          style={{
                            backgroundColor: el.backgroundColor || "rgba(255,255,255,0.15)",
                            borderRadius: `${el.borderRadius ?? 999}px`,
                            border: el.border || "none",
                            color: el.color || "#ffffff",
                            textShadow: computeElementTextShadow(el),
                            fontSize: `${el.fontSize || 12}px`,
                          }}
                        >
                          {el.content || "Badge"}
                        </div>
                      )}

                      {el.type === "progress" && (
                        <div
                          className="flex h-full w-full overflow-hidden pointer-events-none"
                          style={{
                            backgroundColor: el.backgroundColor || "#27272a",
                            borderRadius: `${el.borderRadius ?? 999}px`,
                          }}
                        >
                          <div
                            className="h-full"
                            style={{
                              width: `${Math.min(100, Math.max(0, el.progressPercent ?? 50))}%`,
                              background: el.progressColor || "linear-gradient(90deg, #a855f7, #ec4899)",
                              borderRadius: `${el.borderRadius ?? 999}px`,
                            }}
                          />
                        </div>
                      )}

                      {(el.type === "image" || el.type === "avatar") && (
                        <img
                          src={el.imageUrl || "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg"}
                          alt="Canvas component"
                          className="h-full w-full object-cover pointer-events-none"
                          style={{
                            borderRadius: `${el.borderRadius ?? (el.type === "avatar" ? 999 : 12)}px`,
                            border: el.border || "none",
                          }}
                        />
                      )}

                      {el.type === "box" && (
                        <div
                          className="h-full w-full pointer-events-none"
                          style={{
                            backgroundColor: el.backgroundColor || "rgba(255,255,255,0.06)",
                            borderRadius: `${el.borderRadius ?? 12}px`,
                            border: el.border || "1px solid rgba(255,255,255,0.1)",
                          }}
                        />
                      )}

                      {/* Interactive Corner & Edge Resize Handles */}
                      {isSelected && (
                        <>
                          {/* 4 Corners */}
                          {/* Top-Left */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "nw")}
                            className="absolute -top-1.5 -left-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-purple-500 bg-white shadow hover:scale-125 z-40 transition-transform"
                            title="Resize Top-Left"
                          />
                          {/* Top-Right */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "ne")}
                            className="absolute -top-1.5 -right-1.5 h-3.5 w-3.5 cursor-nesw-resize rounded-full border-2 border-purple-500 bg-white shadow hover:scale-125 z-40 transition-transform"
                            title="Resize Top-Right"
                          />
                          {/* Bottom-Left */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "sw")}
                            className="absolute -bottom-1.5 -left-1.5 h-3.5 w-3.5 cursor-nesw-resize rounded-full border-2 border-purple-500 bg-white shadow hover:scale-125 z-40 transition-transform"
                            title="Resize Bottom-Left"
                          />
                          {/* Bottom-Right */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "se")}
                            className="absolute -bottom-1.5 -right-1.5 h-3.5 w-3.5 cursor-nwse-resize rounded-full border-2 border-purple-500 bg-white shadow hover:scale-125 z-40 transition-transform"
                            title="Resize Bottom-Right"
                          />

                          {/* 4 Edges */}
                          {/* Top Edge */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "n")}
                            className="absolute -top-1 left-1/2 -translate-x-1/2 h-2 w-5 cursor-ns-resize rounded-full border border-purple-400 bg-white shadow hover:scale-110 z-40"
                            title="Resize Height"
                          />
                          {/* Bottom Edge */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "s")}
                            className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-2 w-5 cursor-ns-resize rounded-full border border-purple-400 bg-white shadow hover:scale-110 z-40"
                            title="Resize Height"
                          />
                          {/* Left Edge */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "w")}
                            className="absolute top-1/2 -left-1 -translate-y-1/2 h-5 w-2 cursor-ew-resize rounded-full border border-purple-400 bg-white shadow hover:scale-110 z-40"
                            title="Resize Width"
                          />
                          {/* Right Edge */}
                          <div
                            onPointerDown={(e) => handleResizePointerDown(e, el.id, "e")}
                            className="absolute top-1/2 -right-1 -translate-y-1/2 h-5 w-2 cursor-ew-resize rounded-full border border-purple-400 bg-white shadow hover:scale-110 z-40"
                            title="Resize Width"
                          />
                        </>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Quick Preset Background bar */}
          <div className="border-t border-white/10 bg-black/40 p-4">
            <span className="text-xs font-semibold text-slate-300 block mb-2">
              Preset Canvas Backgrounds:
            </span>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-6">
              {CANVAS_PRESET_BACKGROUNDS.map((bg) => (
                <button
                  key={bg.id}
                  onClick={() => setCanvas((prev) => ({ ...prev, background: bg.value }))}
                  className={`flex flex-col items-center rounded-xl border p-2 text-center text-xs transition-all ${
                    canvas.background === bg.value
                      ? "border-purple-500 bg-purple-950/40 text-white"
                      : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
                  }`}
                >
                  <span className="truncate">{bg.name}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Inspector, Editable JSON Schema & API Docs */}
        <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e0a1e]/90 shadow-xl backdrop-blur-md p-5">
          {/* Mode Switcher Tabs */}
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setInspectorTab("design")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  inspectorTab === "design"
                    ? "bg-purple-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Sliders className="h-3.5 w-3.5" />
                <span>Inspector</span>
              </button>

              <button
                onClick={() => setInspectorTab("json")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  inspectorTab === "json"
                    ? "bg-purple-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Code2 className="h-3.5 w-3.5" />
                <span>Editable JSON</span>
              </button>

              <button
                onClick={() => setInspectorTab("api")}
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  inspectorTab === "api"
                    ? "bg-purple-600 text-white shadow-sm font-semibold"
                    : "text-slate-400 hover:bg-white/5 hover:text-white"
                }`}
              >
                <Terminal className="h-3.5 w-3.5" />
                <span>API Usage</span>
              </button>
            </div>
          </div>

          {/* Tab 1: Design Property Inspector */}
          {inspectorTab === "design" && (
            <div className="mt-4 space-y-5 overflow-y-auto max-h-[640px] pr-1">
              {/* Canvas Global Properties */}
              <div className="rounded-xl border border-white/8 bg-black/30 p-3.5 space-y-3">
                <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                  Canvas Dimensions
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[11px] text-slate-400">Width (px)</label>
                    <input
                      type="number"
                      value={canvas.width}
                      onChange={(e) =>
                        setCanvas((prev) => ({
                          ...prev,
                          width: Math.max(200, parseInt(e.target.value) || 900),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] text-slate-400">Height (px)</label>
                    <input
                      type="number"
                      value={canvas.height}
                      onChange={(e) =>
                        setCanvas((prev) => ({
                          ...prev,
                          height: Math.max(150, parseInt(e.target.value) || 400),
                        }))
                      }
                      className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                </div>
              </div>

              {/* Selected Element Properties */}
              {selectedElement ? (
                <div className="rounded-xl border border-white/8 bg-black/30 p-3.5 space-y-3.5">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs font-semibold text-purple-300 uppercase tracking-wider">
                      Selected: {selectedElement.type} ({selectedElement.id})
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={duplicateSelectedElement}
                        className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"
                        title="Duplicate Element"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={deleteSelectedElement}
                        className="rounded p-1 text-red-400 hover:bg-red-500/20"
                        title="Delete Element"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Position X and Y */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400">X Position (px)</label>
                      <input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) =>
                          updateSelectedElement({ x: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Y Position (px)</label>
                      <input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) =>
                          updateSelectedElement({ y: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Width and Height */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400">Width (px)</label>
                      <input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) =>
                          updateSelectedElement({ width: parseInt(e.target.value) || 10 })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Height (px)</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) =>
                          updateSelectedElement({ height: parseInt(e.target.value) || 10 })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Content for Text and Badge */}
                  {(selectedElement.type === "text" || selectedElement.type === "badge") && (
                    <div className="text-xs">
                      <label className="text-[11px] text-slate-400">Text Content</label>
                      <input
                        type="text"
                        value={selectedElement.content || ""}
                        onChange={(e) => updateSelectedElement({ content: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white"
                      />
                    </div>
                  )}

                  {/* Image URL for Image and Avatar */}
                  {(selectedElement.type === "image" || selectedElement.type === "avatar") && (
                    <div className="text-xs">
                      <label className="text-[11px] text-slate-400">Image URL</label>
                      <input
                        type="url"
                        value={selectedElement.imageUrl || ""}
                        onChange={(e) => updateSelectedElement({ imageUrl: e.target.value })}
                        placeholder="https://..."
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white"
                      />
                    </div>
                  )}

                  {/* Progress percent */}
                  {selectedElement.type === "progress" && (
                    <div className="text-xs space-y-1">
                      <div className="flex justify-between">
                        <label className="text-[11px] text-slate-400">Progress: {selectedElement.progressPercent}%</label>
                      </div>
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={selectedElement.progressPercent || 50}
                        onChange={(e) =>
                          updateSelectedElement({ progressPercent: parseInt(e.target.value) || 0 })
                        }
                        className="w-full accent-purple-500"
                      />
                    </div>
                  )}

                  {/* Colors & Styling */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400">Color</label>
                      <input
                        type="text"
                        value={selectedElement.color || "#ffffff"}
                        onChange={(e) => updateSelectedElement({ color: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Background Color</label>
                      <input
                        type="text"
                        value={selectedElement.backgroundColor || ""}
                        placeholder="rgba(...)"
                        onChange={(e) => updateSelectedElement({ backgroundColor: e.target.value })}
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Font Size & Radius */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <label className="text-[11px] text-slate-400">Font Size (px)</label>
                      <input
                        type="number"
                        value={selectedElement.fontSize || 16}
                        onChange={(e) =>
                          updateSelectedElement({ fontSize: parseInt(e.target.value) || 12 })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[11px] text-slate-400">Border Radius (px)</label>
                      <input
                        type="number"
                        value={selectedElement.borderRadius ?? 8}
                        onChange={(e) =>
                          updateSelectedElement({ borderRadius: parseInt(e.target.value) || 0 })
                        }
                        className="mt-1 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-white font-mono"
                      />
                    </div>
                  </div>

                  {/* Text Shadow & Glow Controls */}
                  {(selectedElement.type === "text" || selectedElement.type === "badge") && (
                    <TextShadowControlPanel
                      element={selectedElement}
                      onChange={(patch) => updateSelectedElement(patch)}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-500">
                  <Move className="mb-2 h-7 w-7 text-slate-600" />
                  <p className="text-xs">Click or drag any component to inspect. Drag corners on canvas to resize.</p>
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Live Editable JSON Schema */}
          {inspectorTab === "json" && (
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs text-slate-400">
                  Edit JSON Schema directly:
                </span>
                <div className="flex items-center gap-1.5 text-xs">
                  <button
                    onClick={handleFormatJson}
                    className="rounded bg-white/10 px-2 py-1 text-slate-300 hover:bg-white/20"
                    title="Prettify JSON"
                  >
                    Format
                  </button>
                  <button
                    onClick={handleApplyJson}
                    className="flex items-center gap-1 rounded bg-purple-600 px-2.5 py-1 text-white font-medium hover:bg-purple-500 shadow"
                    title="Apply edits to Canvas"
                  >
                    {appliedNotification ? <CheckCheck className="h-3.5 w-3.5" /> : <Sparkles className="h-3.5 w-3.5" />}
                    <span>{appliedNotification ? "Applied!" : "Apply"}</span>
                  </button>
                  <button
                    onClick={() => handleCopyCode(jsonText)}
                    className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-slate-300 hover:bg-white/20"
                  >
                    {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copiedCode ? "Copied" : "Copy"}</span>
                  </button>
                </div>
              </div>

              {/* Status Banner */}
              {jsonError ? (
                <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-2.5 text-xs text-red-300">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                  <div className="min-w-0 flex-1">
                    <strong>JSON Syntax Error: </strong>
                    <span>{jsonError}</span>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300">
                  <div className="flex items-center gap-1.5">
                    <FileCheck className="h-4 w-4 text-emerald-400" />
                    <span>Valid JSON Schema ({canvas.elements.length} components)</span>
                  </div>
                  <span className="font-mono text-[11px] text-emerald-400/80">
                    {canvas.width} × {canvas.height}px
                  </span>
                </div>
              )}

              {/* Fully Editable Textarea */}
              <textarea
                value={jsonText}
                onChange={(e) => handleJsonChange(e.target.value)}
                spellCheck={false}
                rows={20}
                className="w-full rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-xs leading-relaxed text-purple-200 focus:border-purple-500 focus:outline-none"
              />
            </div>
          )}

          {/* Tab 3: API Usage Code Snippets */}
          {inspectorTab === "api" && (
            <div className="mt-4 space-y-4">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setCodeLang("fetch")}
                    className={`rounded px-2.5 py-1 text-xs font-mono ${
                      codeLang === "fetch" ? "bg-purple-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Fetch / JS
                  </button>
                  <button
                    onClick={() => setCodeLang("curl")}
                    className={`rounded px-2.5 py-1 text-xs font-mono ${
                      codeLang === "curl" ? "bg-purple-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    cURL
                  </button>
                  <button
                    onClick={() => setCodeLang("python")}
                    className={`rounded px-2.5 py-1 text-xs font-mono ${
                      codeLang === "python" ? "bg-purple-600 text-white font-semibold" : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Python
                  </button>
                </div>

                <button
                  onClick={() =>
                    handleCopyCode(
                      codeLang === "curl"
                        ? curlSnippet
                        : codeLang === "python"
                        ? pythonSnippet
                        : fetchSnippet
                    )
                  }
                  className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-xs text-slate-300 hover:bg-white/20"
                >
                  {copiedCode ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
                  <span>{copiedCode ? "Copied!" : "Copy Code"}</span>
                </button>
              </div>

              <div className="relative">
                <pre className="max-h-[500px] overflow-auto rounded-xl border border-white/10 bg-black/60 p-4 font-mono text-xs leading-relaxed text-purple-200">
                  {codeLang === "curl" && curlSnippet}
                  {codeLang === "fetch" && fetchSnippet}
                  {codeLang === "python" && pythonSnippet}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
