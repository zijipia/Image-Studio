import React, { useRef, useState, useEffect } from "react";
import type { SongResult } from "../lib/types";
import { calculateHeight, CANVAS_WIDTH } from "../lib/constants";
import {
  Download,
  Copy,
  Check,
  Music,
  ExternalLink,
} from "lucide-react";

interface ImagePreviewProps {
  title: string;
  songs: SongResult[];
  layout?: "auto" | "list" | "grid" | "classic";
  onGenerate: () => void;
  isGenerating: boolean;
  lastGeneratedBlob?: Blob | null;
}

export function ImagePreview({
  title,
  songs,
  layout = "auto",
  onGenerate,
  isGenerating,
  lastGeneratedBlob,
}: ImagePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [zoomMode, setZoomMode] = useState<"fit" | "50" | "75" | "100">("fit");
  const [scale, setScale] = useState<number>(0.7);
  const [copied, setCopied] = useState<boolean>(false);
  const [previewPngUrl, setPreviewPngUrl] = useState<string | null>(null);

  const effectiveLayout: "list" | "grid" | "classic" =
    layout !== "auto"
      ? layout
      : songs.length <= 10
      ? "grid"
      : "list";

  const cols = songs.length <= 8 ? 4 : 5;
  const height = calculateHeight(songs.length, effectiveLayout);

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
      if (zoomMode === "100") {
        setScale(1);
      } else if (zoomMode === "75") {
        setScale(0.75);
      } else if (zoomMode === "50") {
        setScale(0.5);
      } else {
        const availableWidth = containerRef.current.clientWidth - 40;
        const newScale = Math.min(1, Math.max(0.35, availableWidth / CANVAS_WIDTH));
        setScale(newScale);
      }
    }

    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, [zoomMode, songs.length, effectiveLayout]);

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
      console.warn("Failed to copy image to clipboard:", err);
    }
  };

  // Group songs based on layout
  const half = Math.ceil(songs.length / 2);
  const leftCol = songs.slice(0, half);
  const rightCol = songs.slice(half);
  const dualColRows = Array.from({ length: half }, (_, i) => [leftCol[i] || null, rightCol[i] || null]);

  const gridGroups = Array.from({ length: Math.ceil(songs.length / cols) }, (_, rIdx) =>
    Array.from({ length: cols }, (__, cIdx) => songs[rIdx * cols + cIdx] || null)
  );

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e0a1e]/90 shadow-2xl backdrop-blur-xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-sm shadow-emerald-400/50" />
            <h3 className="text-sm font-semibold text-white">Live Canvas Preview</h3>
          </div>
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-purple-300">
            {CANVAS_WIDTH} × {height} px
          </span>
          <span className="hidden text-xs text-slate-400 sm:inline">
            ({songs.length} tracks · {effectiveLayout === "grid" ? "Large Cards (<=10)" : "Video List (>10)"})
          </span>
        </div>

        {/* Zoom & Action Controls */}
        <div className="flex items-center gap-2">
          {/* Zoom controls */}
          <div className="flex items-center rounded-lg border border-white/10 bg-black/40 p-0.5 text-xs text-slate-300">
            <button
              onClick={() => setZoomMode("fit")}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                zoomMode === "fit" ? "bg-purple-600 text-white" : "hover:text-white"
              }`}
              title="Fit to view"
            >
              Fit
            </button>
            <button
              onClick={() => setZoomMode("50")}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                zoomMode === "50" ? "bg-purple-600 text-white" : "hover:text-white"
              }`}
            >
              50%
            </button>
            <button
              onClick={() => setZoomMode("75")}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                zoomMode === "75" ? "bg-purple-600 text-white" : "hover:text-white"
              }`}
            >
              75%
            </button>
            <button
              onClick={() => setZoomMode("100")}
              className={`rounded px-2 py-1 font-medium transition-colors ${
                zoomMode === "100" ? "bg-purple-600 text-white" : "hover:text-white"
              }`}
              title="Original 1:1"
            >
              100%
            </button>
          </div>

          {/* Copy to clipboard */}
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

          {/* Generate PNG Action Button */}
          <button
            onClick={onGenerate}
            disabled={isGenerating || songs.length === 0}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-purple-600/30 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
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

      {/* Canvas Viewport Area */}
      <div
        ref={containerRef}
        className="relative flex min-h-[480px] flex-1 items-start justify-center overflow-auto p-6"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(91, 0, 184, 0.15) 0%, transparent 70%), #06040d",
        }}
      >
        {songs.length === 0 ? (
          <div className="my-auto flex flex-col items-center justify-center p-8 text-center text-slate-500">
            <Music className="mb-3 h-12 w-12 text-slate-600" />
            <p className="text-base font-medium text-slate-400">No tracks to preview</p>
            <p className="mt-1 text-xs">Click "Load Sample" or paste track items on the left</p>
          </div>
        ) : (
          <div
            className="transition-transform duration-150 ease-out origin-top"
            style={{
              transform: `scale(${scale})`,
              width: `${CANVAS_WIDTH}px`,
              height: `${height}px`,
              marginBottom: `${Math.max(20, (1 - scale) * height * -0.5)}px`,
            }}
          >
            <div
              className="relative select-none overflow-hidden rounded-[16px] shadow-2xl p-[14px]"
              style={{
                width: `${CANVAS_WIDTH}px`,
                height: `${height}px`,
                background:
                  "radial-gradient(circle at 90% 100%, #1e1b4b 0%, transparent 60%), linear-gradient(135deg, #070913 0%, #0d1224 50%, #0a0e1c 100%)",
                boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.8), 0 0 40px rgba(91, 0, 184, 0.2)",
              }}
            >
              {/* Header */}
              <div className="flex h-[65px] flex-col items-center justify-center pt-2">
                <h2
                  className="text-center font-normal tracking-wide text-white"
                  style={{
                    fontSize: "26px",
                    lineHeight: "32px",
                    fontFamily: "'Plus Jakarta Sans', Roboto, sans-serif",
                  }}
                >
                  {title || "Search Results"}
                </h2>
                <div className="mt-2 h-[2px] w-[60px] rounded-full bg-white/40" />
              </div>

              {/* Grid / List Content */}
              {effectiveLayout === "grid" ? (
                /* Large Card Grid layout (<= 10 tracks, Image 1 style) */
                <div className="mt-[12px] flex flex-col gap-[16px]">
                  {gridGroups.map((group, rIdx) => (
                    <div key={rIdx} className="flex flex-row gap-[16px]">
                      {group.map((item, cIdx) =>
                        item ? (
                          <GridCardItem key={item.index} song={item} cols={cols} />
                        ) : (
                          <div
                            key={cIdx}
                            className={cols === 5 ? "w-[206px] h-[245px]" : "w-[261px] h-[275px]"}
                          />
                        )
                      )}
                    </div>
                  ))}
                </div>
              ) : effectiveLayout === "list" ? (
                /* 2-column Video List layout (> 10 tracks, Image 2 style) */
                <div className="mt-[12px] flex flex-col gap-[8px]">
                  {dualColRows.map(([leftSong, rightSong], rowIdx) => (
                    <div key={rowIdx} className="flex flex-row gap-[14px]">
                      <div className="w-[543px]">
                        {leftSong ? <VideoListItem song={leftSong} /> : <div className="h-[76px]" />}
                      </div>
                      <div className="w-[543px]">
                        {rightSong ? <VideoListItem song={rightSong} /> : <div className="h-[76px]" />}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                /* Classic 2-column Pills layout */
                <div className="mt-[12px] flex flex-col gap-[8px]">
                  {dualColRows.map(([leftSong, rightSong], rowIdx) => (
                    <div key={rowIdx} className="flex flex-row gap-[14px]">
                      <div className="w-[543px]">
                        {leftSong ? <ClassicListItem song={leftSong} /> : <div className="h-[80px]" />}
                      </div>
                      <div className="w-[543px]">
                        {rightSong ? <ClassicListItem song={rightSong} /> : <div className="h-[80px]" />}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Info Bar */}
      <div className="flex flex-wrap items-center justify-between border-t border-white/8 bg-black/30 px-5 py-2.5 text-xs text-slate-400">
        <div className="flex items-center gap-3">
          <span>Render: <strong className="text-white font-mono">{CANVAS_WIDTH} × {height} px</strong></span>
          <span className="text-slate-600">·</span>
          <span>
            Mode:{" "}
            <strong className="text-purple-300">
              {songs.length <= 10 ? "Large Cards (<=10 tracks)" : "Video List (>10 tracks)"}
            </strong>
          </span>
          <span className="text-slate-600">·</span>
          <span>Tracks: <strong className="text-purple-300 font-mono">{songs.length} / 20</strong></span>
        </div>

        {previewPngUrl && (
          <a
            href={previewPngUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-purple-400 hover:text-purple-300"
          >
            <span>Open exported image</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}

/* Video List Component (matching Image 2) */
function VideoListItem({ song }: { song: SongResult }) {
  const [failed, setFailed] = useState(false);
  const subtitle = song.author
    ? `${song.author} · ${song.views || song.time}`
    : `${song.source} · ${song.views || song.time}`;

  return (
    <div className="flex h-[76px] w-[543px] items-center rounded-[12px] bg-[#121626]/75 px-[12px] transition-transform hover:brightness-110">
      <div className="mr-[8px] flex w-[24px] shrink-0 items-center justify-center text-[14px] font-semibold text-white/40">
        {song.index}
      </div>

      <div className="relative mr-[14px] h-[64px] w-[114px] shrink-0 overflow-hidden rounded-[8px] bg-black/50">
        {!failed && song.avatar ? (
          <img
            src={song.avatar}
            alt={song.displayName}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-purple-950/60 text-purple-300">
            <Music className="h-5 w-5" />
          </div>
        )}
        <div className="absolute bottom-[3px] right-[3px] rounded-[4px] bg-black/85 px-[5px] py-[1px] font-mono text-[11px] font-semibold text-white">
          {song.time || "03:00"}
        </div>
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="truncate text-[16px] font-medium leading-[22px] text-white">
          {song.displayName}
        </div>
        <div className="mt-[4px] truncate text-[13px] leading-[16px] text-[#818cf8]">
          {subtitle}
        </div>
      </div>
    </div>
  );
}

/* Grid Card Component (matching Image 1) */
function GridCardItem({ song, cols = 4 }: { song: SongResult; cols?: number }) {
  const [failed, setFailed] = useState(false);
  const subtitle = song.author
    ? `by ${song.author} · ${song.views || song.time}`
    : `by ${song.source} · ${song.views || song.time}`;

  const is5Cols = cols === 5;

  return (
    <div
      className={`flex flex-col rounded-[16px] bg-[#121626]/65 p-[6px] transition-transform hover:brightness-110 ${
        is5Cols ? "w-[206px] h-[245px]" : "w-[261px] h-[275px]"
      }`}
    >
      <div
        className={`relative w-full shrink-0 overflow-hidden rounded-[14px] bg-black/50 ${
          is5Cols ? "h-[175px]" : "h-[210px]"
        }`}
      >
        {!failed && song.avatar ? (
          <img
            src={song.avatar}
            alt={song.displayName}
            onError={() => setFailed(true)}
            className="h-full w-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-purple-950/60 text-purple-300">
            <Music className="h-8 w-8" />
          </div>
        )}
        {/* Track index badge in top-left corner */}
        <div
          className={`absolute top-[8px] left-[8px] flex items-center justify-center rounded-full bg-black/80 font-bold text-white shadow-md border border-white/30 font-mono ${
            is5Cols ? "h-[26px] w-[26px] text-[11px]" : "h-[30px] w-[30px] text-[13px]"
          }`}
        >
          {song.index}
        </div>
        {/* Play icon overlay */}
        <div
          className={`absolute bottom-[8px] right-[8px] flex items-center justify-center rounded-full bg-black/80 text-white shadow-md border border-white/30 ${
            is5Cols ? "h-[32px] w-[32px] text-[11px]" : "h-[38px] w-[38px] text-[13px]"
          }`}
        >
          ▶
        </div>
      </div>

      <div
        className={`mt-[10px] truncate font-semibold leading-[22px] text-white ${
          is5Cols ? "text-[14px]" : "text-[16px]"
        }`}
      >
        {song.displayName}
      </div>
      <div
        className={`mt-[3px] truncate leading-[16px] text-[#818cf8] ${
          is5Cols ? "text-[11px]" : "text-[13px]"
        }`}
      >
        {subtitle}
      </div>
    </div>
  );
}

/* Classic List Item Component */
function ClassicListItem({ song }: { song: SongResult }) {
  const [failed, setFailed] = useState(false);

  return (
    <div className="flex h-[80px] w-[543px] items-center rounded-[12px] bg-[#2d2c46]/80 px-[14px] transition-transform hover:brightness-105">
      <div className="mr-[14px] flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full bg-white/15 text-[18px] font-medium text-white">
        {song.index}
      </div>

      <div className="relative mr-[16px] h-[48px] w-[48px] shrink-0 overflow-hidden rounded-full bg-purple-950/70">
        {!failed && song.avatar ? (
          <img
            src={song.avatar}
            alt={song.displayName}
            onError={() => setFailed(true)}
            className="h-[48px] w-[48px] rounded-full object-cover"
            crossOrigin="anonymous"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-purple-300">
            <Music className="h-6 w-6" />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <div className="truncate text-[19px] font-normal leading-[24px] text-white">
          {song.displayName}
        </div>
        <div className="mt-[4px] text-[15px] leading-[18px] text-white/65">
          {song.time} - {song.source}
        </div>
      </div>
    </div>
  );
}
