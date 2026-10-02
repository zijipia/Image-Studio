import React, { useRef, useState, useEffect } from "react";
import type { ProfileData } from "../lib/types";
import { PROFILE_WIDTH, PROFILE_HEIGHT } from "../lib/constants";
import { Download, Copy, Check, ExternalLink, User } from "lucide-react";

interface ProfilePreviewProps {
  data: ProfileData;
  onGenerate: () => void;
  isGenerating: boolean;
  lastGeneratedBlob?: Blob | null;
}

export function ProfilePreview({
  data,
  onGenerate,
  isGenerating,
  lastGeneratedBlob,
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
            {PROFILE_WIDTH} × {PROFILE_HEIGHT} px
          </span>
        </div>

        <div className="flex items-center gap-2">
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
          {/* Exact Profile Card DOM */}
          <div
            className="relative flex items-center select-none overflow-hidden rounded-[20px] shadow-2xl px-[35px]"
            style={{
              width: `${PROFILE_WIDTH}px`,
              height: `${PROFILE_HEIGHT}px`,
              background:
                "linear-gradient(135deg, #090210 0%, #1a031e 30%, #3d0728 65%, #630c33 100%)",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.8), 0 0 30px rgba(225, 29, 72, 0.25)",
            }}
          >
            <div
              className="absolute -top-[50px] -right-[50px] w-[450px] h-[450px] rounded-[40px] pointer-events-none"
              style={{
                transform: "rotate(45deg)",
                background: "linear-gradient(45deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.05))",
              }}
            />
            <div
              className="absolute -bottom-[80px] left-[250px] w-[350px] h-[350px] rounded-[30px] pointer-events-none"
              style={{
                transform: "rotate(25deg)",
                background: "linear-gradient(135deg, rgba(136, 19, 55, 0.3), transparent)",
              }}
            />

            {/* Avatar */}
            <div
              className="relative z-10 flex h-[150px] w-[150px] shrink-0 items-center justify-center rounded-full p-1"
              style={{
                background: "linear-gradient(135deg, rgba(244, 63, 94, 0.6), rgba(255, 255, 255, 0.2))",
                boxShadow: "0 10px 25px rgba(0, 0, 0, 0.6)",
              }}
            >
              {!imgError && data.avatar ? (
                <img
                  src={data.avatar}
                  alt={data.username}
                  onError={() => setImgError(true)}
                  className="h-[142px] w-[142px] rounded-full object-cover"
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                />
              ) : (
                <div className="flex h-[142px] w-[142px] items-center justify-center rounded-full bg-rose-950 text-rose-300">
                  <User className="h-16 w-16" />
                </div>
              )}
            </div>

            {/* Content Right */}
            <div className="relative z-10 ml-[35px] flex flex-1 flex-col justify-center">
              <div>
                <h2 className="text-[34px] font-semibold leading-[40px] text-[#f43f5e]">
                  {data.username || "__ziji"}
                </h2>
                <div className="text-[20px] leading-[26px] text-[#a1a1aa] mt-[2px]">
                  {data.balance || "0 xu"}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mt-[16px] h-[26px] w-[660px] overflow-hidden rounded-full bg-[#3e4147] shadow-inner flex">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.max(2, percent)}%`,
                    background: "linear-gradient(90deg, #f43f5e, #fb7185)",
                  }}
                />
              </div>

              {/* Stats Row */}
              <div className="mt-[18px] flex flex-row gap-[60px] text-[20px] font-semibold tracking-wider text-[#f43f5e]">
                <span>LEVEL: {data.level ?? 1}</span>
                <span>XP: {data.currentXp ?? 0}/{data.requiredXp ?? 100}</span>
                <span>RANK: {data.rank ?? "#1"}</span>
              </div>
            </div>
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
