import React, { useRef, useState, useEffect } from "react";
import type { ProfileData, ParticleConfig } from "../lib/types";
import { PROFILE_WIDTH, PROFILE_HEIGHT } from "../lib/constants";
import { ParticleCanvas } from "./ParticleCanvas";
import { ParticleOverlayButton } from "./ParticleOverlayButton";
import { Download, Copy, Check, ExternalLink, User } from "lucide-react";

interface ProfilePreviewProps {
  data: ProfileData;
  onGenerate: () => void;
  isGenerating: boolean;
  lastGeneratedBlob?: Blob | null;
  particleConfig?: ParticleConfig;
  onParticleConfigChange?: (config: ParticleConfig | undefined) => void;
}

export function ProfilePreview({
  data,
  onGenerate,
  isGenerating,
  lastGeneratedBlob,
  particleConfig,
  onParticleConfigChange,
}: ProfilePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.75);
  const [copied, setCopied] = useState<boolean>(false);
  const [imgError, setImgError] = useState<boolean>(false);
  const [previewPngUrl, setPreviewPngUrl] = useState<string | null>(null);

  useEffect(() => {
    if (lastGeneratedBlob) {
      const url = URL.createObjectURL(lastGeneratedBlob);
      setPreviewPngUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [lastGeneratedBlob]);

  useEffect(() => {
    function updateScale() {
      if (!containerRef.current) return;
      const availableWidth = containerRef.current.clientWidth - 40;
      const newScale = Math.min(1, Math.max(0.35, availableWidth / PROFILE_WIDTH));
      setScale(newScale);
    }
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const handleCopyBlob = async () => {
    if (!lastGeneratedBlob) {
      onGenerate();
      return;
    }
    try {
      if (navigator.clipboard && "write" in navigator.clipboard) {
        await navigator.clipboard.write([
          new ClipboardItem({ "image/png": lastGeneratedBlob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      console.warn("Failed to copy image:", err);
    }
  };

  const percent = Math.min(
    100,
    Math.max(0, Math.round((data.currentXp / (data.requiredXp || 1)) * 100))
  );

  const theme = data.theme || "ruby-poly";

  // Visual Theme Configuration
  const themeStyles = {
    "ruby-poly": {
      cardBg: "linear-gradient(135deg, #090210 0%, #1a031e 30%, #3d0728 65%, #630c33 100%)",
      shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(225, 29, 72, 0.25)",
      border: "1px solid rgba(244, 63, 94, 0.25)",
      avatarBorder: "linear-gradient(135deg, rgba(244, 63, 94, 0.8), rgba(255, 255, 255, 0.3))",
      avatarRadius: "rounded-full",
      avatarImgRadius: "rounded-full",
      primaryText: "#f43f5e",
      secondaryText: "#a1a1aa",
      progressBg: "#3e4147",
      progressFill: "linear-gradient(90deg, #f43f5e, #fb7185)",
      badgeBg: "rgba(244, 63, 94, 0.15)",
      badgeBorder: "1px solid rgba(244, 63, 94, 0.4)",
      badgeColor: "#fb7185",
      statsColor: "#f43f5e",
      shape1: "linear-gradient(45deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.05))",
      shape2: "linear-gradient(135deg, rgba(136, 19, 55, 0.3), transparent)",
    },
    "cyber-neon": {
      cardBg: "radial-gradient(circle at 85% 15%, rgba(192, 132, 252, 0.2) 0%, transparent 60%), linear-gradient(135deg, #050816 0%, #0c1024 50%, #160e29 100%)",
      shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 30px rgba(56, 189, 248, 0.3)",
      border: "2px solid rgba(56, 189, 248, 0.45)",
      avatarBorder: "linear-gradient(135deg, #38bdf8, #c084fc)",
      avatarRadius: "rounded-[24px]",
      avatarImgRadius: "rounded-[20px]",
      primaryText: "#38bdf8",
      secondaryText: "#94a3b8",
      progressBg: "#111827",
      progressFill: "linear-gradient(90deg, #38bdf8, #c084fc)",
      badgeBg: "rgba(56, 189, 248, 0.15)",
      badgeBorder: "1px solid rgba(56, 189, 248, 0.5)",
      badgeColor: "#38bdf8",
      statsColor: "#e879f9",
      shape1: "linear-gradient(45deg, rgba(56, 189, 248, 0.2), transparent)",
      shape2: "linear-gradient(135deg, rgba(192, 132, 252, 0.25), transparent)",
    },
    "glass-minimal": {
      cardBg: "radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.2) 0%, transparent 50%), linear-gradient(135deg, #021a14 0%, #06241c 50%, #0a1b24 100%)",
      shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.2)",
      border: "1px solid rgba(52, 211, 153, 0.35)",
      avatarBorder: "linear-gradient(135deg, rgba(52, 211, 153, 0.8), rgba(255, 255, 255, 0.3))",
      avatarRadius: "rounded-full",
      avatarImgRadius: "rounded-full",
      primaryText: "#34d399",
      secondaryText: "#a7f3d0",
      progressBg: "rgba(0, 0, 0, 0.45)",
      progressFill: "linear-gradient(90deg, #10b981, #6ee7b7)",
      badgeBg: "rgba(16, 185, 129, 0.15)",
      badgeBorder: "1px solid rgba(52, 211, 153, 0.4)",
      badgeColor: "#6ee7b7",
      statsColor: "#34d399",
      shape1: "linear-gradient(45deg, rgba(16, 185, 129, 0.15), transparent)",
      shape2: "linear-gradient(135deg, rgba(45, 212, 191, 0.15), transparent)",
    },
    "gold-legend": {
      cardBg: "radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.25) 0%, transparent 60%), linear-gradient(135deg, #140d02 0%, #261a05 45%, #181003 100%)",
      shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.35)",
      border: "2px solid rgba(245, 158, 11, 0.5)",
      avatarBorder: "linear-gradient(135deg, #fef08a, #f59e0b)",
      avatarRadius: "rounded-full",
      avatarImgRadius: "rounded-full",
      primaryText: "#fbbf24",
      secondaryText: "#fed7aa",
      progressBg: "rgba(0, 0, 0, 0.5)",
      progressFill: "linear-gradient(90deg, #f59e0b, #fef08a)",
      badgeBg: "rgba(245, 158, 11, 0.2)",
      badgeBorder: "1px solid rgba(245, 158, 11, 0.6)",
      badgeColor: "#fef08a",
      statsColor: "#fbbf24",
      shape1: "linear-gradient(45deg, rgba(245, 158, 11, 0.25), transparent)",
      shape2: "linear-gradient(135deg, rgba(217, 119, 6, 0.25), transparent)",
    },
  }[theme] || {
    cardBg: "linear-gradient(135deg, #090210 0%, #1a031e 30%, #3d0728 65%, #630c33 100%)",
    shadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(225, 29, 72, 0.25)",
    border: "1px solid rgba(244, 63, 94, 0.25)",
    avatarBorder: "linear-gradient(135deg, rgba(244, 63, 94, 0.8), rgba(255, 255, 255, 0.3))",
    avatarRadius: "rounded-full",
    avatarImgRadius: "rounded-full",
    primaryText: "#f43f5e",
    secondaryText: "#a1a1aa",
    progressBg: "#3e4147",
    progressFill: "linear-gradient(90deg, #f43f5e, #fb7185)",
    badgeBg: "rgba(244, 63, 94, 0.15)",
    badgeBorder: "1px solid rgba(244, 63, 94, 0.4)",
    badgeColor: "#fb7185",
    statsColor: "#f43f5e",
    shape1: "linear-gradient(45deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.05))",
    shape2: "linear-gradient(135deg, rgba(136, 19, 55, 0.3), transparent)",
  };

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e0a1e]/90 shadow-2xl backdrop-blur-xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-rose-500 shadow-sm shadow-rose-500/50" />
            <h3 className="text-sm font-semibold text-white">Profile Card Preview</h3>
          </div>
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-rose-300">
            {PROFILE_WIDTH} × {PROFILE_HEIGHT} px · {theme.toUpperCase()}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Particle System Ambience Selector */}
          {onParticleConfigChange && (
            <ParticleOverlayButton
              particleConfig={particleConfig}
              onChange={onParticleConfigChange}
            />
          )}

          {lastGeneratedBlob && (
            <button
              onClick={handleCopyBlob}
              className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-white/10"
              title="Copy image to clipboard"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              <span>{copied ? "Copied!" : "Copy"}</span>
            </button>
          )}

          <button
            onClick={onGenerate}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-rose-600 to-pink-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-rose-600/30 transition-all hover:from-rose-500 hover:to-pink-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <>
                <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Exporting...</span>
              </>
            ) : (
              <>
                <Download className="h-3.5 w-3.5" />
                <span>Export PNG</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Canvas Viewport */}
      <div
        ref={containerRef}
        className="relative flex min-h-[380px] flex-1 items-center justify-center overflow-auto p-6"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(225, 29, 72, 0.12) 0%, transparent 70%), #06040d",
        }}
      >
        <div
          className="transition-transform duration-150 ease-out origin-center"
          style={{
            transform: `scale(${scale})`,
            width: `${PROFILE_WIDTH}px`,
            height: `${PROFILE_HEIGHT}px`,
          }}
        >
          {/* Exact Profile Card DOM with Selected Theme */}
          <div
            className="relative select-none overflow-hidden rounded-[20px] shadow-2xl"
            style={{
              width: `${PROFILE_WIDTH}px`,
              height: `${PROFILE_HEIGHT}px`,
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8)",
            }}
          >
            {/* Particle Ambience Overlay */}
            {particleConfig && (
              <ParticleCanvas
                config={particleConfig}
                width={PROFILE_WIDTH}
                height={PROFILE_HEIGHT}
                playing={true}
                className="z-30"
              />
            )}

            {/* 1. Ruby Poly (Classic Gaming Rank Card) */}
            {theme === "ruby-poly" && (
              <div
                className="relative flex h-full w-full items-center px-[35px] overflow-hidden border border-rose-500/30"
                style={{
                  background: "linear-gradient(135deg, #090210 0%, #1a031e 30%, #3d0728 65%, #630c33 100%)",
                }}
              >
                {/* Background Geometric Shards */}
                <div
                  className="pointer-events-none absolute -top-[50px] -right-[50px] h-[450px] w-[450px] rounded-[40px] opacity-70"
                  style={{
                    transform: "rotate(45deg)",
                    background: "linear-gradient(45deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.05))",
                  }}
                />
                <div
                  className="pointer-events-none absolute -bottom-[80px] left-[250px] h-[350px] w-[350px] rounded-[30px] opacity-60"
                  style={{
                    transform: "rotate(25deg)",
                    background: "linear-gradient(135deg, rgba(136, 19, 55, 0.3), transparent)",
                  }}
                />

                {/* Left Avatar */}
                <div className="relative z-10 flex flex-col items-center">
                  <div className="flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-full p-1 bg-gradient-to-tr from-rose-500 via-pink-400 to-rose-300 shadow-2xl shadow-rose-600/40">
                    <img
                      src={data.avatar}
                      alt={data.username}
                      className="h-[142px] w-[142px] rounded-full object-cover"
                      crossOrigin="anonymous"
                    />
                  </div>
                  <div className="relative -mt-4 z-20 rounded-full bg-rose-600 px-3 py-0.5 text-[11px] font-bold text-white shadow-md border border-rose-300/40 font-mono">
                    Lv. {data.level ?? 1}
                  </div>
                </div>

                {/* Content Right */}
                <div className="relative z-10 ml-[35px] flex flex-1 flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2.5">
                        <h2 className="text-[34px] font-bold leading-[40px] text-rose-500">
                          {data.username || "__ziji"}
                        </h2>
                        {data.badge && (
                          <span className="rounded-full px-2.5 py-0.5 text-[11px] font-bold tracking-wider bg-rose-500/15 border border-rose-500/40 text-rose-300">
                            {data.badge}
                          </span>
                        )}
                      </div>
                      <div className="text-[19px] leading-[25px] mt-[2px] text-zinc-400">
                        {data.title ? `${data.title} · ` : ""}
                        {data.balance || "0 xu"}
                      </div>
                    </div>

                    <div className="rounded-xl px-3 py-1 font-mono text-[16px] font-bold bg-rose-500/15 border border-rose-500/40 text-rose-400">
                      {data.rank ?? "#1"}
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-[16px] h-[26px] w-[660px] overflow-hidden rounded-full bg-[#3e4147] shadow-inner flex p-0.5">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-rose-500 to-pink-400 transition-all duration-300"
                      style={{ width: `${Math.max(2, percent)}%` }}
                    />
                  </div>

                  {/* Stats Row */}
                  <div className="mt-[16px] flex flex-row gap-[50px] text-[18px] font-semibold tracking-wider text-rose-400 font-mono">
                    <span>⚔️ LEVEL {data.level ?? 1}</span>
                    <span>⚡ XP: {data.currentXp ?? 0}/{data.requiredXp ?? 100} ({percent}%)</span>
                    <span>🏆 RANK: {data.rank ?? "#1"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Cyber Neon (Sci-Fi Cyberpunk HUD ID Card) */}
            {theme === "cyber-neon" && (
              <div
                className="relative flex h-full w-full flex-col justify-between p-6 overflow-hidden border-2 border-cyan-400/60 font-mono"
                style={{
                  background:
                    "radial-gradient(circle at 85% 15%, rgba(192, 132, 252, 0.2) 0%, transparent 60%), linear-gradient(135deg, #050816 0%, #0c1024 50%, #160e29 100%)",
                  boxShadow: "0 0 35px rgba(56, 189, 248, 0.25)",
                }}
              >
                {/* Tech scanline background */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-15"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(56, 189, 248, 0.3) 2px, rgba(56, 189, 248, 0.3) 4px)",
                  }}
                />

                {/* Cyber Top Status Bar */}
                <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/30 pb-2 text-xs">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
                    <span>CYBER_ID // NETWORK_RANK_STATUS</span>
                  </div>
                  <div className="flex items-center gap-4 text-slate-400 text-[11px]">
                    <span className="text-fuchsia-400">NET_WORTH: {data.balance || "0 xu"}</span>
                    <span>SYS_ID: #4092-A</span>
                  </div>
                </div>

                {/* Main 3-Zone Body */}
                <div className="relative z-10 flex items-center gap-6 py-2">
                  {/* Left: Square Tech Avatar */}
                  <div className="relative shrink-0">
                    <div className="h-[128px] w-[128px] rounded-xl border-2 border-cyan-400 p-1 bg-black/60 shadow-lg shadow-cyan-500/30">
                      <img
                        src={data.avatar}
                        alt={data.username}
                        className="h-full w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="absolute -bottom-2 inset-x-2 text-center rounded bg-cyan-500/90 py-0.5 text-[9px] font-bold text-black tracking-wider">
                      SYNCED // LVL {data.level ?? 1}
                    </div>
                  </div>

                  {/* Center: Info & Segmented XP Bar */}
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-3">
                      <h2
                        className="text-[32px] font-bold tracking-tight text-cyan-300"
                        style={{ textShadow: "0 0 12px rgba(56, 189, 248, 0.5)" }}
                      >
                        {data.username || "Neon_Kenshi"}
                      </h2>
                      {data.badge && (
                        <span className="rounded bg-cyan-500/20 border border-cyan-400/50 px-2 py-0.5 text-[11px] text-cyan-300 font-bold">
                          {data.badge}
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-fuchsia-300">
                      {data.title ? `${data.title} // ` : ""}STATUS: COMBAT_ACTIVE
                    </div>

                    {/* Segmented Laser XP Bar */}
                    <div className="space-y-1 pt-1">
                      <div className="flex justify-between text-[11px] text-cyan-400/80">
                        <span>EXP_BUFFER: {data.currentXp ?? 0} / {data.requiredXp ?? 100}</span>
                        <span>{percent}% INTEGRITY</span>
                      </div>
                      <div className="h-5 w-full rounded bg-black/60 border border-cyan-500/40 p-0.5 flex gap-1">
                        {Array.from({ length: 20 }).map((_, idx) => {
                          const active = (idx + 1) * 5 <= percent;
                          return (
                            <div
                              key={idx}
                              className={`flex-1 h-full rounded-[2px] transition-all ${
                                active ? "bg-gradient-to-t from-cyan-400 to-fuchsia-400 shadow-sm" : "bg-white/5"
                              }`}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Right: Holographic Rank Box */}
                  <div className="flex flex-col items-center justify-center h-[128px] w-[130px] rounded-xl border border-fuchsia-500/40 bg-fuchsia-950/20 p-3 text-center shrink-0">
                    <span className="text-[10px] text-fuchsia-300">SERVER RANK</span>
                    <span
                      className="text-[32px] font-bold text-fuchsia-400 leading-none my-1"
                      style={{ textShadow: "0 0 15px rgba(232, 121, 249, 0.6)" }}
                    >
                      {data.rank ?? "#1"}
                    </span>
                    <span className="text-[10px] text-cyan-300 font-bold">TIER: ELITE_S</span>
                  </div>
                </div>

                {/* Bottom Telemetry Bar */}
                <div className="relative z-10 flex items-center justify-between border-t border-cyan-500/30 pt-2 text-[10px] text-cyan-400/70">
                  <span>SEC_LAYER: AES-256 · ENCRYPTED LINK</span>
                  <span>IMAGE_STUDIO // CYBERNETIC_RENDER_CORE</span>
                </div>
              </div>
            )}

            {/* 3. Glass Minimal (Clean Modern Frosted Studio Card) */}
            {theme === "glass-minimal" && (
              <div
                className="relative flex h-full w-full items-center p-8 overflow-hidden rounded-[24px] border border-emerald-400/30 font-sans"
                style={{
                  background:
                    "radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), linear-gradient(135deg, #021a14 0%, #06241c 50%, #0a1b24 100%)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.85), 0 0 30px rgba(16, 185, 129, 0.2)",
                }}
              >
                {/* Ambient glow circles */}
                <div className="pointer-events-none absolute -top-20 -left-20 h-64 w-64 rounded-full bg-emerald-500/20 blur-3xl" />
                <div className="pointer-events-none absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-teal-500/20 blur-3xl" />

                {/* Left Floating Avatar */}
                <div className="relative z-10 flex flex-col items-center shrink-0">
                  <div className="h-[135px] w-[135px] rounded-full p-1 bg-gradient-to-tr from-emerald-400 via-teal-300 to-white shadow-2xl shadow-emerald-500/30">
                    <img
                      src={data.avatar}
                      alt={data.username}
                      className="h-full w-full rounded-full object-cover bg-black"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="relative z-10 ml-8 flex flex-1 flex-col justify-between h-full py-1">
                  {/* Top: Title & Name */}
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="text-xs font-semibold tracking-wider text-emerald-400 uppercase">
                        {data.title || "Aura Champion · Verified Player"}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <h2 className="text-[34px] font-bold text-white tracking-tight">
                          {data.username || "AetherLord"}
                        </h2>
                        {data.badge && (
                          <span className="rounded-full bg-emerald-500/15 border border-emerald-400/30 px-3 py-0.5 text-xs font-medium text-emerald-300">
                            {data.badge}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-[11px] text-emerald-300/80 uppercase tracking-wider">Treasury Balance</div>
                      <div className="text-[20px] font-bold text-emerald-400 font-mono">{data.balance || "0 xu"}</div>
                    </div>
                  </div>

                  {/* Middle: Sleek Pill XP Track */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-slate-300">
                      <span>Experience Progression</span>
                      <span className="font-mono text-emerald-300 font-semibold">
                        {data.currentXp ?? 0} / {data.requiredXp ?? 100} XP ({percent}%)
                      </span>
                    </div>
                    <div className="h-2.5 w-full rounded-full bg-black/40 border border-emerald-500/20 p-0.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 via-teal-400 to-emerald-300 transition-all duration-300"
                        style={{ width: `${Math.max(2, percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom: 4 Minimalist Metric Columns */}
                  <div className="grid grid-cols-4 gap-4 border-t border-white/10 pt-3">
                    <div>
                      <div className="text-[11px] text-slate-400">Current Level</div>
                      <div className="text-[17px] font-bold text-white font-mono">Lv.{data.level ?? 1}</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Server Rank</div>
                      <div className="text-[17px] font-bold text-emerald-400 font-mono">{data.rank ?? "#1"} Elite</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Completion</div>
                      <div className="text-[17px] font-bold text-teal-300 font-mono">{percent}% XP</div>
                    </div>
                    <div>
                      <div className="text-[11px] text-slate-400">Prestige Status</div>
                      <div className="text-[17px] font-bold text-emerald-300 font-mono">Tier X Legend</div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Gold Legend (Imperial Sovereign Champion Emblem) */}
            {theme === "gold-legend" && (
              <div
                className="relative flex h-full w-full items-center p-8 overflow-hidden rounded-[20px] border-2 border-amber-400/60 font-serif"
                style={{
                  background:
                    "radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.3) 0%, transparent 60%), linear-gradient(135deg, #140d02 0%, #261a05 45%, #181003 100%)",
                  boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.9), 0 0 35px rgba(245, 158, 11, 0.35)",
                }}
              >
                {/* Regal Corner Filigree Accent */}
                <div className="pointer-events-none absolute top-2 left-2 text-amber-400 text-xs font-mono">❖</div>
                <div className="pointer-events-none absolute top-2 right-2 text-amber-400 text-xs font-mono">❖</div>
                <div className="pointer-events-none absolute bottom-2 left-2 text-amber-400 text-xs font-mono">❖</div>
                <div className="pointer-events-none absolute bottom-2 right-2 text-amber-400 text-xs font-mono">❖</div>

                {/* Left Crowned Avatar */}
                <div className="relative z-10 flex flex-col items-center shrink-0">
                  <div className="text-2xl mb-1 filter drop-shadow">👑</div>
                  <div className="h-[130px] w-[130px] rounded-full p-1 bg-gradient-to-tr from-amber-600 via-yellow-300 to-amber-500 shadow-2xl shadow-amber-500/40">
                    <img
                      src={data.avatar}
                      alt={data.username}
                      className="h-full w-full rounded-full object-cover bg-black"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                {/* Right Content Area */}
                <div className="relative z-10 ml-8 flex flex-1 flex-col justify-between h-full py-1">
                  {/* Top Laurel & Name */}
                  <div>
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-sans tracking-widest text-amber-300/90 uppercase font-semibold">
                        ✦ IMPERIAL SOVEREIGN OF THE REALM ✦
                      </div>
                      <div className="rounded-lg bg-amber-500/20 border border-amber-400/50 px-3 py-0.5 text-xs font-sans font-bold text-amber-200">
                        {data.rank ?? "#1"} SOVEREIGN
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mt-1.5">
                      <h2 className="text-[34px] font-bold text-yellow-300 tracking-wide">
                        {data.username || "Aurelius_Rex"}
                      </h2>
                      {data.badge && (
                        <span className="rounded-full bg-amber-500/20 border border-amber-400/50 px-3 py-0.5 text-xs font-sans font-bold text-amber-200">
                          {data.badge}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Middle Imperial Gold Progress Bar */}
                  <div className="space-y-1 font-sans">
                    <div className="flex justify-between text-xs text-amber-200">
                      <span>Imperial Ascendancy XP</span>
                      <span className="font-mono font-bold text-yellow-300">
                        {data.currentXp ?? 0} / {data.requiredXp ?? 100} XP ({percent}%)
                      </span>
                    </div>
                    <div className="h-4 w-full rounded-full bg-black/60 border border-amber-500/40 p-0.5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-amber-500 via-yellow-300 to-amber-400 shadow-md transition-all duration-300"
                        style={{ width: `${Math.max(2, percent)}%` }}
                      />
                    </div>
                  </div>

                  {/* Bottom Imperial Heraldic Badges */}
                  <div className="flex items-center justify-between border-t border-amber-500/25 pt-3 font-sans text-xs">
                    <div className="flex items-center gap-3">
                      <span className="rounded bg-amber-950/70 border border-amber-500/40 px-3 py-1 font-bold text-amber-300">
                        LEVEL: {data.level ?? 80}
                      </span>
                      <span className="text-amber-200/80">
                        TITLE: {data.title || "Imperial Vanguard"}
                      </span>
                    </div>

                    <div className="font-mono font-bold text-amber-300 text-sm">
                      TREASURY: {data.balance || "0 xu"}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="flex items-center justify-between border-t border-white/8 bg-black/30 px-5 py-2.5 text-xs text-slate-400">
        <span>XP Progress: <strong className="text-white font-mono">{percent}%</strong> ({data.currentXp}/{data.requiredXp})</span>
        {previewPngUrl && (
          <a
            href={previewPngUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-rose-400 hover:text-rose-300"
          >
            <span>Open exported image</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
