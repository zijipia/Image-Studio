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
              background: "#000000",
              boxShadow: "0 25px 60px -15px rgba(0, 0, 0, 0.9)",
            }}
          >
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
