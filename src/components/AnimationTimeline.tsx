import React, { useMemo, useState } from "react";
import type { CustomCanvasData, CustomElement } from "../lib/types";
import { Film, Play, Pause, Download, Plus, Trash2, Copy, Sparkles, Code2 } from "lucide-react";

type Keyframe = {
  id: string;
  time: number;
  x?: number;
  y?: number;
  opacity?: number;
  width?: number;
  height?: number;
};

type Track = {
  elementId: string;
  keyframes: Keyframe[];
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

const defaultCanvas: CustomCanvasData = {
  title: "Welcome Card Animation",
  width: 930,
  height: 280,
  background: "linear-gradient(120deg, #090614, #2a1748 55%, #ff9f75)",
  elements: [
    {
      id: "title",
      type: "text",
      x: 210,
      y: 72,
      width: 650,
      height: 58,
      content: "Welcome, zijistudio!",
      color: "#ffffff",
      fontSize: 46,
      fontWeight: 500,
    },
    {
      id: "subtitle",
      type: "text",
      x: 212,
      y: 136,
      width: 600,
      height: 40,
      content: "to Hệ Võ Danh 2.",
      color: "#ddd6fe",
      fontSize: 28,
      fontWeight: 400,
    },
    {
      id: "avatar",
      type: "avatar",
      x: 34,
      y: 38,
      width: 148,
      height: 148,
      imageUrl: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg",
      borderRadius: 999,
      border: "3px solid rgba(255,255,255,.35)",
    },
  ],
};

const defaultTracks: Track[] = [
  { elementId: "title", keyframes: [
    { id: "title-0", time: 0, x: 175, y: 72, opacity: 0 },
    { id: "title-1", time: 360, x: 210, y: 72, opacity: 1 },
  ] },
  { elementId: "subtitle", keyframes: [
    { id: "subtitle-0", time: 240, x: 180, y: 136, opacity: 0 },
    { id: "subtitle-1", time: 600, x: 212, y: 136, opacity: 1 },
  ] },
  { elementId: "avatar", keyframes: [
    { id: "avatar-0", time: 0, x: 18, y: 38, width: 118, height: 118, opacity: 0.4 },
    { id: "avatar-1", time: 420, x: 34, y: 38, width: 148, height: 148, opacity: 1 },
  ] },
];

function valueAt(track: Track | undefined, time: number, key: keyof Keyframe, fallback: number) {
  if (!track || track.keyframes.length === 0) return fallback;
  const frames = [...track.keyframes].sort((a, b) => a.time - b.time);
  const first = frames[0];
  const last = frames[frames.length - 1];
  if (time <= first.time) return first[key] ?? fallback;
  if (time >= last.time) return last[key] ?? fallback;
  const rightIndex = frames.findIndex((frame) => frame.time >= time);
  const right = frames[rightIndex];
  const left = frames[rightIndex - 1];
  const progress = ease((time - left.time) / Math.max(1, right.time - left.time));
  return lerp(left[key] ?? fallback, right[key] ?? fallback, progress);
}

function buildFrame(canvas: CustomCanvasData, tracks: Track[], time: number): CustomCanvasData {
  return {
    ...canvas,
    elements: canvas.elements.map((element) => {
      const track = tracks.find((item) => item.elementId === element.id);
      return {
        ...element,
        x: Math.round(valueAt(track, time, "x", element.x)),
        y: Math.round(valueAt(track, time, "y", element.y)),
        width: Math.round(valueAt(track, time, "width", element.width)),
        height: Math.round(valueAt(track, time, "height", element.height)),
        opacity: valueAt(track, time, "opacity", element.opacity ?? 1),
      };
    }),
  };
}

export function AnimationTimeline() {
  const [canvas, setCanvas] = useState(defaultCanvas);
  const [tracks, setTracks] = useState(defaultTracks);
  const [duration, setDuration] = useState(1200);
  const [fps, setFps] = useState(10);
  const [format, setFormat] = useState<"gif" | "webp">("gif");
  const [time, setTime] = useState(360);
  const [playing, setPlaying] = useState(false);
  const [selectedId, setSelectedId] = useState("title");
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<Blob | null>(null);

  React.useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => {
      setTime((current) => (current + 1000 / fps) % duration);
    }, 1000 / fps);
    return () => window.clearInterval(interval);
  }, [playing, fps, duration]);

  const frame = useMemo(() => buildFrame(canvas, tracks, time), [canvas, tracks, time]);
  const frameCount = Math.ceil(duration / (1000 / fps));
  const delays = useMemo(() => Array.from({ length: frameCount }, () => Math.round(1000 / fps)), [frameCount, fps]);

  const updateTrack = (elementId: string, updater: (track: Track) => Track) => {
    setTracks((current) => current.map((track) => track.elementId === elementId ? updater(track) : track));
  };

  const addKeyframe = (elementId: string) => {
    const element = canvas.elements.find((item) => item.id === elementId);
    if (!element) return;
    const id = `${elementId}-${Date.now()}`;
    updateTrack(elementId, (track) => ({
      ...track,
      keyframes: [...track.keyframes, {
        id,
        time: Math.round(time),
        x: element.x,
        y: element.y,
        width: element.width,
        height: element.height,
        opacity: element.opacity ?? 1,
      }].sort((a, b) => a.time - b.time),
    }));
  };

  const removeKeyframe = (elementId: string, keyframeId: string) => {
    updateTrack(elementId, (track) => ({ ...track, keyframes: track.keyframes.filter((frame) => frame.id !== keyframeId) }));
  };

  const exportAnimation = async () => {
    setExporting(true);
    try {
      const frames = Array.from({ length: frameCount }, (_, index) => {
        const frameTime = Math.min(duration - 1, Math.round(index * (1000 / fps)));
        return buildFrame(canvas, tracks, frameTime);
      });
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "animated",
          data: { title: canvas.title, format, frames, delay: delays, loop: 0 },
        }),
      });
      if (!response.ok) throw new Error(await response.text() || "Animation export failed");
      const blob = await response.blob();
      setLastExport(blob);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${canvas.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format}`;
      anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally {
      setExporting(false);
    }
  };

  const selectedTrack = tracks.find((track) => track.elementId === selectedId);

  return (
    <div className="min-h-screen bg-[#080612] text-slate-100">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#0c0918]/90 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500"><Film className="h-5 w-5" /></div>
          <div><div className="font-semibold">Animation Studio</div><div className="text-[10px] uppercase tracking-[.2em] text-slate-500">SVG-first timeline</div></div>
        </div>
        <div className="flex items-center gap-2">
          <select value={format} onChange={(e) => setFormat(e.target.value as "gif" | "webp")} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none">
            <option value="gif">GIF</option><option value="webp">Animated WebP</option>
          </select>
          <button onClick={exportAnimation} disabled={exporting} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold disabled:opacity-50">
            <Download className="h-3.5 w-3.5" /> {exporting ? "Rendering…" : `Export ${format.toUpperCase()}`}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
        <section className="grid gap-4 lg:grid-cols-[1fr_310px]">
          <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
              <span>Preview · {canvas.width} × {canvas.height}</span>
              <span>{Math.round(time)}ms / {duration}ms</span>
            </div>
            <div className="flex min-h-[360px] items-center justify-center overflow-auto rounded-xl border border-white/10 bg-black/30 p-5">
              <div className="relative overflow-hidden shadow-2xl" style={{ width: canvas.width * 0.72, height: canvas.height * 0.72, background: canvas.background }}>
                {frame.elements.sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map((element) => (
                  <div key={element.id} onClick={() => setSelectedId(element.id)} className={`absolute cursor-pointer ${selectedId === element.id ? "ring-1 ring-purple-400" : ""}`} style={{ left: `${element.x * .72}px`, top: `${element.y * .72}px`, width: `${element.width * .72}px`, height: `${element.height * .72}px`, opacity: element.opacity ?? 1 }}>
                    {element.type === "text" || element.type === "badge" ? <div className="h-full w-full overflow-hidden" style={{ color: element.color, background: element.type === "badge" ? element.backgroundColor : undefined, borderRadius: element.borderRadius, fontSize: `${(element.fontSize ?? 24) * .72}px`, fontWeight: element.fontWeight, display: "flex", alignItems: "center", justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start", whiteSpace: "nowrap" }}>{element.content}</div> : element.type === "image" || element.type === "avatar" ? <img src={element.imageUrl} className="h-full w-full object-cover" style={{ borderRadius: element.borderRadius, border: element.border }} /> : <div className="h-full w-full" style={{ background: element.backgroundColor, borderRadius: element.borderRadius, border: element.border }} />}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3">
              <button onClick={() => setPlaying((value) => !value)} className="rounded-lg bg-white/10 p-2 hover:bg-white/15">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button>
              <input type="range" min="0" max={duration} value={time} onChange={(e) => setTime(Number(e.target.value))} className="w-full accent-purple-500" />
              <span className="w-16 text-right font-mono text-xs text-slate-400">{Math.round(time)}ms</span>
            </div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-purple-400" /> Animation</div>
            <label className="mb-3 block text-xs text-slate-400">Title<input value={canvas.title} onChange={(e) => setCanvas((value) => ({ ...value, title: e.target.value }))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs outline-none" /></label>
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-slate-400">Duration<input type="number" min="120" max="10000" step="60" value={duration} onChange={(e) => setDuration(clamp(Number(e.target.value), 120, 10000))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs" /></label>
              <label className="text-xs text-slate-400">FPS<input type="number" min="2" max="30" value={fps} onChange={(e) => setFps(clamp(Number(e.target.value), 2, 30))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs" /></label>
            </div>
            <div className="mt-4 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-[11px] leading-5 text-slate-400">
              Frames: <b className="text-slate-200">{frameCount}</b> · Delay: <b className="text-slate-200">{Math.round(1000 / fps)}ms</b> · Loop: <b className="text-slate-200">∞</b>
            </div>
            <button onClick={() => navigator.clipboard.writeText(JSON.stringify({ type: "animated", data: { title: canvas.title, format, delay: delays, loop: 0, frames: Array.from({ length: frameCount }, (_, index) => buildFrame(canvas, tracks, Math.min(duration - 1, Math.round(index * 1000 / fps)))) } }, null, 2))} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"><Code2 className="h-3.5 w-3.5" /> Copy API JSON</button>
            {lastExport && <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-emerald-300">Last export: {(lastExport.size / 1024).toFixed(1)} KB</div>}
          </aside>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0a1e]/80 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <div><div className="text-sm font-semibold">Timeline</div><div className="text-[10px] text-slate-500">Click a track, then add keyframes at the playhead.</div></div>
            <div className="flex items-center gap-2 text-xs text-slate-500"><span>{frameCount} frames</span><span>·</span><span>{duration}ms</span></div>
          </div>
          <div className="min-w-[900px] p-4">
            <div className="grid grid-cols-[190px_1fr] gap-3 border-b border-white/5 pb-2 text-[10px] uppercase tracking-widest text-slate-600">
              <span>Track</span><div className="relative h-5">{Array.from({ length: 7 }, (_, index) => { const mark = Math.round((duration / 6) * index); return <button key={mark} onClick={() => setTime(mark)} className="absolute -translate-x-1/2" style={{ left: `${(mark / duration) * 100}%` }}>{mark}ms</button>; })}</div>
            </div>
            {tracks.map((track) => {
              const element = canvas.elements.find((item) => item.id === track.elementId);
              if (!element) return null;
              return <div key={track.elementId} className={`grid grid-cols-[190px_1fr] gap-3 border-b border-white/5 py-3 ${selectedId === track.elementId ? "bg-white/[.02]" : ""}`}>
                <button onClick={() => setSelectedId(track.elementId)} className="flex items-center justify-between rounded-lg px-2 text-left hover:bg-white/5"><span className="truncate text-xs text-slate-300">{element.content || element.type}</span><span className="text-[10px] text-slate-600">{track.keyframes.length} keys</span></button>
                <div className="relative h-8 rounded-lg bg-black/25">
                  <div className="absolute inset-y-0 w-px bg-purple-400/30" style={{ left: `${(time / duration) * 100}%` }} />
                  {track.keyframes.map((keyframe) => <button key={keyframe.id} title={`${keyframe.time}ms`} onDoubleClick={() => removeKeyframe(track.elementId, keyframe.id)} onClick={() => setTime(keyframe.time)} className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-sm border border-purple-200 bg-purple-500 shadow-lg shadow-purple-900/50" style={{ left: `${(keyframe.time / duration) * 100}%` }} />)}
                </div>
              </div>;
            })}
          </div>
          <div className="flex items-center justify-between border-t border-white/10 px-4 py-3">
            <div className="flex items-center gap-2 text-xs text-slate-400"><span className="rounded-md bg-white/5 px-2 py-1">Selected: {selectedId}</span>{selectedTrack && <span>{selectedTrack.keyframes.length} keyframes</span>}</div>
            <div className="flex gap-2">
              <button onClick={() => addKeyframe(selectedId)} className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-semibold hover:bg-purple-500"><Plus className="h-3.5 w-3.5" /> Add keyframe</button>
              <button onClick={() => updateTrack(selectedId, (track) => ({ ...track, keyframes: track.keyframes.filter((keyframe) => keyframe.time !== Math.round(time)) }))} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"><Trash2 className="h-3.5 w-3.5" /> Remove at playhead</button>
              <button onClick={() => navigator.clipboard.writeText(JSON.stringify(tracks, null, 2))} className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs text-slate-300 hover:bg-white/10"><Copy className="h-3.5 w-3.5" /> Copy timeline</button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
