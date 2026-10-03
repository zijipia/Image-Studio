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
  const layout = data.layout || "podium";
  const height = calculateLeaderboardHeight(items.length, layout);

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
              background: "#18191c",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8)",
            }}
          >
            {/* 1. Server Header Banner */}
            <div className="mb-[16px] flex h-[76px] w-full items-center justify-between rounded-[14px] border border-white/8 bg-white/[0.04] px-4">
              <div className="flex items-center gap-3">
                <div className="flex h-[50px] w-[50px] items-center justify-center overflow-hidden rounded-[14px] border-2 border-amber-500/40 bg-[#0c0d12]">
                  <img
                    src={data.guildIcon}
                    alt="Guild"
                    className="h-[50px] w-[50px] rounded-[12px] object-cover"
                    crossOrigin="anonymous"
                    onError={(e) => {
                      (e.currentTarget as HTMLElement).style.display = "none";
                    }}
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-[17px] font-bold tracking-tight text-white">
                    {data.guildName || "Server Leaderboard"}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    Top {items.length} Members · XP Rankings
                  </span>
                </div>
              </div>

              <div className="rounded-full border border-amber-500/35 bg-amber-500/15 px-3 py-1 text-[11px] font-bold tracking-wider text-amber-300">
                {data.season || "SEASON 1"}
              </div>
            </div>

            {/* Layout Branching: compact-list, cyber-grid, or podium */}
            {layout === "compact-list" ? (
              <div className="flex w-full flex-col gap-2">
                {items.map((item) => {
                  const medal =
                    item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : null;
                  const rankColor =
                    item.rank === 1 ? "#f59e0b" : item.rank === 2 ? "#38bdf8" : item.rank === 3 ? "#f97316" : "#64748b";
                  return (
                    <div
                      key={item.rank}
                      className="flex h-[64px] w-full items-center rounded-[12px] border border-white/6 bg-white/[0.04] px-4 transition-all hover:bg-white/[0.07]"
                    >
                      <div className="mr-3 flex w-[32px] items-center justify-center font-bold text-[16px]">
                        {medal ? (
                          <span className="text-[20px]">{medal}</span>
                        ) : (
                          <span className="font-mono text-[14px] font-bold text-slate-400">
                            #{item.rank}
                          </span>
                        )}
                      </div>

                      <img
                        src={item.avatar}
                        alt={item.username}
                        className="mr-3.5 h-[44px] w-[44px] rounded-full border-2 object-cover bg-black/40"
                        style={{ borderColor: rankColor }}
                        crossOrigin="anonymous"
                      />

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] font-semibold text-white">
                          {item.username}
                        </div>
                        <div className="text-[12px] text-slate-400">{item.handle}</div>
                      </div>

                      <div className="flex flex-col items-end">
                        <div
                          className="rounded-full px-2.5 py-0.5 text-[11px] font-bold"
                          style={{
                            backgroundColor: `${rankColor}22`,
                            color: rankColor,
                            border: `1px solid ${rankColor}44`,
                          }}
                        >
                          Level {item.level}
                        </div>
                        <div className="mt-1 font-mono text-[12px] font-semibold text-slate-300">
                          {item.xp.toLocaleString()} XP
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : layout === "cyber-grid" ? (
              <div className="grid grid-cols-2 gap-2.5 w-full">
                {items.map((item) => {
                  const rankColor =
                    item.rank === 1 ? "#38bdf8" : item.rank === 2 ? "#c084fc" : item.rank === 3 ? "#f59e0b" : "#475569";
                  return (
                    <div
                      key={item.rank}
                      className="relative flex h-[82px] items-center rounded-[14px] border p-2.5 bg-black/50 transition-all overflow-hidden"
                      style={{
                        borderColor: `${rankColor}55`,
                        boxShadow: `0 0 15px ${rankColor}12`,
                      }}
                    >
                      <div className="relative mr-2.5 shrink-0">
                        <img
                          src={item.avatar}
                          alt={item.username}
                          className="h-[48px] w-[48px] rounded-xl object-cover border-2"
                          style={{ borderColor: rankColor }}
                          crossOrigin="anonymous"
                        />
                        <span
                          className="absolute -top-1.5 -left-1.5 flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold text-black shadow"
                          style={{ backgroundColor: rankColor }}
                        >
                          {item.rank}
                        </span>
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-bold text-white">
                          {item.username}
                        </div>
                        <div className="truncate text-[10px] text-slate-400">
                          {item.handle}
                        </div>
                        <div className="mt-1 flex items-center justify-between text-[11px]">
                          <span className="font-bold" style={{ color: rankColor }}>
                            Lv.{item.level}
                          </span>
                          <span className="font-mono text-slate-300 text-[10px]">
                            {item.xp} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <>
                {/* 2. Top 3 Podium */}
                <div className="mb-[16px] flex w-full items-end justify-center gap-2">
              {/* Rank 2 (Left) */}
              <div className="relative flex h-[232px] flex-1 flex-col items-center justify-end">
                {/* Pedestal Box */}
                <div className="flex h-[152px] w-full flex-col items-center rounded-t-[14px] border-l border-r border-t-[3px] border-[#38bdf8] border-l-sky-500/20 border-r-sky-500/20 bg-gradient-to-b from-[#242a38] to-[#171b26] pt-[34px]">
                  <div className="w-[135px] truncate text-center text-[15px] font-semibold text-white">
                    {top2?.username || "Player 2"}
                  </div>
                  <div className="mt-[2px] text-[11px] text-slate-400">{top2?.handle || "@player2"}</div>
                  <div className="mt-[10px] rounded-full bg-sky-500/15 px-2 py-0.5 text-[12px] font-semibold text-[#38bdf8]">
                    Level {top2?.level ?? 1}
                  </div>
                  <div className="mt-[4px] text-[12px] font-medium text-[#38bdf8]">{top2?.xp ?? 0} XP</div>
                </div>

                {/* Avatar & Rank Badge sitting on top */}
                <div className="absolute bottom-[124px] z-20 flex flex-col items-center">
                  <img
                    src={top2?.avatar}
                    alt={top2?.username}
                    className="h-[64px] w-[64px] rounded-full border-[3px] border-[#38bdf8] object-cover shadow-lg shadow-sky-500/20"
                    crossOrigin="anonymous"
                  />
                  <div className="relative -mt-[14px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#38bdf8] text-[12px] font-bold text-black shadow-md">
                    2
                  </div>
                </div>
              </div>

              {/* Rank 1 (Center) */}
              <div className="relative flex h-[265px] flex-[1.1] flex-col items-center justify-end">
                {/* Pedestal Box */}
                <div className="flex h-[178px] w-full flex-col items-center rounded-t-[14px] border-l border-r border-t-[3px] border-[#f59e0b] border-l-amber-500/25 border-r-amber-500/25 bg-gradient-to-b from-[#2d263b] to-[#1c1827] pt-[36px]">
                  <div className="w-[145px] truncate text-center text-[16px] font-bold text-white">
                    {top1?.username || "Winner"}
                  </div>
                  <div className="mt-[2px] text-[11px] text-slate-400">{top1?.handle || "@winner"}</div>
                  <div className="mt-[10px] rounded-full bg-amber-500/20 px-2.5 py-0.5 text-[12px] font-bold text-[#f59e0b]">
                    Level {top1?.level ?? 1}
                  </div>
                  <div className="mt-[4px] text-[12px] font-semibold text-[#f59e0b]">{top1?.xp ?? 0} XP</div>
                </div>

                {/* Crown, Avatar & Rank Badge sitting on top */}
                <div className="absolute bottom-[146px] z-20 flex flex-col items-center">
                  {/* Clean Vector SVG Crown */}
                  <svg
                    width="32"
                    height="22"
                    viewBox="0 0 34 24"
                    fill="none"
                    className="mb-1 drop-shadow-md"
                  >
                    <path
                      d="M3 20h28v2H3v-2zm1.5-14l6.5 6 6-10 6 10 6.5-6 2 12H2.5l2-12z"
                      fill="#f59e0b"
                    />
                    <path d="M17 2l-6 10 6-3 6 3-6-10z" fill="#fbbf24" />
                    <circle cx="4.5" cy="5.5" r="1.8" fill="#fef08a" />
                    <circle cx="17" cy="1.8" r="2.2" fill="#fef08a" />
                    <circle cx="29.5" cy="5.5" r="1.8" fill="#fef08a" />
                  </svg>

                  <img
                    src={top1?.avatar}
                    alt={top1?.username}
                    className="h-[72px] w-[72px] rounded-full border-[3px] border-[#f59e0b] object-cover shadow-xl shadow-amber-500/25"
                    crossOrigin="anonymous"
                  />
                  <div className="relative -mt-[14px] flex h-[26px] w-[26px] items-center justify-center rounded-full bg-[#f59e0b] text-[13px] font-bold text-black shadow-md">
                    1
                  </div>
                </div>
              </div>

              {/* Rank 3 (Right) */}
              <div className="relative flex h-[218px] flex-1 flex-col items-center justify-end">
                {/* Pedestal Box */}
                <div className="flex h-[138px] w-full flex-col items-center rounded-t-[14px] border-l border-r border-t-[3px] border-[#f97316] border-l-orange-500/20 border-r-orange-500/20 bg-gradient-to-b from-[#2b2323] to-[#1b1717] pt-[34px]">
                  <div className="w-[135px] truncate text-center text-[14px] font-semibold text-white">
                    {top3?.username || "Player 3"}
                  </div>
                  <div className="mt-[2px] text-[11px] text-slate-400">{top3?.handle || "@player3"}</div>
                  <div className="mt-[10px] rounded-full bg-orange-500/15 px-2 py-0.5 text-[12px] font-semibold text-[#f97316]">
                    Level {top3?.level ?? 1}
                  </div>
                  <div className="mt-[4px] text-[12px] font-medium text-[#f97316]">{top3?.xp ?? 0} XP</div>
                </div>

                {/* Avatar & Rank Badge sitting on top */}
                <div className="absolute bottom-[110px] z-20 flex flex-col items-center">
                  <img
                    src={top3?.avatar}
                    alt={top3?.username}
                    className="h-[64px] w-[64px] rounded-full border-[3px] border-[#f97316] object-cover shadow-lg shadow-orange-500/20"
                    crossOrigin="anonymous"
                  />
                  <div className="relative -mt-[14px] flex h-[24px] w-[24px] items-center justify-center rounded-full bg-[#f97316] text-[12px] font-bold text-black shadow-md">
                    3
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Ranks 4 to 10 Rows */}
            <div className="flex w-full flex-col gap-2">
              {rest.map((item) => (
                <div
                  key={item.rank}
                  className="flex h-[68px] w-full items-center rounded-[12px] border border-white/6 bg-white/[0.04] px-4 transition-all hover:bg-white/[0.07]"
                >
                  <div className="mr-2.5 flex w-[36px] flex-col items-center">
                    <span className="text-[18px] font-bold leading-5 text-white">{item.rank}</span>
                    <span className="text-[10px] leading-3 text-slate-400">Rank</span>
                  </div>

                  <img
                    src={item.avatar}
                    alt={item.username}
                    className="mr-3.5 h-[46px] w-[46px] rounded-full border-2 border-white/10 object-cover bg-black/40"
                    crossOrigin="anonymous"
                  />

                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-semibold text-white">{item.username}</div>
                    <div className="mt-[2px] text-[12px] text-slate-400">{item.handle}</div>
                  </div>

                  <div className="flex flex-col items-end">
                    <div className="text-[13px] font-semibold text-slate-200">Level {item.level}</div>
                    <div className="mt-[2px] text-[12px] text-slate-400">{item.xp} XP</div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
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
