import React, { useState, useMemo, useEffect } from "react";
import type { SongResult, PresetSample } from "../lib/types";
import { sampleSongs, presetSamples } from "../lib/sample-data";
import { calculateHeight } from "../lib/constants";
import { SongCard } from "./SongCard";
import {
  Code2,
  ListMusic,
  Plus,
  FileCheck,
  AlertCircle,
  Download,
  LayoutList,
  LayoutGrid,
  Radio,
} from "lucide-react";

interface GeneratorFormProps {
  title: string;
  songs: SongResult[];
  layout?: "auto" | "list" | "grid" | "classic";
  onTitleChange: (newTitle: string) => void;
  onSongsChange: (newSongs: SongResult[]) => void;
  onLayoutChange: (layout: "auto" | "list" | "grid" | "classic") => void;
  onGenerate: () => void;
  isGenerating: boolean;
}

export function GeneratorForm({
  title,
  songs,
  layout = "list",
  onTitleChange,
  onSongsChange,
  onLayoutChange,
  onGenerate,
  isGenerating,
}: GeneratorFormProps) {
  const [activeTab, setActiveTab] = useState<"visual" | "json">("visual");
  const [jsonText, setJsonText] = useState<string>(() =>
    JSON.stringify(songs.length > 0 ? songs : sampleSongs, null, 2)
  );
  const [jsonError, setJsonError] = useState<string | null>(null);

  const syncJsonFromSongs = (newSongs: SongResult[]) => {
    setJsonText(JSON.stringify(newSongs, null, 2));
    setJsonError(null);
  };

  const quickTitles = [
    "Lofi & Chill Beats",
    "Study & Focus Radio",
    "Late Night Vibes",
    "Top 20 Trending Search",
  ];

  const handleJsonChange = (val: string) => {
    setJsonText(val);
    try {
      if (!val.trim()) {
        setJsonError(null);
        onSongsChange([]);
        return;
      }
      const data = JSON.parse(val);
      if (!Array.isArray(data)) {
        setJsonError("JSON data must be an array []");
        return;
      }
      setJsonError(null);
      // Limit to max 20 tracks
      onSongsChange(data.slice(0, 20));
    } catch (err: any) {
      setJsonError(err.message || "Invalid JSON format.");
    }
  };

  const handleFormatJson = () => {
    try {
      const data = JSON.parse(jsonText);
      setJsonText(JSON.stringify(data, null, 2));
      setJsonError(null);
    } catch (err: any) {
      setJsonError("Cannot format: " + err.message);
    }
  };

  const handleMinifyJson = () => {
    try {
      const data = JSON.parse(jsonText);
      setJsonText(JSON.stringify(data));
      setJsonError(null);
    } catch (err: any) {
      setJsonError("Cannot minify: " + err.message);
    }
  };

  const handleLoadPreset = (preset: PresetSample) => {
    onTitleChange(preset.title);
    onSongsChange(preset.songs);
    syncJsonFromSongs(preset.songs);
  };

  const handleClear = () => {
    onSongsChange([]);
    setJsonText("[]");
    setJsonError(null);
  };

  const handleAddSong = () => {
    if (songs.length >= 20) {
      alert("Maximum 20 tracks reached.");
      return;
    }
    const nextIndex = songs.length + 1;
    const newSong: SongResult = {
      index: nextIndex,
      avatar: "https://i.ytimg.com/vi/jfKfPfyJRdk/hq720.jpg",
      displayName: `Lofi Track #${nextIndex} - Relaxing Melodies`,
      time: "03:45",
      source: "youtube",
      author: "Chillhop Music",
      views: "1.2M views",
    };
    const updated = [...songs, newSong];
    onSongsChange(updated);
    syncJsonFromSongs(updated);
  };

  const handleUpdateSong = (idx: number, updatedSong: SongResult) => {
    const next = [...songs];
    next[idx] = updatedSong;
    onSongsChange(next);
    syncJsonFromSongs(next);
  };

  const handleDeleteSong = (idx: number) => {
    const next = songs.filter((_, i) => i !== idx).map((s, i) => ({ ...s, index: i + 1 }));
    onSongsChange(next);
    syncJsonFromSongs(next);
  };

  const handleMoveSong = (from: number, to: number) => {
    if (to < 0 || to >= songs.length) return;
    const next = [...songs];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    const reindexed = next.map((s, i) => ({ ...s, index: i + 1 }));
    onSongsChange(reindexed);
    syncJsonFromSongs(reindexed);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        if (!jsonError && songs.length > 0) {
          onGenerate();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [jsonError, songs.length, onGenerate]);

  const estimatedHeight = calculateHeight(songs.length, layout);

  return (
    <div className="flex flex-col gap-5">
      {/* Title Field */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Card Title
          </label>
          <span className="text-[11px] text-slate-400">Header display</span>
        </div>
        <input
          type="text"
          value={title}
          onChange={(e) => onTitleChange(e.target.value)}
          placeholder="Enter title (e.g. Lofi & Chill Beats)"
          className="w-full rounded-xl border border-white/10 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 shadow-inner focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
        />

        {/* Quick title suggestions */}
        <div className="mt-2 flex flex-wrap gap-1.5">
          {quickTitles.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => onTitleChange(t)}
              className="rounded-md border border-white/8 bg-white/5 px-2 py-1 text-[11px] text-slate-300 hover:border-purple-500/40 hover:bg-purple-950/40 hover:text-white"
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Layout Style Selector */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Display Layout Style
          </span>
          <span className="text-[11px] text-purple-300">
            {layout === "auto"
              ? songs.length <= 10
                ? "Auto: Large Cards (<=10)"
                : "Auto: Video List (>10)"
              : `Forced: ${layout}`}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          <button
            type="button"
            onClick={() => onLayoutChange("auto")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
              layout === "auto"
                ? "border-purple-500 bg-purple-950/50 text-white shadow-md shadow-purple-900/30"
                : "border-white/10 bg-black/30 text-slate-300 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-bold text-amber-300">⚡ Auto</span>
            <span className="text-[10px] text-slate-400 mt-0.5">&le;10 Large, &gt;10 List</span>
          </button>

          <button
            type="button"
            onClick={() => onLayoutChange("grid")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
              layout === "grid"
                ? "border-purple-500 bg-purple-950/50 text-white shadow-md shadow-purple-900/30"
                : "border-white/10 bg-black/30 text-slate-300 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-semibold">Large Cards</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Play Button Overlay</span>
          </button>

          <button
            type="button"
            onClick={() => onLayoutChange("list")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
              layout === "list"
                ? "border-purple-500 bg-purple-950/50 text-white shadow-md shadow-purple-900/30"
                : "border-white/10 bg-black/30 text-slate-300 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-semibold">Video List</span>
            <span className="text-[10px] text-slate-400 mt-0.5">16:9 Thumbnail</span>
          </button>

          <button
            type="button"
            onClick={() => onLayoutChange("classic")}
            className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
              layout === "classic"
                ? "border-purple-500 bg-purple-950/50 text-white shadow-md shadow-purple-900/30"
                : "border-white/10 bg-black/30 text-slate-300 hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <span className="text-xs font-semibold">Classic Pills</span>
            <span className="text-[10px] text-slate-400 mt-0.5">Round Avatar</span>
          </button>
        </div>
      </div>

      {/* Preset Selector */}
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-purple-300">
            Presets (Up to 20 Tracks)
          </span>
          <span className="text-[11px] text-purple-300 font-mono">
            {songs.length}/20 tracks
          </span>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {presetSamples.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => handleLoadPreset(p)}
              className={`flex flex-col items-center justify-center rounded-xl border p-2 text-center transition-all ${
                songs.length === p.count && title === p.title
                  ? "border-purple-500 bg-purple-950/50 text-white shadow-md shadow-purple-900/30"
                  : "border-white/10 bg-black/30 text-slate-300 hover:border-white/20 hover:bg-white/5"
              }`}
            >
              <span className="text-xs font-semibold">{p.count} tracks</span>
              <span className="mt-0.5 font-mono text-[10px] text-purple-300">
                ~{calculateHeight(p.count, layout)}px
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Mode Switcher Tabs */}
      <div>
        <div className="flex items-center justify-between border-b border-white/10 pb-2">
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setActiveTab("visual")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "visual"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <ListMusic className="h-3.5 w-3.5" />
              <span>Visual Editor ({songs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("json")}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                activeTab === "json"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-slate-400 hover:bg-white/5 hover:text-slate-200"
              }`}
            >
              <Code2 className="h-3.5 w-3.5" />
              <span>JSON Code</span>
            </button>
          </div>

          {activeTab === "json" && (
            <div className="flex items-center gap-1 text-xs">
              <button
                type="button"
                onClick={handleFormatJson}
                className="rounded px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
                title="Format JSON"
              >
                Format
              </button>
              <button
                type="button"
                onClick={handleMinifyJson}
                className="rounded px-2 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
                title="Minify JSON"
              >
                Minify
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="rounded px-2 py-1 text-red-400 hover:bg-red-500/20"
                title="Clear all"
              >
                Clear
              </button>
            </div>
          )}

          {activeTab === "visual" && (
            <button
              type="button"
              disabled={songs.length >= 20}
              onClick={handleAddSong}
              className="flex items-center gap-1 rounded-lg bg-white/10 px-2.5 py-1 text-xs font-medium text-white hover:bg-white/20 disabled:opacity-40"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add Track ({songs.length}/20)</span>
            </button>
          )}
        </div>

        {/* Tab 1: JSON Editor */}
        {activeTab === "json" ? (
          <div className="mt-3 space-y-2">
            <textarea
              value={jsonText}
              onChange={(e) => handleJsonChange(e.target.value)}
              spellCheck={false}
              rows={16}
              placeholder="[ { index: 1, avatar: '...', displayName: '...', time: '3:00:00', author: 'Chillhop Music', views: '24M views' } ]"
              className="w-full resize-y rounded-xl border border-white/10 bg-black/60 p-3.5 font-mono text-xs leading-relaxed text-purple-200 shadow-inner focus:border-purple-500 focus:outline-none"
            />

            {jsonError ? (
              <div className="flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-950/40 p-3 text-xs text-red-300">
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-400" />
                <div className="min-w-0 flex-1">
                  <strong className="font-semibold">JSON Error: </strong>
                  <span>{jsonError}</span>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-950/30 px-3 py-2 text-xs text-emerald-300">
                <div className="flex items-center gap-1.5">
                  <FileCheck className="h-4 w-4 text-emerald-400" />
                  <span>Valid JSON: <strong>{songs.length} / 20 tracks</strong></span>
                </div>
                <span className="font-mono text-[11px] text-emerald-400/80">
                  Canvas Height: {estimatedHeight}px
                </span>
              </div>
            )}
          </div>
        ) : (
          /* Tab 2: Visual List Editor */
          <div className="mt-3 space-y-2.5">
            {songs.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 p-8 text-center text-slate-500">
                <ListMusic className="mb-2 h-8 w-8 text-slate-600" />
                <p className="text-sm">No songs in playlist</p>
                <button
                  type="button"
                  onClick={handleAddSong}
                  className="mt-3 flex items-center gap-1 rounded-lg bg-purple-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-purple-500"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add First Track
                </button>
              </div>
            ) : (
              <div className="max-h-[460px] space-y-2 overflow-y-auto pr-1">
                {songs.map((song, idx) => (
                  <SongCard
                    key={`${song.index}-${idx}`}
                    song={song}
                    isFirst={idx === 0}
                    isLast={idx === songs.length - 1}
                    onUpdate={(updated) => handleUpdateSong(idx, updated)}
                    onDelete={() => handleDeleteSong(idx)}
                    onMoveUp={() => handleMoveSong(idx, idx - 1)}
                    onMoveDown={() => handleMoveSong(idx, idx + 1)}
                  />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Primary Action Button */}
      <div className="space-y-2 pt-2">
        <button
          type="button"
          onClick={onGenerate}
          disabled={isGenerating || !!jsonError || songs.length === 0}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-purple-700 to-indigo-600 py-3.5 font-semibold text-white shadow-xl shadow-purple-900/40 transition-all hover:from-purple-500 hover:to-indigo-500 hover:shadow-purple-700/50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isGenerating ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Rendering Satori → Sharp → PNG...</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>Generate & Download PNG (1130 × {estimatedHeight}px)</span>
            </>
          )}
        </button>

        <p className="text-center text-[11px] text-slate-500">
          Shortcut: <kbd className="rounded border border-white/10 bg-white/5 px-1 py-0.5 text-purple-300">Ctrl + Enter</kbd> to quick export
        </p>
      </div>
    </div>
  );
}
