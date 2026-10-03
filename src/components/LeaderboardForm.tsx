import React, { useState } from "react";
import type { LeaderboardData, LeaderboardItem } from "../lib/types";
import { defaultLeaderboardData } from "../lib/sample-data";
import { LEADERBOARD_WIDTH, calculateLeaderboardHeight } from "../lib/constants";
import { Download, Code2, Sliders, AlertCircle, FileCheck, Plus, Trash2 } from "lucide-react";

interface LeaderboardFormProps {
  data: LeaderboardData;
  onChange: (newData: LeaderboardData) => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function LeaderboardForm({
  data,
  onChange,
  onGenerate,
  isGenerating,
}: LeaderboardFormProps) {
  const [tab, setTab] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState(() => JSON.stringify(data, null, 2));
  const [jsonError, setJsonError] = useState<string | null>(null);

  const syncJson = (newData: LeaderboardData) => {
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

  const handleAddItem = () => {
    const nextRank = data.items.length + 1;
    const newItem: LeaderboardItem = {
      rank: nextRank,
      username: `Player ${nextRank}`,
      handle: `@player${nextRank}`,
      avatar: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg",
      level: 1,
      xp: 0,
    };
    const next = { ...data, items: [...data.items, newItem] };
    onChange(next);
    syncJson(next);
  };

  const handleUpdateItem = (index: number, updated: LeaderboardItem) => {
    const nextItems = [...data.items];
    nextItems[index] = updated;
    const next = { ...data, items: nextItems };
    onChange(next);
    syncJson(next);
  };

  const handleDeleteItem = (index: number) => {
    const nextItems = data.items.filter((_, i) => i !== index).map((item, i) => ({ ...item, rank: i + 1 }));
    const next = { ...data, items: nextItems };
    onChange(next);
    syncJson(next);
  };

  const height = calculateLeaderboardHeight(data.items.length);

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
                ? "bg-amber-600 text-white shadow-sm"
                : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
            }`}
          >
            <Sliders className="h-3.5 w-3.5" />
            <span>Visual Editor ({data.items.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setTab("json")}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
              tab === "json"
                ? "bg-amber-600 text-white shadow-sm"
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
            onChange(defaultLeaderboardData);
            syncJson(defaultLeaderboardData);
          }}
          className="rounded px-2 py-1 text-xs text-slate-400 hover:bg-white/10 hover:text-white"
        >
          Reset Top 10
        </button>
      </div>

      {tab === "visual" ? (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-amber-300">Server / Guild Name</label>
              <input
                type="text"
                value={data.guildName || ""}
                onChange={(e) => {
                  const next = { ...data, guildName: e.target.value };
                  onChange(next);
                  syncJson(next);
                }}
                placeholder="e.g. Community Leaderboard"
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-amber-300">Guild / Server Icon URL</label>
              <input
                type="url"
                value={data.guildIcon}
                onChange={(e) => {
                  const next = { ...data, guildIcon: e.target.value };
                  onChange(next);
                  syncJson(next);
                }}
                placeholder="https://..."
                className="mt-1 w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs text-white focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">Guild Leaderboard Roster</span>
            <button
              type="button"
              onClick={handleAddItem}
              className="flex items-center gap-1 rounded-lg bg-amber-600/80 px-2.5 py-1 text-xs font-medium text-white hover:bg-amber-500"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Player</span>
            </button>
          </div>

          <div className="max-h-[380px] space-y-2 overflow-y-auto pr-1">
            {data.items.map((item, idx) => (
              <div
                key={`${item.rank}-${idx}`}
                className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/30 p-2.5"
              >
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-amber-300">
                  {item.rank}
                </span>

                <div className="grid flex-1 grid-cols-2 gap-2 text-xs">
                  <input
                    type="text"
                    value={item.username}
                    onChange={(e) => handleUpdateItem(idx, { ...item, username: e.target.value })}
                    placeholder="Username"
                    className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
                  />
                  <input
                    type="text"
                    value={item.handle}
                    onChange={(e) => handleUpdateItem(idx, { ...item, handle: e.target.value })}
                    placeholder="@handle"
                    className="rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-slate-300 focus:border-amber-500 focus:outline-none"
                  />
                  <div className="col-span-2 flex items-center gap-2">
                    <input
                      type="number"
                      value={item.level}
                      onChange={(e) => handleUpdateItem(idx, { ...item, level: parseInt(e.target.value) || 1 })}
                      placeholder="Level"
                      className="w-20 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="number"
                      value={item.xp}
                      onChange={(e) => handleUpdateItem(idx, { ...item, xp: parseInt(e.target.value) || 0 })}
                      placeholder="XP"
                      className="w-24 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-white focus:border-amber-500 focus:outline-none"
                    />
                    <input
                      type="url"
                      value={item.avatar}
                      onChange={(e) => handleUpdateItem(idx, { ...item, avatar: e.target.value })}
                      placeholder="Avatar URL"
                      className="flex-1 rounded-lg border border-white/10 bg-black/40 px-2 py-1 text-slate-300 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => handleDeleteItem(idx)}
                  className="rounded-md p-1.5 text-red-400 hover:bg-red-500/20"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          <textarea
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            rows={14}
            className="w-full rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-xs text-amber-200 focus:border-amber-500 focus:outline-none"
          />
          {jsonError ? (
            <div className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-2.5 text-xs text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 text-red-400" />
              <span>{jsonError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-1.5 text-xs text-emerald-300">
              <FileCheck className="h-4 w-4 text-emerald-400" />
              <span>Valid Leaderboard JSON ({data.items.length} members)</span>
            </div>
          )}
        </div>
      )}

      {/* Generate Button */}
      <button
        type="button"
        onClick={onGenerate}
        disabled={isGenerating || !!jsonError || data.items.length === 0}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 py-3.5 font-semibold text-white shadow-xl shadow-amber-900/40 transition-all hover:from-amber-400 hover:to-orange-500 disabled:opacity-50"
      >
        {isGenerating ? (
          <>
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
            <span>Rendering Leaderboard PNG...</span>
          </>
        ) : (
          <>
            <Download className="h-4 w-4" />
            <span>Generate & Download Leaderboard ({LEADERBOARD_WIDTH} × {height}px)</span>
          </>
        )}
      </button>
    </div>
  );
}
