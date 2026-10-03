import React, { useRef, useState, useEffect } from "react";
import type { QuoteData } from "../lib/types";
import { QUOTE_WIDTH, QUOTE_HEIGHT } from "../lib/constants";
import { Download, Copy, Check, ExternalLink, Quote as QuoteIcon } from "lucide-react";

interface QuotePreviewProps {
  data: QuoteData;
  onGenerate: () => void;
  isGenerating: boolean;
  lastGeneratedBlob?: Blob | null;
}

export function QuotePreview({
  data,
  onGenerate,
  isGenerating,
  lastGeneratedBlob,
}: QuotePreviewProps) {
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
      const newScale = Math.min(1, Math.max(0.35, availableWidth / QUOTE_WIDTH));
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

  return (
    <div className="flex flex-col rounded-2xl border border-white/10 bg-[#0e0a1e]/90 shadow-2xl backdrop-blur-xl">
      {/* Top Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-3.5">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-indigo-400 shadow-sm shadow-indigo-400/50" />
            <h3 className="text-sm font-semibold text-white">Quote Card Preview</h3>
          </div>
          <span className="rounded-md border border-white/10 bg-white/5 px-2.5 py-0.5 font-mono text-xs text-indigo-300">
            {QUOTE_WIDTH} × {QUOTE_HEIGHT} px
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
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 px-4 py-1.5 text-xs font-semibold text-white shadow-lg shadow-indigo-600/30 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
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
        className="relative flex min-h-[460px] flex-1 items-center justify-center overflow-auto p-6"
        style={{
          background:
            "radial-gradient(ellipse at 50% 50%, rgba(99, 102, 241, 0.1) 0%, transparent 70%), #06040d",
        }}
      >
        <div
          className="transition-transform duration-150 ease-out origin-center"
          style={{
            transform: `scale(${scale})`,
            width: `${QUOTE_WIDTH}px`,
            height: `${QUOTE_HEIGHT}px`,
          }}
        >
          <div
            className="relative select-none overflow-hidden rounded-[16px] shadow-2xl"
            style={{
              width: `${QUOTE_WIDTH}px`,
              height: `${QUOTE_HEIGHT}px`,
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9)",
            }}
          >
            {/* 1. Layout: Split Cinema (Original) */}
            {(!data.layout || data.layout === "split-portrait") && (
              <div className="relative h-full w-full bg-black overflow-hidden">
                {/* Left side character image with gradient fade */}
                <div className="absolute top-0 left-0 h-[500px] w-[480px] overflow-hidden">
                  {!imgError && data.avatar ? (
                    <img
                      src={data.avatar}
                      alt={data.author}
                      onError={() => setImgError(true)}
                      className="h-full w-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-zinc-950 text-indigo-400">
                      <QuoteIcon className="h-24 w-24 opacity-30" />
                    </div>
                  )}
                  <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background:
                        "linear-gradient(to right, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 80%, #000000 100%)",
                    }}
                  />
                </div>

                {/* Right side quote content */}
                <div className="relative z-10 ml-[450px] flex h-[500px] flex-col items-center justify-center px-[40px] text-center">
                  <h1 className="max-w-[460px] text-[36px] font-normal leading-[48px] text-white">
                    {data.quote || "Quote text"}
                  </h1>
                  <div className="mt-[24px] text-[24px] italic text-white">
                    - {data.author || "Author"}
                  </div>
                  <div className="mt-[6px] text-[17px] text-[#9ca3af]">
                    {data.handle || "@handle"}
                  </div>
                </div>

                {/* Watermark Tag Bottom Right */}
                <div className="absolute bottom-[16px] right-[24px] z-20 font-mono text-[14px] text-[#4b5563]">
                  {data.tag || "Ziji#9575"}
                </div>
              </div>
            )}

            {/* 2. Layout: Centered Editorial */}
            {data.layout === "centered-minimal" && (
              <div
                className="relative flex h-full w-full flex-col items-center justify-center px-16 py-12 text-center overflow-hidden border border-white/10"
                style={{
                  background:
                    "radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090a12 60%, #030408 100%)",
                }}
              >
                {/* Background ambient quotation mark */}
                <div
                  className="pointer-events-none absolute select-none font-serif text-[200px] font-bold text-indigo-500/10 leading-none"
                  style={{ top: "40px" }}
                >
                  “
                </div>

                {/* Top Avatar */}
                <div className="relative z-10 mb-5">
                  <div className="h-[96px] w-[96px] rounded-full p-[3px] bg-gradient-to-tr from-indigo-500 via-purple-400 to-pink-500 shadow-xl shadow-indigo-500/25">
                    <img
                      src={data.avatar}
                      alt={data.author}
                      className="h-full w-full rounded-full object-cover bg-black"
                      crossOrigin="anonymous"
                    />
                  </div>
                </div>

                {/* Quote Text */}
                <div className="relative z-10 max-w-[800px] text-[32px] font-normal leading-[44px] text-white tracking-wide">
                  "{data.quote || "Quote text"}"
                </div>

                {/* Elegant separator */}
                <div className="my-5 h-[2px] w-[90px] bg-gradient-to-r from-transparent via-indigo-400/60 to-transparent" />

                {/* Author Info */}
                <div className="relative z-10 flex flex-col items-center gap-1">
                  <div className="text-[22px] font-semibold text-indigo-200">
                    {data.author || "Author"}
                  </div>
                  <div className="flex items-center gap-2 text-[14px] text-slate-400">
                    <span>{data.handle || "@handle"}</span>
                    <span>·</span>
                    <span className="font-mono text-indigo-300/80">{data.tag || "Verified"}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 3. Layout: Modern Card */}
            {data.layout === "modern-card" && (
              <div
                className="relative flex h-full w-full items-center justify-center p-12 overflow-hidden"
                style={{
                  background:
                    "radial-gradient(ellipse at 80% 90%, rgba(99, 102, 241, 0.2) 0%, transparent 60%), linear-gradient(135deg, #070913 0%, #0d1224 50%, #0a0e1c 100%)",
                }}
              >
                {/* Ambient backdrop image blurred */}
                <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
                  <img
                    src={data.avatar}
                    alt=""
                    className="h-full w-full object-cover blur-3xl scale-125"
                    crossOrigin="anonymous"
                  />
                </div>

                {/* Floating Frosted Card */}
                <div className="relative z-10 flex h-[380px] w-[880px] flex-col justify-between rounded-[24px] border border-white/15 bg-white/[0.06] p-8 shadow-2xl backdrop-blur-2xl">
                  {/* Card Header: Author Profile */}
                  <div className="flex items-center justify-between border-b border-white/10 pb-5">
                    <div className="flex items-center gap-4">
                      <img
                        src={data.avatar}
                        alt={data.author}
                        className="h-[58px] w-[58px] rounded-2xl object-cover border border-white/20 shadow-md"
                        crossOrigin="anonymous"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[20px] font-bold text-white">{data.author}</span>
                          <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500 text-[11px] text-white">
                            ✓
                          </span>
                        </div>
                        <span className="text-[13px] text-indigo-300">{data.handle}</span>
                      </div>
                    </div>

                    <div className="rounded-full border border-indigo-400/30 bg-indigo-500/15 px-3.5 py-1 text-xs font-mono font-medium text-indigo-200">
                      {data.tag || "QUOTE"}
                    </div>
                  </div>

                  {/* Card Body: Quote */}
                  <div className="my-auto px-2">
                    <p className="text-[28px] font-medium leading-[42px] text-slate-100">
                      “{data.quote || "Quote text"}”
                    </p>
                  </div>

                  {/* Card Footer */}
                  <div className="flex items-center justify-between border-t border-white/10 pt-4 text-xs text-slate-400">
                    <span className="font-mono text-slate-500">Image Studio Quote · Authenticated</span>
                    <span className="font-mono text-indigo-400">{data.tag}</span>
                  </div>
                </div>
              </div>
            )}

            {/* 4. Layout: Neon Cyber */}
            {data.layout === "neon-cyber" && (
              <div
                className="relative flex h-full w-full flex-col justify-between p-10 overflow-hidden font-sans border-2 border-cyan-400/50"
                style={{
                  background:
                    "radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(192, 132, 252, 0.15) 0%, transparent 50%), #040711",
                  boxShadow: "inset 0 0 50px rgba(56, 189, 248, 0.15), 0 0 40px rgba(56, 189, 248, 0.25)",
                }}
              >
                {/* Tech scanlines effect */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-10"
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(56, 189, 248, 0.4) 2px, rgba(56, 189, 248, 0.4) 4px)",
                  }}
                />

                {/* Cyber HUD Corner Brackets */}
                <div className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2 border-cyan-400" />
                <div className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2 border-cyan-400" />
                <div className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2 border-cyan-400" />
                <div className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2 border-cyan-400" />

                {/* Top Status Header */}
                <div className="relative z-10 flex items-center justify-between border-b border-cyan-500/30 pb-3 font-mono text-xs">
                  <div className="flex items-center gap-2 text-cyan-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-cyan-400 animate-pulse shadow-sm shadow-cyan-400" />
                    <span>TERMINAL_SPEECH // STREAM_ACTIVE</span>
                  </div>
                  <span className="text-fuchsia-400 tracking-widest">{data.tag || "CYBER_ID"}</span>
                </div>

                {/* Main Middle Row */}
                <div className="relative z-10 flex items-center gap-8 py-4">
                  {/* Cyber Avatar Box */}
                  <div className="relative shrink-0">
                    <div className="h-[140px] w-[140px] rounded-xl border-2 border-cyan-400/80 p-1 shadow-lg shadow-cyan-500/30 bg-black/60">
                      <img
                        src={data.avatar}
                        alt={data.author}
                        className="h-full w-full rounded-lg object-cover"
                        crossOrigin="anonymous"
                      />
                    </div>
                    <div className="absolute -bottom-2 -right-2 rounded bg-cyan-500 px-1.5 py-0.5 font-mono text-[10px] font-bold text-black">
                      REC
                    </div>
                  </div>

                  {/* Speech Terminal Body */}
                  <div className="flex-1 space-y-3">
                    <div className="font-mono text-xs text-cyan-400/80 tracking-wide">
                      &gt; INPUT_LOG_PROMPT:
                    </div>
                    <p
                      className="text-[28px] font-semibold leading-[40px] text-white"
                      style={{ textShadow: "0 0 15px rgba(56, 189, 248, 0.4)" }}
                    >
                      "{data.quote || "Quote text"}"
                    </p>
                    <div className="flex items-center gap-3 pt-2">
                      <span className="font-mono text-[18px] font-bold text-cyan-300">
                        // {data.author}
                      </span>
                      <span className="font-mono text-xs text-fuchsia-400">
                        {data.handle}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Soundwave / Equalizer Telemetry */}
                <div className="relative z-10 flex items-center justify-between border-t border-cyan-500/30 pt-3 font-mono text-[11px] text-cyan-400/70">
                  <div className="flex items-center gap-1">
                    {[12, 18, 8, 22, 14, 26, 10, 16, 24, 12, 19, 9, 23, 15, 27].map((h, i) => (
                      <span
                        key={i}
                        className="w-1 bg-cyan-400 rounded-sm"
                        style={{ height: `${h}px` }}
                      />
                    ))}
                  </div>
                  <span>BUFFER: 100% OK · HIGH RESOLUTION</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Info Bar */}
      <div className="flex items-center justify-between border-t border-white/8 bg-black/30 px-5 py-2.5 text-xs text-slate-400">
        <span>Discord Bot Speech Quote Banner</span>
        {previewPngUrl && (
          <a
            href={previewPngUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1 text-indigo-400 hover:text-indigo-300"
          >
            <span>Open exported image</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </div>
    </div>
  );
}
