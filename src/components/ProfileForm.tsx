import React, { useState } from "react";
import type { ProfileData } from "../lib/types";
import { defaultProfileData } from "../lib/sample-data";
import { PROFILE_WIDTH, PROFILE_HEIGHT } from "../lib/constants";
import { Download, Code2, Sliders, AlertCircle, FileCheck } from "lucide-react";

interface ProfileFormProps {
  data: ProfileData;
  onChange: (newData: ProfileData) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function ProfileForm({
  data,
  onChange,
  onGenerate,
  isGenerating,
}: ProfileFormProps) {
  const [tab, setTab] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState(() => JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const syncJson = (newData: ProfileData) => {
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
                ? "bg-rose-600 text-white shadow-sm"
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
                ? "bg-rose-600 text-white shadow-sm"
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
            onChange(defaultProfileData);
            syncJson(defaultProfileData);
          }}
          className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
        >
          Reset Sample
        </button>
      </div>

      {tab === "visual" ? (
        <div className="space-y-3.5">
          <div>
            <label className="text-xs font-semibold text-rose-300">Username</label>
            <input
              type="text"
              value={data.username}
              onChange={(e) => {
                const next = { ...data, username: e.target.value };
                onChange(next);
                syncJson(next);
              }}
              placeholder="__ziji"
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-rose-300">Coins / Balance</label>
              <input
                type="text"
                value={data.balance}
                onChange={(e) => {
                  const next = { ...data, balance: e.target.value };
                  onChange(next);
                  syncJson(next);
                }}
                placeholder="13080 xu"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-rose-300">Rank Badge</label>
              <input
                type="text"
                value={data.rank}
                onChange={(e) => {
                  const next = { ...data, rank: e.target.value };
                  onChange(next);
                  syncJson(next);
                }}
                placeholder="#1"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-rose-300">Level</label>
              <input
                type="number"
                value={data.level}
                onChange={(e) => {
                  const next = { ...data, level: parseInt(e.target.value) || 1 };
                  onChange(next);
                  syncJson(next);
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-rose-300">Current XP</label>
              <input
                type="number"
                value={data.currentXp}
                onChange={(e) => {
                  const next = { ...data, currentXp: parseInt(e.target.value) || 0 };
                  onChange(next);
                  syncJson(next);
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-rose-300">Required XP</label>
              <input
                type="number"
                value={data.requiredXp}
                onChange={(e) => {
                  const next = { ...data, requiredXp: parseInt(e.target.value) || 1 };
                  onChange(next);
                  syncJson(next);
                }}
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-rose-300">Avatar Image URL</label>
            <input
              type="url"
              value={data.avatar}
              onChange={(e) => {
                const next = { ...data, avatar: e.target.value };
                onChange(next);
                syncJson(next);
              }}
              placeholder="https://..."
              className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs text-white focus:border-rose-500 focus:outline-none"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={12}
            className="w-full rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-xs text-rose-200 focus:border-rose-500 focus:outline-none"
          />
          {jsonError ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{jsonError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span>Valid Profile JSON</span>
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !!jsonError}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-rose-600 via-rose-700 to-pink-600 py-3.5 font-semibold text-white shadow-xl shadow-rose-900/40 transition-all hover:from-rose-500 hover:to-pink-500 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Rendering Profile PNG...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Generate & Download Profile Card ({PROFILE_WIDTH} × {PROFILE_HEIGHT}px)</span>
          </>
        )}
      </button>
    </div>
  );
}
