import React, { useState } from "react";
import type { ParticleConfig, ParticlePresetId } from "../lib/particle-system";
import {
  PARTICLE_PRESETS,
  PARTICLE_PRESET_LIST,
  createDefaultParticleConfig,
} from "../lib/particle-system";
import { Sparkles, Sliders, X, Check } from "lucide-react";
import { ParticleControlPanel } from "./ParticleControlPanel";

interface ParticleOverlayButtonProps {
  particleConfig?: ParticleConfig;
  onChange: (config: ParticleConfig | undefined) => void;
}

export function ParticleOverlayButton({
  particleConfig,
  onChange,
}: ParticleOverlayButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isEnabled = !!particleConfig;

  const currentPresetName =
    particleConfig?.preset && PARTICLE_PRESETS[particleConfig.preset]
      ? `${PARTICLE_PRESETS[particleConfig.preset].icon} ${PARTICLE_PRESETS[particleConfig.preset].name}`
      : "Custom";

  const handleToggle = () => {
    if (isEnabled) {
      onChange(undefined);
    } else {
      onChange(createDefaultParticleConfig("spark"));
      setIsOpen(true);
    }
  };

  const handleSelectPreset = (id: ParticlePresetId) => {
    onChange(createDefaultParticleConfig(id));
  };

  return (
    <div className="relative inline-block text-xs">
      <div className="flex items-center gap-1 bg-black/40 rounded-xl border border-white/10 p-0.5">
        <button
          type="button"
          onClick={handleToggle}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
            isEnabled
              ? "bg-gradient-to-r from-amber-500/30 via-rose-500/30 to-purple-500/30 border border-amber-500/40 text-amber-200 shadow-sm"
              : "text-slate-400 hover:text-white hover:bg-white/5"
          }`}
          title="Bật/Tắt hiệu ứng hạt lấp lánh trên banner"
        >
          <Sparkles className={`h-3.5 w-3.5 ${isEnabled ? "text-amber-400 animate-spin-slow" : "text-slate-400"}`} />
          <span>{isEnabled ? currentPresetName : "Particles"}</span>
          {isEnabled && (
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse ml-0.5" />
          )}
        </button>

        {isEnabled && (
          <button
            type="button"
            onClick={() => setIsOpen((v) => !v)}
            className={`p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition ${
              isOpen ? "text-purple-300 bg-white/10" : ""
            }`}
            title="Tùy chỉnh chi tiết Particle System"
          >
            <Sliders className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      {/* Floating Popup Panel */}
      {isOpen && isEnabled && (
        <div className="absolute right-0 top-11 z-50 w-80 sm:w-96 rounded-2xl border border-white/15 bg-[#120d24] p-4 shadow-2xl backdrop-blur-xl animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-white/10 pb-2 mb-3">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-amber-400" />
              <span className="font-bold text-white text-xs">Particle System Overlay</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  onChange(undefined);
                  setIsOpen(false);
                }}
                className="text-[10px] text-red-400 hover:text-red-300"
              >
                Tắt hiệu ứng
              </button>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <ParticleControlPanel
            config={particleConfig}
            onChange={(newConfig) => onChange(newConfig)}
            onClose={() => setIsOpen(false)}
          />
        </div>
      )}
    </div>
  );
}
