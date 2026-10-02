import React, { useRef, useState, useEffect } from "react";
import type { LeaderboardData } from "../lib/types";
import { LEADERBOARD_WIDTH, calculateLeaderboardHeight } from "../lib/constants";
import { Download, Copy, Check, ExternalLink } from "lucide-react";

interface LeaderboardPreviewProps {
  data: LeaderboardData;
  onGenerate: () => void;
  isGenerating: boolean;
  lastGeneratedBlob?: Blob | null;
}

export function LeaderboardPreview({
  data,
  onGenerate,
  isGenerating,
  lastGeneratedBlob,
}: LeaderboardPreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState<number>(0.7);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewPngUrl, setPreviewPngUrl] = useState<string | null>(null);

  const items = data.items || [];
  const height = calculateLeaderboardHeight(items.length);

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
      const newScale = Math.min(1, Math.max(0.35, availableWidth / LEADERBOARD_WIDTH));
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

  const top1 = items.find((i) => i.rank === 1) || items[0];
  const top2 = items.find((i) => i.rank === 2) || items[1];
  const top3 = items.find((i) => i.rank === 3) || items[2];
  const rest = items.filter((i) => i.rank > 3);

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e0a1e]/90 shadow-2xl backdrop-blur-xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 shadow-sm shadow-amber-400/50" />
            <h3 className="text-sm font-semibold text-white">Leaderboard Preview</h3>
          </div>
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-amber-300">
            {LEADERBOARD_WIDTH} × {height} px
          </span>
          <span className="text-xs text-slate-400">({items.length} members)</span>
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
            disabled={isGenerating || items.length === 0}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-amber-500/30 transition-all hover:from-amber-400 hover:to-orange-500 disabled:opacity-50"
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

      {/* Viewport Canvas */}
      <div
        ref={containerRef}
        className="relative flex min-h-[500px] flex-1 items-start justify-center overflow-auto p-6"
        style={{
          background:
            "radial-gradient(ellipse at 50% 10%, rgba(245, 158, 11, 0.1) 0%, transparent 60%), #06040d",
        }}
      >
        <div
          className="transition-transform duration-150 ease-out origin-top"
          style={{
            transform: `scale(${scale})`,
            width: `${LEADERBOARD_WIDTH}px`,
            height: `${height}px`,
            marginBottom: `${Math.max(20, (1 - scale) * height * -0.3)}px`,
          }}
        >
          <div
            className="relative flex flex-col items-center select-none overflow-hidden rounded-[16px] shadow-2xl p-[18px]"
            style={{
              width: `${LEADERBOARD_WIDTH}px`,
              height: `${height}px`,
              background: "#1e1f23",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8)",
            }}
          >
            {/* Guild Avatar Top */}
            <div className="mb-[16px] flex h-[60px] w-[60px] items-center justify-center rounded-full p-[2px] bg-white/20">
              <img
                src={data.guildIcon}
                alt="Guild"
                className="h-[56px] w-[56px] rounded-full object-cover"
                crossOrigin="anonymous"
                onError={(e) => {
                  (e.currentTarget as HTMLElement).style.display = "none";
                }}
              />
            </div>

            {/* Top 3 Podium */}
            <div className="mb-[14px] flex w-full items-flex-end justify-center gap-[6px]">
              {/* Rank 2 (Left) */}
              <div className="flex flex-1 flex-col items-center">
                <div className="relative z-10 -mb-[15px] flex items-center justify-center">
                  <img
                    src={top2?.avatar}
                    alt={top2?.username}
                    className="h-[64px] w-[64px] rounded-full border-[3px] border-[#38bdf8] object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute -bottom-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#38bdf8] text-[12px] font-bold text-black">
                    2
                  </div>
                </div>
                <div className="flex h-[145px] w-full flex-col items-center rounded-t-[14px] bg-[#383d47] pt-[24px]">
                  <div className="w-[135px] truncate text-center text-[15px] font-medium text-white">
                    {top2?.username || "Player 2"}
                  </div>
                  <div className="text-[11px] text-[#9ca3af] mt-[2px]">{top2?.handle || "@handle"}</div>
                  <div className="mt-[12px] text-[13px] text-[#38bdf8]">Level {top2?.level ?? 1}</div>
                  <div className="mt-[2px] text-[12px] text-[#38bdf8]">{top2?.xp ?? 0} XP</div>
                </div>
              </div>

              {/* Rank 1 (Center) */}
              <div className="flex flex-[1.1] flex-col items-center">
                <div className="relative z-20 -mb-[18px] flex flex-col items-center">
                  <span className="text-[20px] text-[#f59e0b] mb-[2px]">👑</span>
                  <div className="relative flex items-center justify-center">
                    <img
                      src={top1?.avatar}
                      alt={top1?.username}
                      className="h-[72px] w-[72px] rounded-full border-[3px] border-[#f59e0b] object-cover"
                      crossOrigin="anonymous"
                    />
                    <div className="absolute -bottom-[4px] flex h-[22px] w-[22px] items-center justify-center rounded-full bg-[#f59e0b] text-[13px] font-bold text-black">
                      1
                    </div>
                  </div>
                </div>
                <div className="flex h-[170px] w-full flex-col items-center rounded-t-[14px] bg-[#424854] pt-[26px]">
                  <div className="w-[145px] truncate text-center text-[16px] font-medium text-white">
                    {top1?.username || "Player 1"}
                  </div>
                  <div className="text-[11px] text-[#9ca3af] mt-[2px]">{top1?.handle || "@handle"}</div>
                  <div className="mt-[14px] text-[14px] text-[#f59e0b]">Level {top1?.level ?? 1}</div>
                  <div className="mt-[2px] text-[12px] text-[#f59e0b]">{top1?.xp ?? 0} XP</div>
                </div>
              </div>

              {/* Rank 3 (Right) */}
              <div className="flex flex-1 flex-col items-center">
                <div className="relative z-10 -mb-[15px] flex items-center justify-center">
                  <img
                    src={top3?.avatar}
                    alt={top3?.username}
                    className="h-[64px] w-[64px] rounded-full border-[3px] border-[#22c55e] object-cover"
                    crossOrigin="anonymous"
                  />
                  <div className="absolute -bottom-[4px] flex h-[20px] w-[20px] items-center justify-center rounded-full bg-[#22c55e] text-[12px] font-bold text-black">
                    3
                  </div>
                </div>
                <div className="flex h-[135px] w-full flex-col items-center rounded-t-[14px] bg-[#383d47] pt-[24px]">
                  <div className="w-[135px] truncate text-center text-[14px] font-medium text-white">
                    {top3?.username || "Player 3"}
                  </div>
                  <div className="text-[11px] text-[#9ca3af] mt-[2px]">{top3?.handle || "@handle"}</div>
                  <div className="mt-[12px] text-[13px] text-[#22c55e]">Level {top3?.level ?? 1}</div>
                  <div className="mt-[2px] text-[12px] text-[#22c55e]">{top3?.xp ?? 0} XP</div>
                </div>
              </div>
            </div>

            {/* Ranks 4 to 10 Rows */}
            <div className="flex w-full flex-col gap-[8px]">
              {rest.map((item) => (
                <div
                  key={item.rank}
                  className="flex h-[68px] w-full items-center rounded-[12px] bg-[#4f5563] px-[16px] transition-transform hover:brightness-105"
                >
                  <div className="mr-[10px] flex w-[36px] flex-col items-center">
                    <span className="text-[18px] font-bold leading-[20px] text-white">{item.rank}</span>
                    <span className="text-[10px] leading-[12px] text-[#cbd5e1]">Rank</span>
                  </div>

                  <img
                    src={item.avatar}
                    alt={item.username}
                    className="mr-[14px] h-[46px] w-[46px] rounded-full object-cover bg-black/30"
                    crossOrigin="anonymous"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[16px] font-medium text-white">{item.username}</div>
                    <div className="text-[12px] text-[#cbd5e1] mt-[2px]">{item.handle}</div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="text-[13px] text-[#f1f5f9]">Level {item.level}</div>
                    <div className="text-[12px] text-[#cbd5e1] mt-[2px]">{item.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="flex items-center justify-between border-t border-white/8 bg-black/30 px-5 py-2.5 text-xs text-slate-400">
        <span>Gaming & Discord Bot Leaderboard Card</span>
        {previewPngUrl && (
          <a
            href={previewPngUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-amber-400 hover:text-amber-300"
          >
            <span>Open exported image</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
