import React, { useState } from "react";
import type { CustomElement } from "../lib/types";
import {
  TEXT_SHADOW_PRESETS,
  buildTextShadowString,
  computeElementTextShadow,
  type TextShadowPreset,
} from "../lib/text-effects";
import {
  Sparkles,
  Sun,
  Moon,
  Copy,
  Check,
  RotateCcw,
  Sliders,
  Palette,
  Eye,
} from "lucide-react";

interface TextShadowControlPanelProps {
  element: CustomElement;
  onChange: (patch: Partial<CustomElement>) => void;
}

const SHADOW_COLOR_SWATCHES = [
  { name: "Black 85%", hex: "rgba(0, 0, 0, 0.85)" },
  { name: "Pure Black", hex: "#000000" },
  { name: "Dark Purple", hex: "#1e1035" },
  { name: "Deep Navy", hex: "#030712" },
  { name: "Dark Red", hex: "#450a0a" },
  { name: "Dark Gray", hex: "rgba(30, 41, 59, 0.9)" },
];

const GLOW_COLOR_SWATCHES = [
  { name: "Purple", hex: "#c084fc" },
  { name: "Cyan", hex: "#38bdf8" },
  { name: "Gold", hex: "#facc15" },
  { name: "Pink", hex: "#f43f5e" },
  { name: "Emerald", hex: "#34d399" },
  { name: "Pure White", hex: "#ffffff" },
  { name: "Orange", hex: "#fb923c" },
  { name: "Indigo", hex: "#818cf8" },
];

export function TextShadowControlPanel({ element, onChange }: TextShadowControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "shadow" | "glow" | "custom">("presets");
  const [copiedCss, setCopiedCss] = useState(false);
  const [showShadowSwatches, setShowShadowSwatches] = useState(false);
  const [showGlowSwatches, setShowGlowSwatches] = useState(false);

  // Current effective text-shadow
  const currentTextShadow = element.textShadow !== undefined && element.textShadow !== ""
    ? element.textShadow
    : (computeElementTextShadow(element) || "");

  const hasAnyEffect = Boolean(currentTextShadow && currentTextShadow !== "none");

  // Apply a quick preset
  const handleApplyPreset = (preset: TextShadowPreset) => {
    if (!preset.value) {
      onChange({
        textShadow: "",
        shadowEnabled: false,
        glowEnabled: false,
      });
      return;
    }

    if (preset.id === "soft-shadow") {
      onChange({
        textShadow: preset.value,
        shadowEnabled: true,
        shadowOffsetX: 2,
        shadowOffsetY: 3,
        shadowBlur: 6,
        shadowColor: "rgba(0, 0, 0, 0.85)",
        glowEnabled: false,
      });
    } else if (preset.id === "deep-3d-shadow") {
      onChange({
        textShadow: preset.value,
        shadowEnabled: true,
        shadowOffsetX: 3,
        shadowOffsetY: 4,
        shadowBlur: 14,
        shadowColor: "rgba(0, 0, 0, 0.95)",
        glowEnabled: false,
      });
    } else if (preset.category === "glow") {
      const glowColor =
        preset.id === "cyan-glow"
          ? "#38bdf8"
          : preset.id === "gold-glow"
          ? "#facc15"
          : preset.id === "rose-glow"
          ? "#f43f5e"
          : preset.id === "emerald-glow"
          ? "#34d399"
          : "#c084fc";

      onChange({
        textShadow: preset.value,
        glowEnabled: true,
        glowColor,
        glowBlur: 14,
        glowIntensity: preset.id === "white-neon-purple" ? "neon" : "medium",
        shadowEnabled: false,
      });
    } else if (preset.category === "combo") {
      onChange({
        textShadow: preset.value,
        shadowEnabled: true,
        shadowOffsetX: 2,
        shadowOffsetY: 3,
        shadowBlur: 6,
        shadowColor: "rgba(0, 0, 0, 0.9)",
        glowEnabled: true,
        glowColor: preset.id === "fire-combo" ? "#fb923c" : "#c084fc",
        glowBlur: 16,
        glowIntensity: "medium",
      });
    } else {
      onChange({
        textShadow: preset.value,
      });
    }
  };

  // Sync drop shadow changes
  const updateShadow = (patch: Partial<CustomElement>) => {
    const shadowEnabled = patch.shadowEnabled !== undefined ? patch.shadowEnabled : (element.shadowEnabled ?? true);
    const glowEnabled = element.glowEnabled ?? false;

    const nextShadowOffsetX = patch.shadowOffsetX !== undefined ? patch.shadowOffsetX : (element.shadowOffsetX ?? 2);
    const nextShadowOffsetY = patch.shadowOffsetY !== undefined ? patch.shadowOffsetY : (element.shadowOffsetY ?? 3);
    const nextShadowBlur = patch.shadowBlur !== undefined ? patch.shadowBlur : (element.shadowBlur ?? 6);
    const nextShadowColor = patch.shadowColor !== undefined ? patch.shadowColor : (element.shadowColor || "rgba(0, 0, 0, 0.85)");

    const combinedCss = buildTextShadowString({
      shadowEnabled,
      shadowOffsetX: nextShadowOffsetX,
      shadowOffsetY: nextShadowOffsetY,
      shadowBlur: nextShadowBlur,
      shadowColor: nextShadowColor,
      glowEnabled,
      glowBlur: element.glowBlur,
      glowColor: element.glowColor,
      glowIntensity: element.glowIntensity,
    });

    onChange({
      ...patch,
      shadowEnabled,
      shadowOffsetX: nextShadowOffsetX,
      shadowOffsetY: nextShadowOffsetY,
      shadowBlur: nextShadowBlur,
      shadowColor: nextShadowColor,
      textShadow: combinedCss,
    });
  };

  // Sync glow changes
  const updateGlow = (patch: Partial<CustomElement>) => {
    const glowEnabled = patch.glowEnabled !== undefined ? patch.glowEnabled : (element.glowEnabled ?? true);
    const shadowEnabled = element.shadowEnabled ?? false;

    const nextGlowBlur = patch.glowBlur !== undefined ? patch.glowBlur : (element.glowBlur ?? 14);
    const nextGlowColor = patch.glowColor !== undefined ? patch.glowColor : (element.glowColor || "#c084fc");
    const nextGlowIntensity = patch.glowIntensity !== undefined ? patch.glowIntensity : (element.glowIntensity || "medium");

    const combinedCss = buildTextShadowString({
      shadowEnabled,
      shadowOffsetX: element.shadowOffsetX,
      shadowOffsetY: element.shadowOffsetY,
      shadowBlur: element.shadowBlur,
      shadowColor: element.shadowColor,
      glowEnabled,
      glowBlur: nextGlowBlur,
      glowColor: nextGlowColor,
      glowIntensity: nextGlowIntensity,
    });

    onChange({
      ...patch,
      glowEnabled,
      glowBlur: nextGlowBlur,
      glowColor: nextGlowColor,
      glowIntensity: nextGlowIntensity,
      textShadow: combinedCss,
    });
  };

  // Copy CSS to clipboard
  const handleCopyCss = async () => {
    if (!currentTextShadow) return;
    await navigator.clipboard.writeText(`text-shadow: ${currentTextShadow};`);
    setCopiedCss(true);
    setTimeout(() => setCopiedCss(false), 2000);
  };

  const handleResetEffects = () => {
    onChange({
      textShadow: "",
      shadowEnabled: false,
      glowEnabled: false,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      shadowBlur: 6,
      shadowColor: "rgba(0, 0, 0, 0.85)",
      glowBlur: 14,
      glowColor: "#c084fc",
      glowIntensity: "medium",
    });
  };

  return (
    <div className="rounded-xl border border-purple-500/20 bg-purple-950/20 p-3 space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between border-b border-purple-500/15 pb-2">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-200">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Hiệu ứng Chữ: Đổ bóng & Phát sáng</span>
        </div>

        {hasAnyEffect && (
          <button
            type="button"
            onClick={handleResetEffects}
            className="flex items-center gap-1 text-[10px] text-red-400 hover:text-red-300 transition"
            title="Xóa toàn bộ hiệu ứng bóng và glow"
          >
            <RotateCcw className="h-2.5 w-2.5" />
            <span>Tắt hiệu ứng</span>
          </button>
        )}
      </div>

      {/* Live Preview Pill */}
      <div className="rounded-lg bg-black/60 border border-white/5 p-2 flex items-center justify-between gap-2 overflow-hidden">
        <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <Eye className="h-3 w-3 text-purple-400 flex-shrink-0" />
          <span className="text-[10px] uppercase font-mono text-slate-500">Xem thử:</span>
        </div>
        <div
          className="text-sm font-bold truncate tracking-wide px-2 py-0.5"
          style={{
            color: element.color || "#ffffff",
            textShadow: currentTextShadow || "none",
          }}
        >
          {element.content?.slice(0, 24) || "Aa Text Glow"}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-4 gap-1 p-0.5 rounded-lg bg-black/40 border border-white/5 text-[11px]">
        <button
          type="button"
          onClick={() => setActiveTab("presets")}
          className={`py-1 rounded-md transition font-medium ${
            activeTab === "presets"
              ? "bg-purple-600 text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Preset
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("shadow")}
          className={`flex items-center justify-center gap-1 py-1 rounded-md transition font-medium ${
            activeTab === "shadow"
              ? "bg-purple-600 text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Moon className="h-2.5 w-2.5" />
          <span>Đổ bóng</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("glow")}
          className={`flex items-center justify-center gap-1 py-1 rounded-md transition font-medium ${
            activeTab === "glow"
              ? "bg-purple-600 text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sun className="h-2.5 w-2.5" />
          <span>Phát sáng</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("custom")}
          className={`flex items-center justify-center gap-1 py-1 rounded-md transition font-medium ${
            activeTab === "custom"
              ? "bg-purple-600 text-white font-semibold shadow-sm"
              : "text-slate-400 hover:text-white"
          }`}
        >
          <Sliders className="h-2.5 w-2.5" />
          <span>Mã CSS</span>
        </button>
      </div>

      {/* TAB 1: PRESETS */}
      {activeTab === "presets" && (
        <div className="space-y-2">
          <div className="text-[10px] text-slate-400 font-medium">
            Bấm 1 chạm để áp dụng hiệu ứng có sẵn:
          </div>

          <div className="grid grid-cols-2 gap-1.5 max-h-[220px] overflow-y-auto pr-0.5">
            {TEXT_SHADOW_PRESETS.map((p) => {
              const isActive =
                (!p.value && !currentTextShadow) ||
                (p.value && currentTextShadow.toLowerCase() === p.value.toLowerCase());

              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => handleApplyPreset(p)}
                  className={`group relative flex flex-col items-start gap-1 rounded-lg border p-2 text-left transition ${
                    isActive
                      ? "border-purple-400 bg-purple-900/50 ring-1 ring-purple-400 shadow-md"
                      : "border-white/10 bg-black/40 hover:border-purple-500/40 hover:bg-purple-950/30"
                  }`}
                  title={p.description}
                >
                  <div className="flex w-full items-center justify-between">
                    <span className="text-[11px] font-semibold text-slate-200 group-hover:text-white">
                      {p.name}
                    </span>
                    {isActive && <Check className="h-3 w-3 text-purple-300" />}
                  </div>

                  {/* Visual sample inside preset button */}
                  <div
                    className="text-xs font-bold truncate max-w-full px-1"
                    style={{
                      color: p.textColor || "#ffffff",
                      textShadow: p.value || "none",
                    }}
                  >
                    {p.name}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: DROP SHADOW */}
      {activeTab === "shadow" && (
        <div className="space-y-3">
          {/* Shadow toggle */}
          <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Moon className="h-3.5 w-3.5 text-purple-400" />
              <span>Bật Đổ Bóng (Drop Shadow)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={element.shadowEnabled ?? false}
                onChange={(e) => updateShadow({ shadowEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          {(element.shadowEnabled ?? false) ? (
            <div className="space-y-2.5 pt-1">
              {/* Offset X Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Độ lệch ngang X (Offset X)</span>
                  <span className="font-mono text-purple-300">{element.shadowOffsetX ?? 2}px</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={element.shadowOffsetX ?? 2}
                  onChange={(e) => updateShadow({ shadowOffsetX: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Offset Y Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Độ lệch dọc Y (Offset Y)</span>
                  <span className="font-mono text-purple-300">{element.shadowOffsetY ?? 3}px</span>
                </div>
                <input
                  type="range"
                  min="-30"
                  max="30"
                  step="1"
                  value={element.shadowOffsetY ?? 3}
                  onChange={(e) => updateShadow({ shadowOffsetY: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Blur Radius Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Độ nhòe bóng (Blur Radius)</span>
                  <span className="font-mono text-purple-300">{element.shadowBlur ?? 6}px</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="40"
                  step="1"
                  value={element.shadowBlur ?? 6}
                  onChange={(e) => updateShadow({ shadowBlur: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Shadow Color Control */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Màu bóng (Shadow Color)</span>
                  <button
                    type="button"
                    onClick={() => setShowShadowSwatches((v) => !v)}
                    className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
                  >
                    <Palette className="h-3 w-3" />
                    <span>Màu nhanh</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/20 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: element.shadowColor || "#000000" }}
                    title="Bấm để chọn màu bóng"
                  >
                    <input
                      type="color"
                      value={element.shadowColor && element.shadowColor.startsWith("#") ? element.shadowColor : "#000000"}
                      onChange={(e) => updateShadow({ shadowColor: e.target.value })}
                      className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={element.shadowColor || "rgba(0, 0, 0, 0.85)"}
                    onChange={(e) => updateShadow({ shadowColor: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>

                {showShadowSwatches && (
                  <div className="rounded-lg border border-white/10 bg-black/70 p-2 space-y-1">
                    <span className="text-[10px] text-slate-400">Tông màu bóng tối ưu:</span>
                    <div className="grid grid-cols-3 gap-1">
                      {SHADOW_COLOR_SWATCHES.map((sw) => (
                        <button
                          key={sw.name}
                          type="button"
                          onClick={() => {
                            updateShadow({ shadowColor: sw.hex });
                            setShowShadowSwatches(false);
                          }}
                          className="flex items-center gap-1 px-1.5 py-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300 truncate"
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: sw.hex }}
                          />
                          <span className="truncate">{sw.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 text-center py-2 bg-black/20 rounded-lg">
              Bật công tắc phía trên để chỉnh độ lệch X, Y, độ nhòe và màu đổ bóng.
            </div>
          )}
        </div>
      )}

      {/* TAB 3: OUTER GLOW */}
      {activeTab === "glow" && (
        <div className="space-y-3">
          {/* Glow toggle */}
          <div className="flex items-center justify-between bg-black/30 p-2 rounded-lg border border-white/5">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Sun className="h-3.5 w-3.5 text-amber-400" />
              <span>Bật Phát Sáng (Outer Glow)</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={element.glowEnabled ?? false}
                onChange={(e) => updateGlow({ glowEnabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-8 h-4 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-purple-600" />
            </label>
          </div>

          {(element.glowEnabled ?? false) ? (
            <div className="space-y-2.5 pt-1">
              {/* Glow Radius Slider */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-slate-400">
                  <span>Bán kính hào quang (Glow Radius)</span>
                  <span className="font-mono text-purple-300">{element.glowBlur ?? 14}px</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="50"
                  step="1"
                  value={element.glowBlur ?? 14}
                  onChange={(e) => updateGlow({ glowBlur: Number(e.target.value) })}
                  className="w-full accent-purple-500"
                />
              </div>

              {/* Glow Intensity Segmented Button */}
              <div className="space-y-1">
                <label className="text-[11px] text-slate-400">Cường độ phát sáng (Intensity)</label>
                <div className="grid grid-cols-3 gap-1 text-[10px] p-0.5 bg-black/40 rounded-lg border border-white/5">
                  <button
                    type="button"
                    onClick={() => updateGlow({ glowIntensity: "soft" })}
                    className={`py-1 rounded transition font-medium ${
                      (element.glowIntensity || "medium") === "soft"
                        ? "bg-purple-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Dịu nhẹ (Soft)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateGlow({ glowIntensity: "medium" })}
                    className={`py-1 rounded transition font-medium ${
                      (element.glowIntensity || "medium") === "medium"
                        ? "bg-purple-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Vừa (Medium)
                  </button>
                  <button
                    type="button"
                    onClick={() => updateGlow({ glowIntensity: "neon" })}
                    className={`py-1 rounded transition font-medium ${
                      element.glowIntensity === "neon"
                        ? "bg-purple-600 text-white font-semibold"
                        : "text-slate-400 hover:text-white"
                    }`}
                  >
                    Siêu Neon
                  </button>
                </div>
              </div>

              {/* Glow Color Control */}
              <div className="space-y-1.5 pt-1">
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span>Màu hào quang (Glow Color)</span>
                  <button
                    type="button"
                    onClick={() => setShowGlowSwatches((v) => !v)}
                    className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
                  >
                    <Palette className="h-3 w-3" />
                    <span>Màu nhanh</span>
                  </button>
                </div>

                <div className="flex items-center gap-2">
                  <label
                    className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/20 shadow-inner flex-shrink-0"
                    style={{ backgroundColor: element.glowColor || "#c084fc" }}
                    title="Bấm để chọn màu phát sáng"
                  >
                    <input
                      type="color"
                      value={element.glowColor && element.glowColor.startsWith("#") ? element.glowColor : "#c084fc"}
                      onChange={(e) => updateGlow({ glowColor: e.target.value })}
                      className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                    />
                  </label>
                  <input
                    type="text"
                    value={element.glowColor || "#c084fc"}
                    onChange={(e) => updateGlow({ glowColor: e.target.value })}
                    className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-xs text-white font-mono outline-none focus:border-purple-500"
                  />
                </div>

                {showGlowSwatches && (
                  <div className="rounded-lg border border-white/10 bg-black/70 p-2 space-y-1">
                    <span className="text-[10px] text-slate-400">Hào quang thịnh hành:</span>
                    <div className="grid grid-cols-4 gap-1">
                      {GLOW_COLOR_SWATCHES.map((gw) => (
                        <button
                          key={gw.name}
                          type="button"
                          onClick={() => {
                            updateGlow({ glowColor: gw.hex });
                            setShowGlowSwatches(false);
                          }}
                          className="flex items-center gap-1 p-1 rounded bg-white/5 hover:bg-white/10 text-[10px] text-slate-300"
                          title={gw.name}
                        >
                          <span
                            className="h-2.5 w-2.5 rounded-full border border-white/20 flex-shrink-0"
                            style={{ backgroundColor: gw.hex }}
                          />
                          <span className="truncate">{gw.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-400 text-center py-2 bg-black/20 rounded-lg">
              Bật công tắc phía trên để tùy chỉnh bán kính hào quang, màu sắc và mức độ phát sáng.
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CUSTOM CSS */}
      {activeTab === "custom" && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Chuỗi CSS `text-shadow`:</span>
            {currentTextShadow && (
              <button
                type="button"
                onClick={handleCopyCss}
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
              >
                {copiedCss ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                <span>{copiedCss ? "Đã chép!" : "Chép CSS"}</span>
              </button>
            )}
          </div>

          <textarea
            rows={3}
            value={currentTextShadow}
            onChange={(e) => onChange({ textShadow: e.target.value })}
            placeholder="Ví dụ: 0 0 10px #c084fc, 2px 3px 6px rgba(0,0,0,0.8)"
            className="w-full rounded-lg border border-white/10 bg-black/50 p-2 text-xs text-white font-mono outline-none focus:border-purple-500 resize-none"
          />

          <div className="text-[10px] text-slate-500 leading-relaxed">
            💡 Bạn có thể dán trực tiếp bất kỳ cú pháp <code className="text-purple-300 font-mono">text-shadow</code> nào từ Figma, Photoshop hoặc CSS. Satori và Canvas Studio sẽ tự động kết xuất chuẩn xác khi xuất GIF / WebP / PNG!
          </div>
        </div>
      )}
    </div>
  );
}
