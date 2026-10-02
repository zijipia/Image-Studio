import React, { useEffect, useMemo, useState } from "react";
import type { CustomCanvasData, CustomElement } from "../lib/types";
import { Code2, Copy, Download, Film, KeyRound, Pause, Play, Plus, RotateCcw, Sparkles, Trash2 } from "lucide-react";

type KeyframeProperty = "x" | "y" | "width" | "height" | "opacity";
type Keyframe = { id: string; time: number } & Partial<Record<KeyframeProperty, number>>;
type Track = { elementId: string; keyframes: Keyframe[] };

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const ease = (t: number) => t * t * (3 - 2 * t);

const defaultCanvas: CustomCanvasData = {
  title: "Welcome Card Animation",
  width: 930,
  height: 280,
  background: "linear-gradient(120deg, #090614, #2a1748 55%, #ff9f75)",
  elements: [
    { id: "title", type: "text", x: 210, y: 72, width: 650, height: 58, content: "Welcome, zijistudio!", color: "#fff", fontSize: 46, fontWeight: 500 },
    { id: "subtitle", type: "text", x: 212, y: 136, width: 600, height: 40, content: "to Hệ Võ Danh 2.", color: "#ddd6fe", fontSize: 28, fontWeight: 400 },
    { id: "avatar", type: "avatar", x: 34, y: 38, width: 148, height: 148, imageUrl: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg", borderRadius: 999, border: "3px solid rgba(255,255,255,.35)" },
  ],
};

const defaultTracks: Track[] = [
  { elementId: "title", keyframes: [{ id: "title-0", time: 0, x: 175, y: 72, opacity: 0 }, { id: "title-1", time: 360, x: 210, y: 72, opacity: 1 }] },
  { elementId: "subtitle", keyframes: [{ id: "subtitle-0", time: 240, x: 180, y: 136, opacity: 0 }, { id: "subtitle-1", time: 600, x: 212, y: 136, opacity: 1 }] },
  { elementId: "avatar", keyframes: [{ id: "avatar-0", time: 0, x: 18, y: 38, width: 118, height: 118, opacity: 0.4 }, { id: "avatar-1", time: 420, x: 34, y: 38, width: 148, height: 148, opacity: 1 }] },
];

function propertyValue(track: Track | undefined, time: number, property: KeyframeProperty, fallback: number) {
  if (!track?.keyframes.length) return fallback;
  const frames = [...track.keyframes].sort((a, b) => a.time - b.time);
  if (time <= frames[0].time) return frames[0][property] ?? fallback;
  if (time >= frames[frames.length - 1].time) return frames[frames.length - 1][property] ?? fallback;
  const rightIndex = frames.findIndex((frame) => frame.time >= time);
  const right = frames[rightIndex];
  const left = frames[rightIndex - 1];
  const t = ease((time - left.time) / Math.max(1, right.time - left.time));
  return lerp(left[property] ?? fallback, right[property] ?? fallback, t);
}

function buildFrame(canvas: CustomCanvasData, tracks: Track[], time: number): CustomCanvasData {
  return {
    ...canvas,
    elements: canvas.elements.map((element) => {
      const track = tracks.find((item) => item.elementId === element.id);
      return {
        ...element,
        x: Math.round(propertyValue(track, time, "x", element.x)),
        y: Math.round(propertyValue(track, time, "y", element.y)),
        width: Math.round(propertyValue(track, time, "width", element.width)),
        height: Math.round(propertyValue(track, time, "height", element.height)),
        opacity: propertyValue(track, time, "opacity", element.opacity ?? 1),
      };
    }),
  };
}

function snapshotElement(element: CustomElement, track: Track, time: number): Keyframe {
  return {
    id: `${element.id}-${Math.round(time)}-${Date.now()}`,
    time: Math.round(time),
    x: propertyValue(track, time, "x", element.x),
    y: propertyValue(track, time, "y", element.y),
    width: propertyValue(track, time, "width", element.width),
    height: propertyValue(track, time, "height", element.height),
    opacity: propertyValue(track, time, "opacity", element.opacity ?? 1),
  };
}

function labelFor(element: CustomElement) {
  return element.content || element.id;
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
  const [selectedKeyframeId, setSelectedKeyframeId] = useState<string | null>("title-1");
  const [exporting, setExporting] = useState(false);
  const [lastExport, setLastExport] = useState<Blob | null>(null);

  useEffect(() => {
    if (!playing) return;
    const interval = window.setInterval(() => setTime((current) => (current + 1000 / fps) % duration), 1000 / fps);
    return () => window.clearInterval(interval);
  }, [playing, fps, duration]);

  const frame = useMemo(() => buildFrame(canvas, tracks, time), [canvas, tracks, time]);
  const frameCount = Math.ceil(duration / (1000 / fps));
  const delays = useMemo(() => Array.from({ length: frameCount }, () => Math.round(1000 / fps)), [frameCount, fps]);
  const selectedElement = canvas.elements.find((element) => element.id === selectedId) ?? canvas.elements[0];
  const selectedTrack = tracks.find((track) => track.elementId === selectedId);
  const selectedKeyframe = selectedTrack?.keyframes.find((keyframe) => keyframe.id === selectedKeyframeId) ?? null;

  const updateTrack = (elementId: string, updater: (track: Track) => Track) => setTracks((current) => current.map((track) => track.elementId === elementId ? updater(track) : track));

  const addOrSelectKeyframe = (elementId: string, at = time) => {
    const element = canvas.elements.find((item) => item.id === elementId);
    const track = tracks.find((item) => item.elementId === elementId);
    if (!element || !track) return;
    const existing = track.keyframes.find((keyframe) => Math.abs(keyframe.time - at) < 1);
    if (existing) {
      setSelectedId(elementId); setSelectedKeyframeId(existing.id); setTime(existing.time); return;
    }
    const keyframe = snapshotElement(element, track, at);
    updateTrack(elementId, (current) => ({ ...current, keyframes: [...current.keyframes, keyframe].sort((a, b) => a.time - b.time) }));
    setSelectedId(elementId); setSelectedKeyframeId(keyframe.id); setTime(keyframe.time);
  };

  const updateKeyframe = (property: KeyframeProperty, value: number) => {
    if (!selectedKeyframeId) return;
    updateTrack(selectedId, (track) => ({ ...track, keyframes: track.keyframes.map((keyframe) => keyframe.id === selectedKeyframeId ? { ...keyframe, [property]: value } : keyframe) }));
  };

  const moveKeyframe = (newTime: number) => {
    if (!selectedKeyframeId) return;
    const nextTime = Math.round(clamp(newTime, 0, duration));
    updateTrack(selectedId, (track) => ({ ...track, keyframes: track.keyframes.map((keyframe) => keyframe.id === selectedKeyframeId ? { ...keyframe, time: nextTime } : keyframe).sort((a, b) => a.time - b.time) }));
    setTime(nextTime);
  };

  const deleteKeyframe = () => {
    if (!selectedKeyframeId || !selectedTrack || selectedTrack.keyframes.length <= 1) return;
    updateTrack(selectedId, (track) => ({ ...track, keyframes: track.keyframes.filter((keyframe) => keyframe.id !== selectedKeyframeId) }));
    setSelectedKeyframeId(null);
  };

  const resetKeyframeToCurrent = () => {
    if (!selectedKeyframeId || !selectedElement || !selectedTrack) return;
    const replacement = snapshotElement(selectedElement, selectedTrack, time);
    replacement.id = selectedKeyframeId;
    updateTrack(selectedId, (track) => ({ ...track, keyframes: track.keyframes.map((keyframe) => keyframe.id === selectedKeyframeId ? replacement : keyframe) }));
  };

  const exportAnimation = async () => {
    setExporting(true);
    try {
      const frames = Array.from({ length: frameCount }, (_, index) => buildFrame(canvas, tracks, Math.min(duration - 1, Math.round(index * 1000 / fps))));
      const response = await fetch("/api/generate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ type: "animated", data: { title: canvas.title, format, frames, delay: delays, loop: 0 } }) });
      if (!response.ok) throw new Error(await response.text() || "Animation export failed");
      const blob = await response.blob(); setLastExport(blob);
      const url = URL.createObjectURL(blob); const anchor = document.createElement("a"); anchor.href = url; anchor.download = `${canvas.title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.${format}`; anchor.click();
      setTimeout(() => URL.revokeObjectURL(url), 2000);
    } finally { setExporting(false); }
  };

  const copyApi = async () => navigator.clipboard.writeText(JSON.stringify({ type: "animated", data: { title: canvas.title, format, delay: delays, loop: 0, frames: Array.from({ length: frameCount }, (_, index) => buildFrame(canvas, tracks, Math.min(duration - 1, Math.round(index * 1000 / fps)))) } }, null, 2));

  const propertyFields: Array<[KeyframeProperty, string, number, number, number]> = [
    ["x", "X", 0, canvas.width, 1], ["y", "Y", 0, canvas.height, 1], ["width", "Width", 1, canvas.width, 1], ["height", "Height", 1, canvas.height, 1], ["opacity", "Opacity", 0, 1, 0.01],
  ];

  return (
    <div className="min-h-screen bg-[#080612] text-slate-100">
      <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-white/10 bg-[#0c0918]/90 px-5 backdrop-blur-xl">
        <div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-fuchsia-500 to-indigo-500"><Film className="h-5 w-5" /></div><div><div className="font-semibold">Animation Studio</div><div className="text-[10px] uppercase tracking-[.2em] text-slate-500">SVG-first timeline</div></div></div>
        <div className="flex items-center gap-2"><select value={format} onChange={(event) => setFormat(event.target.value as "gif" | "webp")} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs outline-none"><option value="gif">GIF</option><option value="webp">Animated WebP</option></select><button onClick={exportAnimation} disabled={exporting} className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold disabled:opacity-50"><Download className="h-3.5 w-3.5" />{exporting ? "Rendering…" : `Export ${format.toUpperCase()}`}</button></div>
      </header>

      <main className="mx-auto max-w-[1600px] space-y-4 p-4 lg:p-6">
        <section className="grid gap-4 lg:grid-cols-[1fr_330px]">
          <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4 shadow-xl">
            <div className="mb-3 flex items-center justify-between text-xs text-slate-400"><span>Preview · {canvas.width} × {canvas.height}</span><span>{Math.round(time)}ms / {duration}ms</span></div>
            <div className="flex min-h-[360px] items-center justify-center overflow-auto rounded-xl border border-white/10 bg-black/30 p-5"><div className="relative overflow-hidden shadow-2xl" style={{ width: canvas.width * .72, height: canvas.height * .72, background: canvas.background }}>
              {[...frame.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map((element) => <div key={element.id} onClick={() => { setSelectedId(element.id); setSelectedKeyframeId(null); }} className={`absolute cursor-pointer ${selectedId === element.id ? "ring-1 ring-purple-400" : ""}`} style={{ left: element.x * .72, top: element.y * .72, width: element.width * .72, height: element.height * .72, opacity: element.opacity ?? 1 }}>
                {element.type === "text" || element.type === "badge" ? <div className="h-full w-full overflow-hidden" style={{ color: element.color, background: element.type === "badge" ? element.backgroundColor : undefined, borderRadius: element.borderRadius, fontSize: (element.fontSize ?? 24) * .72, fontWeight: element.fontWeight, display: "flex", alignItems: "center", justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start", whiteSpace: "nowrap" }}>{element.content}</div> : element.type === "image" || element.type === "avatar" ? <img src={element.imageUrl} className="h-full w-full object-cover" style={{ borderRadius: element.borderRadius, border: element.border }} /> : <div className="h-full w-full" style={{ background: element.backgroundColor, borderRadius: element.borderRadius, border: element.border }} />}
              </div>)}
            </div></div>
            <div className="mt-4 flex items-center gap-3 rounded-xl border border-white/10 bg-black/20 p-3"><button onClick={() => setPlaying((value) => !value)} className="rounded-lg bg-white/10 p-2">{playing ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}</button><input type="range" min="0" max={duration} value={time} onChange={(event) => setTime(Number(event.target.value))} className="w-full accent-purple-500" /><span className="w-16 text-right font-mono text-xs text-slate-400">{Math.round(time)}ms</span></div>
          </div>

          <aside className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-4">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold"><Sparkles className="h-4 w-4 text-purple-400" /> Element / Keyframe</div>
            <select value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setSelectedKeyframeId(null); }} className="mb-3 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs">{canvas.elements.map((element) => <option key={element.id} value={element.id}>{labelFor(element)} · {element.type}</option>)}</select>
            {selectedKeyframe ? <>
              <div className="mb-3 flex items-center justify-between rounded-xl border border-purple-500/20 bg-purple-500/5 p-3"><div><div className="text-[10px] uppercase tracking-wider text-purple-300">Selected keyframe</div><div className="font-mono text-sm">{selectedKeyframe.time} ms</div></div><KeyRound className="h-4 w-4 text-purple-400" /></div>
              <label className="mb-3 block text-xs text-slate-400">Time (ms)<input type="number" min="0" max={duration} value={selectedKeyframe.time} onChange={(event) => moveKeyframe(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs" /></label>
              <div className="grid grid-cols-2 gap-2">{propertyFields.map(([property, label, min, max, step]) => <label key={property} className="text-xs text-slate-400">{label}<input type="number" min={min} max={max} step={step} value={Number(selectedKeyframe[property] ?? 0)} onChange={(event) => updateKeyframe(property, clamp(Number(event.target.value), min, max))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs" /></label>)}</div>
              <div className="mt-3 grid grid-cols-2 gap-2"><button onClick={resetKeyframeToCurrent} className="flex items-center justify-center gap-1 rounded-lg border border-white/10 bg-white/5 px-2 py-2 text-[11px]"><RotateCcw className="h-3 w-3" /> Reset from current</button><button onClick={deleteKeyframe} disabled={!selectedTrack || selectedTrack.keyframes.length <= 1} className="flex items-center justify-center gap-1 rounded-lg border border-red-500/20 bg-red-500/5 px-2 py-2 text-[11px] text-red-300 disabled:opacity-30"><Trash2 className="h-3 w-3" /> Delete</button></div>
            </> : <div className="rounded-xl border border-dashed border-white/10 p-4 text-xs leading-5 text-slate-500">Select a keyframe in the timeline, or add one at the current playhead. Its X/Y/size/opacity can then be edited directly here.</div>}
            <div className="mt-4 grid grid-cols-2 gap-2"><label className="text-xs text-slate-400">Duration<input type="number" min="120" max="10000" step="60" value={duration} onChange={(event) => setDuration(clamp(Number(event.target.value), 120, 10000))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs" /></label><label className="text-xs text-slate-400">FPS<input type="number" min="2" max="30" value={fps} onChange={(event) => setFps(clamp(Number(event.target.value), 2, 30))} className="mt-1 w-full rounded-lg border border-white/10 bg-black/30 px-3 py-2 text-xs" /></label></div>
            <div className="mt-3 rounded-xl border border-purple-500/20 bg-purple-500/5 p-3 text-[11px] text-slate-400">Frames: <b className="text-slate-200">{frameCount}</b> · Delay: <b className="text-slate-200">{Math.round(1000 / fps)}ms</b> · Loop: <b className="text-slate-200">∞</b></div>
            <button onClick={copyApi} className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-xs"><Code2 className="h-3.5 w-3.5" /> Copy API JSON</button>
            {lastExport && <div className="mt-3 rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-2 text-[11px] text-emerald-300">Last export: {(lastExport.size / 1024).toFixed(1)} KB</div>}
          </aside>
        </section>

        <section className="overflow-hidden rounded-2xl border border-white/10 bg-[#0e0a1e]/80 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><div><div className="text-sm font-semibold">Timeline</div><div className="text-[10px] text-slate-500">Click a keyframe to edit it · add keyframes at the playhead</div></div><button onClick={() => addOrSelectKeyframe(selectedId)} className="flex items-center gap-1 rounded-lg bg-white/10 px-3 py-2 text-xs"><Plus className="h-3.5 w-3.5" /> Keyframe</button></div>
          <div className="overflow-x-auto"><div className="min-w-[850px]">
            <div className="grid grid-cols-[190px_1fr] border-b border-white/5 bg-black/20 text-[10px] text-slate-500"><div className="p-3">ELEMENT</div><div className="relative h-10">{Array.from({ length: 7 }, (_, index) => { const mark = Math.round((duration / 6) * index); return <span key={mark} className="absolute top-3 -translate-x-1/2 font-mono" style={{ left: `${(mark / duration) * 100}%` }}>{mark}ms</span>; })}</div></div>
            {canvas.elements.map((element) => { const track = tracks.find((item) => item.elementId === element.id); return <div key={element.id} className="grid grid-cols-[190px_1fr] border-b border-white/5"><button onClick={() => { setSelectedId(element.id); setSelectedKeyframeId(null); }} className={`p-3 text-left text-xs ${selectedId === element.id ? "bg-purple-500/10 text-purple-200" : "text-slate-300"}`}>{labelFor(element)}<span className="ml-2 text-[9px] uppercase text-slate-600">{element.type}</span></button><div className="relative h-14 bg-black/10">{track?.keyframes.map((keyframe) => <button key={keyframe.id} title={`${keyframe.time}ms`} onClick={() => { setSelectedId(element.id); setSelectedKeyframeId(keyframe.id); setTime(keyframe.time); }} className={`absolute top-4 h-6 w-6 -translate-x-1/2 rotate-45 rounded-[5px] border ${selectedKeyframeId === keyframe.id && selectedId === element.id ? "border-purple-200 bg-purple-500 shadow-lg shadow-purple-500/30" : "border-purple-500/60 bg-purple-500/30 hover:bg-purple-500/50"}`} style={{ left: `${(keyframe.time / duration) * 100}%` }} />)}<div className="pointer-events-none absolute inset-y-0 w-px bg-purple-400/30" style={{ left: `${(time / duration) * 100}%` }} /></div></div>; })}
            <div className="relative ml-[190px] h-8 border-t border-white/5"><div className="absolute inset-y-0 w-px bg-purple-400" style={{ left: `${(time / duration) * 100}%` }} /></div>
          </div></div>
        </section>
      </main>
    </div>
  );
}
