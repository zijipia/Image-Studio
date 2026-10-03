import React, { useState } from "react";
import type { ParticleConfig, ParticlePresetId, ParticleShape } from "../lib/particle-system";
import {
  PARTICLE_PRESETS,
  PARTICLE_PRESET_LIST,
  createDefaultParticleConfig,
} from "../lib/particle-system";
import {
  Sparkles,
  Sliders,
  Flame,
  Snowflake,
  Music,
  Star,
  Flower2,
  Palette,
  CircleDot,
  RotateCw,
  Wind,
  Layers,
  Check,
} from "lucide-react";

interface ParticleControlPanelProps {
  config: ParticleConfig;
  onChange: (config: ParticleConfig) => void;
  title?: string;
  onClose?: () => void;
}

const COLOR_SWATCHES = [
  "#fbbf24", // Gold
  "#f59e0b", // Amber
  "#f97316", // Orange
  "#ef4444", // Red
  "#f472b6", // Sakura Pink
  "#ec4899", // Neon Pink
  "#c084fc", // Purple Glow
  "#a855f7", // Violet
  "#6366f1", // Indigo
  "#38bdf8", // Sky Blue
  "#06b6d4", // Cyan
  "#10b981", // Emerald
  "#e0f2fe", // Ice White
  "#ffffff", // Crisp White
];

export function ParticleControlPanel({
  config,
  onChange,
  title = "Particle System",
  onClose,
}: ParticleControlPanelProps) {
  const [activeTab, setActiveTab] = useState<"presets" | "physics" | "appearance">("presets");
  const [showColorSwatches, setShowColorSwatches] = useState(false);
  const [showSecondarySwatches, setShowSecondarySwatches] = useState(false);

  const applyPreset = (presetId: ParticlePresetId) => {
    const p = PARTICLE_PRESETS[presetId];
    if (p) {
      onChange({ ...p.config });
    }
  };

  const updateField = <K extends keyof ParticleConfig>(field: K, val: ParticleConfig[K]) => {
    onChange({
      ...config,
      [field]: val,
    });
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-tr from-amber-500 via-rose-500 to-purple-600 text-white shadow-md shadow-amber-500/20">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="font-bold text-white text-sm">{title}</h3>
            <span className="text-[10px] text-slate-400">Interactive physics & emitters</span>
          </div>
        </div>

        {/* Tab switchers */}
        <div className="flex items-center rounded-lg bg-black/40 border border-white/10 p-0.5">
          <button
            type="button"
            onClick={() => setActiveTab("presets")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              activeTab === "presets"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Presets
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("physics")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              activeTab === "physics"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Physics
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("appearance")}
            className={`px-2 py-1 rounded text-[11px] font-medium transition ${
              activeTab === "appearance"
                ? "bg-purple-600 text-white shadow-sm"
                : "text-slate-400 hover:text-white"
            }`}
          >
            Style
          </button>
        </div>
      </div>

      {/* TAB 1: 6 User Presets */}
      {activeTab === "presets" && (
        <div className="space-y-3">
          <div className="text-[11px] text-slate-400 flex items-center justify-between">
            <span className="font-semibold text-slate-300">Chọn Preset hạt:</span>
            <span className="text-[10px] text-purple-300 font-mono">6 Styles</span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            {PARTICLE_PRESET_LIST.map((preset) => {
              const isSelected = config.preset === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset.id)}
                  className={`flex flex-col items-start p-2.5 rounded-xl border text-left transition relative overflow-hidden group ${
                    isSelected
                      ? "border-purple-400 bg-purple-950/60 shadow-lg shadow-purple-950/60 ring-1 ring-purple-400"
                      : "border-white/10 bg-white/[0.03] hover:border-purple-500/40 hover:bg-white/[0.07]"
                  }`}
                >
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="text-lg">{preset.icon}</span>
                    {isSelected && (
                      <span className="h-4 w-4 rounded-full bg-purple-500 text-white flex items-center justify-center text-[10px]">
                        <Check className="h-2.5 w-2.5" />
                      </span>
                    )}
                  </div>
                  <div className="font-semibold text-white text-xs">{preset.name}</div>
                  <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                    {preset.description}
                  </div>
                  <div className="mt-2 flex items-center gap-1.5 text-[9px] font-mono text-slate-400">
                    <span
                      className="inline-block h-2 w-2 rounded-full border border-white/20"
                      style={{ backgroundColor: preset.config.color }}
                    />
                    <span>{preset.config.count} hạt</span>
                    <span>·</span>
                    <span>{preset.config.speed}px/s</span>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-xl border border-white/5 bg-black/40 p-3 space-y-2">
            <div className="text-[11px] font-semibold text-slate-300 flex items-center gap-1.5">
              <Sliders className="h-3.5 w-3.5 text-purple-400" />
              <span>Cấu trúc tham số Particle System:</span>
            </div>
            <pre className="font-mono text-[10px] leading-relaxed text-slate-400 bg-black/50 p-2.5 rounded-lg border border-white/5 overflow-x-auto">
{`Particle
├── Count:     ${config.count} particles
├── Size:      ${config.size}px
├── Speed:     ${config.speed}px/s
├── Direction: ${config.direction}°
├── Spread:    ${config.spread}°
├── Gravity:   ${config.gravity}px/s²
├── Opacity:   ${Math.round(config.opacity * 100)}%
├── Lifetime:  ${config.lifetime}s
└── Color:     ${config.color}`}
            </pre>
          </div>
        </div>
      )}

      {/* TAB 2: Physics Controls (Count, Size, Speed, Direction, Spread, Gravity, Lifetime) */}
      {activeTab === "physics" && (
        <div className="space-y-3.5">
          {/* Count */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Count (Số lượng hạt)</span>
              <span className="font-mono text-purple-300">{config.count}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={200}
                step={1}
                value={config.count}
                onChange={(e) => updateField("count", parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <input
                type="number"
                min={1}
                max={300}
                value={config.count}
                onChange={(e) => updateField("count", Math.max(1, Math.min(300, parseInt(e.target.value, 10) || 10)))}
                className="w-14 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white text-right outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Size */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Size (Kích thước)</span>
              <span className="font-mono text-purple-300">{config.size}px</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={2}
                max={36}
                step={1}
                value={config.size}
                onChange={(e) => updateField("size", parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <input
                type="number"
                min={2}
                max={60}
                value={config.size}
                onChange={(e) => updateField("size", Math.max(2, Math.min(60, parseInt(e.target.value, 10) || 6)))}
                className="w-14 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white text-right outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Speed */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Speed (Vận tốc bay)</span>
              <span className="font-mono text-purple-300">{config.speed}px/s</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={350}
                step={5}
                value={config.speed}
                onChange={(e) => updateField("speed", parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <input
                type="number"
                min={0}
                max={600}
                value={config.speed}
                onChange={(e) => updateField("speed", Math.max(0, parseInt(e.target.value, 10) || 0))}
                className="w-14 rounded border border-white/10 bg-black/40 px-1.5 py-0.5 font-mono text-[11px] text-white text-right outline-none focus:border-purple-500"
              />
            </div>
          </div>

          {/* Direction with shortcuts */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Direction (Hướng bắn)</span>
              <span className="font-mono text-purple-300">{config.direction}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={config.direction}
                onChange={(e) => updateField("direction", parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <span className="w-14 text-right font-mono text-[11px] text-slate-300">
                {config.direction}°
              </span>
            </div>
            {/* Direction Quick Buttons */}
            <div className="grid grid-cols-4 gap-1 pt-1">
              <button
                type="button"
                onClick={() => updateField("direction", 270)}
                className={`py-1 rounded text-[10px] font-medium border transition flex items-center justify-center gap-1 ${
                  config.direction === 270
                    ? "border-purple-400 bg-purple-950/60 text-white"
                    : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <span>⬆ Lên</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("direction", 90)}
                className={`py-1 rounded text-[10px] font-medium border transition flex items-center justify-center gap-1 ${
                  config.direction === 90
                    ? "border-purple-400 bg-purple-950/60 text-white"
                    : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <span>⬇ Xuống</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("direction", 180)}
                className={`py-1 rounded text-[10px] font-medium border transition flex items-center justify-center gap-1 ${
                  config.direction === 180
                    ? "border-purple-400 bg-purple-950/60 text-white"
                    : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <span>⬅ Trái</span>
              </button>
              <button
                type="button"
                onClick={() => updateField("direction", 0)}
                className={`py-1 rounded text-[10px] font-medium border transition flex items-center justify-center gap-1 ${
                  config.direction === 0
                    ? "border-purple-400 bg-purple-950/60 text-white"
                    : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                }`}
              >
                <span>➡ Phải</span>
              </button>
            </div>
          </div>

          {/* Spread */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Spread (Độ phân tán góc)</span>
              <span className="font-mono text-purple-300">{config.spread}°</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0}
                max={360}
                step={5}
                value={config.spread}
                onChange={(e) => updateField("spread", parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <span className="w-14 text-right font-mono text-[11px] text-slate-300">
                {config.spread}°
              </span>
            </div>
          </div>

          {/* Gravity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <div className="flex items-center gap-1">
                <span className="text-slate-300 font-medium">Gravity (Trọng lực)</span>
                <span className="text-[10px] text-slate-500">
                  {config.gravity > 0 ? "(Rơi xuống)" : config.gravity < 0 ? "(Bay lên)" : "(Lơ lửng)"}
                </span>
              </div>
              <span className="font-mono text-purple-300">{config.gravity}</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={-150}
                max={200}
                step={5}
                value={config.gravity}
                onChange={(e) => updateField("gravity", parseInt(e.target.value, 10))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <span className="w-14 text-right font-mono text-[11px] text-slate-300">
                {config.gravity}
              </span>
            </div>
          </div>

          {/* Lifetime */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Lifetime (Tuổi thọ hạt)</span>
              <span className="font-mono text-purple-300">{config.lifetime.toFixed(1)}s</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.5}
                max={8.0}
                step={0.1}
                value={config.lifetime}
                onChange={(e) => updateField("lifetime", parseFloat(e.target.value))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <span className="w-14 text-right font-mono text-[11px] text-slate-300">
                {config.lifetime.toFixed(1)}s
              </span>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Style & Appearance (Opacity, Color, Secondary Color, Shape, Glow) */}
      {activeTab === "appearance" && (
        <div className="space-y-3.5">
          {/* Opacity */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-[11px]">
              <span className="text-slate-300 font-medium">Opacity (Độ mờ / trong suốt)</span>
              <span className="font-mono text-purple-300">{Math.round(config.opacity * 100)}%</span>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={0.1}
                max={1.0}
                step={0.05}
                value={config.opacity}
                onChange={(e) => updateField("opacity", parseFloat(e.target.value))}
                className="h-1.5 flex-1 accent-purple-500 bg-white/10 rounded cursor-pointer"
              />
              <span className="w-14 text-right font-mono text-[11px] text-slate-300">
                {Math.round(config.opacity * 100)}%
              </span>
            </div>
          </div>

          {/* Shape Selector */}
          <div className="space-y-1.5">
            <span className="text-[11px] text-slate-300 font-medium">Shape (Hình dạng hạt)</span>
            <div className="grid grid-cols-4 gap-1.5">
              {(
                [
                  { id: "spark", label: "Spark", icon: "✨" },
                  { id: "petal", label: "Petal", icon: "🌸" },
                  { id: "snow", label: "Snow", icon: "❄" },
                  { id: "fire", label: "Fire", icon: "🔥" },
                  { id: "star", label: "Star", icon: "💫" },
                  { id: "music", label: "Music", icon: "🎵" },
                  { id: "circle", label: "Circle", icon: "⚪" },
                ] as const
              ).map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => updateField("shape", s.id as ParticleShape)}
                  className={`flex items-center gap-1.5 p-1.5 rounded-lg border text-left transition ${
                    config.shape === s.id
                      ? "border-purple-400 bg-purple-900/40 text-white font-semibold"
                      : "border-white/5 bg-white/5 text-slate-400 hover:text-white"
                  }`}
                >
                  <span>{s.icon}</span>
                  <span className="text-[10px]">{s.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Primary Color Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-medium">Primary Color (Màu chủ đạo)</span>
              <button
                type="button"
                onClick={() => setShowColorSwatches((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
              >
                <Palette className="h-3 w-3" />
                <span>{showColorSwatches ? "Ẩn bảng" : "Bảng màu"}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/20 shadow-inner flex-shrink-0"
                style={{ backgroundColor: config.color }}
                title="Bấm để chọn màu"
              >
                <input
                  type="color"
                  value={config.color.startsWith("#") && config.color.length === 7 ? config.color : "#fbbf24"}
                  onChange={(e) => updateField("color", e.target.value)}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                />
              </label>
              <input
                type="text"
                value={config.color}
                onChange={(e) => updateField("color", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-purple-500"
              />
            </div>
            {showColorSwatches && (
              <div className="rounded-xl border border-white/10 bg-black/60 p-2 grid grid-cols-7 gap-1">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateField("color", hex)}
                    className="h-6 rounded border border-white/10 hover:scale-110 transition flex items-center justify-center"
                    style={{ backgroundColor: hex }}
                  >
                    {config.color.toLowerCase() === hex.toLowerCase() && (
                      <Check className="h-3 w-3 text-black" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Secondary Color Picker */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] text-slate-300">
              <span className="font-medium">Secondary Color (Màu phụ / Chuyển sắc)</span>
              <button
                type="button"
                onClick={() => setShowSecondarySwatches((v) => !v)}
                className="flex items-center gap-1 text-[10px] text-purple-400 hover:text-purple-300"
              >
                <Palette className="h-3 w-3" />
                <span>{showSecondarySwatches ? "Ẩn bảng" : "Bảng màu"}</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <label
                className="relative flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg border border-white/20 shadow-inner flex-shrink-0"
                style={{ backgroundColor: config.colorSecondary || config.color }}
                title="Bấm để chọn màu phụ"
              >
                <input
                  type="color"
                  value={
                    config.colorSecondary && config.colorSecondary.startsWith("#") && config.colorSecondary.length === 7
                      ? config.colorSecondary
                      : "#ffffff"
                  }
                  onChange={(e) => updateField("colorSecondary", e.target.value)}
                  className="absolute inset-0 h-full w-full opacity-0 cursor-pointer"
                />
              </label>
              <input
                type="text"
                value={config.colorSecondary || ""}
                placeholder="(Tùy chọn) Ví dụ: #ffffff"
                onChange={(e) => updateField("colorSecondary", e.target.value)}
                className="w-full rounded-lg border border-white/10 bg-black/40 px-2 py-1.5 text-xs text-white font-mono outline-none focus:border-purple-500"
              />
            </div>
            {showSecondarySwatches && (
              <div className="rounded-xl border border-white/10 bg-black/60 p-2 grid grid-cols-7 gap-1">
                {COLOR_SWATCHES.map((hex) => (
                  <button
                    key={hex}
                    type="button"
                    onClick={() => updateField("colorSecondary", hex)}
                    className="h-6 rounded border border-white/10 hover:scale-110 transition flex items-center justify-center"
                    style={{ backgroundColor: hex }}
                  >
                    {config.colorSecondary?.toLowerCase() === hex.toLowerCase() && (
                      <Check className="h-3 w-3 text-black" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Glow Toggle */}
          <div className="flex items-center justify-between pt-1">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-300">Glow & Radial Blur</span>
              <span className="text-[10px] text-slate-500">Hiệu ứng tỏa sáng mềm xung quanh hạt</span>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.glow ?? true}
                onChange={(e) => updateField("glow", e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-white/10 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
