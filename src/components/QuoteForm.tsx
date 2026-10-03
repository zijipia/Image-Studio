import React, { useState } from "react";
import type { QuoteData } from "../lib/types";
import { defaultQuoteData } from "../lib/sample-data";
import { QUOTE_WIDTH, QUOTE_HEIGHT } from "../lib/constants";
import { Download, Code2, Sliders, AlertCircle, FileCheck } from "lucide-react";

interface QuoteFormProps {
  data: QuoteData;
  onChange: (newData: QuoteData) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function QuoteForm({
  data,
  onChange,
  onGenerate,
  isGenerating,
}: QuoteFormProps) {
  const [tab, setTab] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState(() => JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const syncJson = (newData: QuoteData) => {
    setJsonText(JSON.stringify(newData, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      const parsed = JSON.parse(val);
      onChange(parsed);
      setJsonError(null);
    } catch (e: any) {
      setJsonError(e.message || "Invalid JSON");
    }
  };

  return (
    <div className="flex flex-col gap-5">
      {/* Header and Mode switch */}
      <div className="flex items-center justify-between border-b border-white/10 pb-2">
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setTab("visual")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "visual"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Visual Editor</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("json")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "json"
                ? "bg-indigo-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Code2 className="h-3.5 w-3.5" />
            <span>JSON Code</span>
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onChange(defaultQuoteData);
            syncJson(defaultQuoteData);
          }}
          className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
        >
          Reset Sample
        </button>
      </div>

      {tab === "visual" ? (
        <div className="space-y-3.5">
          {/* Layout Selector */}
          <div>
            <label className="text-xs font-semibold text-indigo-300">Bố Cục / Layout Trích Dẫn</label>
            <div className="mt-1.5 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[
                { id: "split-portrait", name: "Split Cinema", icon: "🎬", desc: "Tràn viền trái fade đen" },
                { id: "centered-minimal", name: "Centered Editorial", icon: "🖋️", desc: "Căn giữa trang trọng" },
                { id: "modern-card", name: "Modern Card", icon: "✨", desc: "Thẻ kính mờ nổi" },
                { id: "neon-cyber", name: "Neon Cyber", icon: "⚡", desc: "Terminal công nghệ HUD" },
              ].map((l) => {
                const isSelected = (data.layout || "split-portrait") === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    onClick={() => {
                      const next = { ...data, layout: l.id as any };
                      onChange(next);
                      syncJson(next);
                    }}
                    className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                      isSelected
                        ? "border-indigo-400 bg-indigo-950/70 shadow-md ring-2 ring-indigo-400/50"
                        : "border-white/10 bg-black/40 hover:border-white/20 hover:bg-white/5"
                    }`}
                  >
                    <span className="text-base">{l.icon}</span>
                    <span className="text-xs font-bold text-white mt-0.5">{l.name}</span>
                    <span className="text-[10px] text-slate-400 mt-0.5 leading-tight">{l.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-indigo-300">Quote Speech Text</label>
            <textarea
              value={data.quote}
              onChange={(e) => {
                const next = { ...data, quote: e.target.value };
                onChange(next);
                syncJson(next);
              }}
              rows={3}
              placeholder="text: Ziji Execute Ziji Execute"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-indigo-300">Author</label>
              <input
                type="text"
                value={data.author}
                onChange={(e) => {
                  const next = { ...data, author: e.target.value };
                  onChange(next);
                  syncJson(next);
                }}
                placeholder="Ziji"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-indigo-300">Handle / Tag</label>
              <input
                type="text"
                value={data.handle}
                onChange={(e) => {
                  const next = { ...data, handle: e.target.value };
                  onChange(next);
                  syncJson(next);
                }}
                placeholder="@__ziji"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-indigo-300">Watermark Tag (Bottom-Right)</label>
            <input
              type="text"
              value={data.tag}
              onChange={(e) => {
                const next = { ...data, tag: e.target.value };
                onChange(next);
                syncJson(next);
              }}
              placeholder="Ziji Execute#9575"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none font-mono"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-indigo-300">Left Character / Avatar URL</label>
            <input
              type="url"
              value={data.avatar}
              onChange={(e) => {
                const next = { ...data, avatar: e.target.value };
                onChange(next);
                syncJson(next);
              }}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
            />
            <p className="mt-1 text-[11px] text-slate-500">
              The left image smoothly transitions with a dark gradient scrim into pure obsidian black.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={10}
            className="w-full rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-xs text-indigo-200 focus:border-indigo-500 focus:outline-none"
          />
          {jsonError ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{jsonError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span>Valid Quote JSON</span>
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !!jsonError}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-purple-600 py-3.5 font-semibold text-white shadow-xl shadow-indigo-900/40 transition-all hover:from-indigo-500 hover:to-purple-500 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Rendering Quote PNG...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Generate & Download Quote Card ({QUOTE_WIDTH} × {QUOTE_HEIGHT}px)</span>
          </>
        )}
      </button>
    </div>
  );
}
