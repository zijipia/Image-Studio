import React, { useState, useCallback, useEffect } from "react";
import type {
  GeneratorType,
  SongResult,
  ProfileData,
  LeaderboardData,
  QuoteData,
  CustomCanvasData,
  AnyGenerateRequest,
} from "./lib/types";
import {
  sampleSongs,
  defaultProfileData,
  defaultLeaderboardData,
  defaultQuoteData,
} from "./lib/sample-data";
import { DEFAULT_CUSTOM_CANVAS } from "./lib/constants";
import { useStats, recordGeneratedImage } from "./lib/use-stats";
import { GeneratorForm } from "./components/GeneratorForm";
import { ImagePreview } from "./components/ImagePreview";
import { ProfileForm } from "./components/ProfileForm";
import { ProfilePreview } from "./components/ProfilePreview";
import { LeaderboardForm } from "./components/LeaderboardForm";
import { LeaderboardPreview } from "./components/LeaderboardPreview";
import { QuoteForm } from "./components/QuoteForm";
import { QuotePreview } from "./components/QuotePreview";
import { CustomBuilder } from "./components/CustomBuilder";
import { AnimationTimeline } from "./components/AnimationTimeline";
import {
  Music,
  User,
  Trophy,
  Quote,
  Sparkles,
  Check,
  AlertCircle,
  X,
  HelpCircle,
  Code2,
  Zap,
  Palette,
  Film,
} from "lucide-react";

export function getModeFromPath(pathname: string, search = ""): GeneratorType {
  const clean = pathname.toLowerCase().replace(/\/+$/, "") || "/";
  if (clean === "/animation" || clean === "/animated" || clean === "/timeline") return "animated";
  if (clean === "/profile" || clean === "/rank") return "profile";
  if (clean === "/leaderboard" || clean === "/leaderboards") return "leaderboard";
  if (clean === "/quote" || clean === "/quotes") return "quote";
  if (clean === "/custom" || clean === "/builder") return "custom";
  if (clean === "/song" || clean === "/songs") return "song";

  const params = new URLSearchParams(search);
  const q = params.get("mode") || params.get("studio");
  if (q === "animation" || q === "animated") return "animated";
  if (q === "profile") return "profile";
  if (q === "leaderboard") return "leaderboard";
  if (q === "quote") return "quote";
  if (q === "custom") return "custom";
  if (q === "song") return "song";

  return "song";
}

export function getPathFromMode(mode: GeneratorType): string {
  switch (mode) {
    case "animated":
      return "/animation";
    case "profile":
      return "/profile";
    case "leaderboard":
      return "/leaderboard";
    case "quote":
      return "/quote";
    case "custom":
      return "/custom";
    case "song":
    default:
      return "/song";
  }
}

export default function App() {
  const { totalCount, userCount } = useStats();

  const [activeMode, setActiveMode] = useState<GeneratorType>(() => {
    if (typeof window !== "undefined") {
      return getModeFromPath(window.location.pathname, window.location.search);
    }
    return "song";
  });

  const navigateToMode = useCallback((mode: GeneratorType, updateHistory = true) => {
    setActiveMode(mode);
    setLastBlob(null);
    if (updateHistory && typeof window !== "undefined") {
      const target = getPathFromMode(mode);
      if (window.location.pathname !== target) {
        window.history.pushState({ mode }, "", target);
      }
    }
  }, []);

  const handleLinkClick = (e: React.MouseEvent<HTMLAnchorElement>, mode: GeneratorType) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    e.preventDefault();
    navigateToMode(mode);
  };

  useEffect(() => {
    const onPop = () => {
      setActiveMode(getModeFromPath(window.location.pathname, window.location.search));
      setLastBlob(null);
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  // State for all generators
  const [songTitle, setSongTitle] = useState<string>("Trending Top Hits");
  const [songs, setSongs] = useState<SongResult[]>(sampleSongs);
  const [songLayout, setSongLayout] = useState<"auto" | "list" | "grid" | "classic">("auto");

  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData>(defaultLeaderboardData);
  const [quoteData, setQuoteData] = useState<QuoteData>(defaultQuoteData);
  const [customCanvasData, setCustomCanvasData] = useState<CustomCanvasData>(DEFAULT_CUSTOM_CANVAS);

  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [lastBlob, setLastBlob] = useState<Blob | null>(null);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);
  const [showDocs, setShowDocs] = useState<boolean>(false);

  const showToast = (message: string, type: "success" | "error" = "success") => {
    setToast({ message, type });
    setTimeout(() => {
      setToast((prev) => (prev?.message === message ? null : prev));
    }, 3500);
  };

  const handleGenerate = useCallback(
    async (overrideCustomCanvas?: CustomCanvasData) => {
      setIsGenerating(true);

      let payload: AnyGenerateRequest;
      let defaultFilename = "export.png";

      if (activeMode === "song") {
        if (songs.length === 0) {
          showToast("Please provide at least one song track", "error");
          setIsGenerating(false);
          return;
        }
        payload = { type: "song", title: songTitle, items: songs, layout: songLayout };
        defaultFilename = `${(songTitle || "song-search").replace(/[/\\?%*:|"<>]/g, "-")}.png`;
      } else if (activeMode === "profile") {
        payload = { type: "profile", data: profileData };
        defaultFilename = `${profileData.username || "profile"}-rank.png`;
      } else if (activeMode === "leaderboard") {
        if (leaderboardData.items.length === 0) {
          showToast("Please provide at least one player on the leaderboard", "error");
          setIsGenerating(false);
          return;
        }
        payload = { type: "leaderboard", data: leaderboardData };
        defaultFilename = "leaderboard.png";
      } else if (activeMode === "quote") {
        payload = { type: "quote", data: quoteData };
        defaultFilename = `${quoteData.author || "quote"}.png`;
      } else {
        const activeCanvas = overrideCustomCanvas || customCanvasData;
        payload = { type: "custom", data: activeCanvas };
        defaultFilename = `${(activeCanvas.title || "custom-design").replace(/\s+/g, "-")}.png`;
      }

      try {
        const response = await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || "Failed to generate image from server");
        }

        const blob = await response.blob();
        setLastBlob(blob);

        const headerTotal = response.headers.get("X-Total-Generated");
        recordGeneratedImage(headerTotal ? parseInt(headerTotal, 10) : undefined);

        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = defaultFilename;
        document.body.appendChild(anchor);
        anchor.click();
        document.body.removeChild(anchor);
        setTimeout(() => URL.revokeObjectURL(url), 2000);

        showToast(`Successfully generated: ${defaultFilename}`);
      } catch (err: any) {
        console.error("Generation error:", err);
        showToast(err.message || "Failed to render PNG", "error");
      } finally {
        setIsGenerating(false);
      }
    },
    [activeMode, songTitle, songs, profileData, leaderboardData, quoteData, customCanvasData]
  );

  return (
    <div className="min-h-screen bg-[#080612] text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Toast Notification */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-xl border px-4 py-3 text-xs font-medium shadow-2xl backdrop-blur-md transition-all ${
            toast.type === "success"
              ? "border-emerald-500/40 bg-emerald-950/90 text-emerald-200"
              : "border-red-500/40 bg-red-950/90 text-red-200"
          }`}
        >
          {toast.type === "success" ? (
            <Check className="h-4 w-4 text-emerald-400" />
          ) : (
            <AlertCircle className="h-4 w-4 text-red-400" />
          )}
          <span>{toast.message}</span>
          <button
            onClick={() => setToast(null)}
            className="ml-2 text-slate-400 hover:text-white"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* Top Bar Contract (3 zones) */}
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/8 bg-[#0c0918]/85 px-6 backdrop-blur-md lg:px-10">
        {/* Zone 1: Single text element wordmark */}
        <a
          href="/song"
          onClick={(e) => handleLinkClick(e, "song")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-rose-500 to-indigo-500 text-white shadow-md shadow-purple-600/30 group-hover:scale-105 transition-transform">
            <Zap className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight text-white group-hover:text-purple-200 transition-colors">
            Image Studio
          </span>
        </a>

        {/* Zone 2: Navigation Links */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-300">
          <a
            href="/song"
            onClick={(e) => handleLinkClick(e, "song")}
            className={`transition-colors ${activeMode === "song" ? "text-purple-400 font-semibold" : "hover:text-purple-300"}`}
          >
            Song Search
          </a>
          <a
            href="/profile"
            onClick={(e) => handleLinkClick(e, "profile")}
            className={`transition-colors ${activeMode === "profile" ? "text-rose-400 font-semibold" : "hover:text-rose-300"}`}
          >
            Profile Card
          </a>
          <a
            href="/leaderboard"
            onClick={(e) => handleLinkClick(e, "leaderboard")}
            className={`transition-colors ${activeMode === "leaderboard" ? "text-amber-400 font-semibold" : "hover:text-amber-300"}`}
          >
            Leaderboard
          </a>
          <a
            href="/quote"
            onClick={(e) => handleLinkClick(e, "quote")}
            className={`transition-colors ${activeMode === "quote" ? "text-indigo-400 font-semibold" : "hover:text-indigo-300"}`}
          >
            Quote Card
          </a>
          <a
            href="/custom"
            onClick={(e) => handleLinkClick(e, "custom")}
            className={`transition-colors ${activeMode === "custom" ? "text-cyan-400 font-semibold" : "hover:text-cyan-300"}`}
          >
            Custom Studio
          </a>
          <a
            href="/animation"
            onClick={(e) => handleLinkClick(e, "animated")}
            className={`flex items-center gap-1.5 transition-colors ${activeMode === "animated" ? "text-fuchsia-400 font-semibold" : "hover:text-fuchsia-300"}`}
          >
            <Film className="h-3.5 w-3.5" />
            <span>Animation Studio</span>
          </a>
          <button
            onClick={() => setShowDocs(true)}
            className="hover:text-slate-100 transition-colors opacity-80"
          >
            API Docs
          </button>
        </nav>

        {/* Zone 3: Primary Action & Stat Counter */}
        <div className="flex items-center gap-3">
          {/* Live Stat Counter Badge */}
          <div
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-black/40 px-3 py-1.5 text-xs text-slate-300 shadow-sm backdrop-blur-md transition-all hover:border-purple-500/30"
            title={`Tổng số ảnh/banner đã tạo: ${totalCount} (Thiết bị này đã tạo: ${userCount})`}
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </div>
            <div className="flex items-center gap-1.5 font-mono">
              <span className="text-slate-400 text-[11px] hidden sm:inline">Created:</span>
              <span className="font-bold text-emerald-400 text-xs">
                {totalCount.toLocaleString()}
              </span>
              <span className="text-slate-400 text-[11px]">image</span>
            </div>
          </div>

          <button
            onClick={() => handleGenerate()}
            disabled={isGenerating}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-xs font-semibold text-white shadow-md shadow-purple-600/30 transition-all hover:from-purple-500 hover:to-indigo-500 disabled:opacity-50"
          >
            {isGenerating ? (
              <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
            ) : (
              <Sparkles className="h-3.5 w-3.5" />
            )}
            <span className="hidden sm:inline">Export PNG</span>
          </button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 px-4 py-6 sm:px-6 lg:px-10">
        <div className="mx-auto max-w-[1650px] space-y-6">
          {/* Mode Switcher Tabs */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/8 pb-4">
            <div className="flex flex-wrap items-center gap-2 p-1 rounded-xl bg-black/40 border border-white/10">
              <a
                href="/song"
                onClick={(e) => handleLinkClick(e, "song")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeMode === "song"
                    ? "bg-purple-600 text-white shadow-md shadow-purple-900/40 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Music className="h-4 w-4" />
                <span>Song Search</span>
              </a>

              <a
                href="/profile"
                onClick={(e) => handleLinkClick(e, "profile")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeMode === "profile"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-900/40 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <User className="h-4 w-4" />
                <span>Profile Card</span>
              </a>

              <a
                href="/leaderboard"
                onClick={(e) => handleLinkClick(e, "leaderboard")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeMode === "leaderboard"
                    ? "bg-amber-600 text-white shadow-md shadow-amber-900/40 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Trophy className="h-4 w-4" />
                <span>Leaderboard</span>
              </a>

              <a
                href="/quote"
                onClick={(e) => handleLinkClick(e, "quote")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeMode === "quote"
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-900/40 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Quote className="h-4 w-4" />
                <span>Quote Card</span>
              </a>

              <a
                href="/custom"
                onClick={(e) => handleLinkClick(e, "custom")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeMode === "custom"
                    ? "bg-cyan-600 text-white shadow-md shadow-cyan-900/40 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Palette className="h-4 w-4" />
                <span>Custom Studio</span>
              </a>

              <a
                href="/animation"
                onClick={(e) => handleLinkClick(e, "animated")}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium transition-all ${
                  activeMode === "animated"
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-900/40 font-semibold"
                    : "text-slate-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <Film className="h-4 w-4 text-purple-400" />
                <span>Animation Studio</span>
                <span className="rounded bg-purple-500/25 px-1.5 py-0.5 text-[9px] font-bold uppercase text-purple-200 border border-purple-400/30">
                  GIF/WebP
                </span>
              </a>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowDocs(true)}
                className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/10"
              >
                <HelpCircle className="h-3.5 w-3.5" />
                <span>API & Docs</span>
              </button>
            </div>
          </div>

          {/* Mode 1-4: Dual Panel Grid (Song, Profile, Leaderboard, Quote) */}
          {activeMode !== "custom" && activeMode !== "animated" && (
            <div className="grid grid-cols-1 gap-8 lg:grid-cols-[480px_1fr] xl:grid-cols-[540px_1fr]">
              <div className="rounded-2xl border border-white/10 bg-[#0e0a1e]/80 p-5 shadow-xl backdrop-blur-md">
                {activeMode === "song" && (
                  <GeneratorForm
                    title={songTitle}
                    songs={songs}
                    layout={songLayout}
                    onTitleChange={setSongTitle}
                    onSongsChange={setSongs}
                    onLayoutChange={setSongLayout}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                  />
                )}

                {activeMode === "profile" && (
                  <ProfileForm
                    data={profileData}
                    onChange={setProfileData}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                  />
                )}

                {activeMode === "leaderboard" && (
                  <LeaderboardForm
                    data={leaderboardData}
                    onChange={setLeaderboardData}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                  />
                )}

                {activeMode === "quote" && (
                  <QuoteForm
                    data={quoteData}
                    onChange={setQuoteData}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                  />
                )}
              </div>

              <div className="min-w-0">
                {activeMode === "song" && (
                  <ImagePreview
                    title={songTitle}
                    songs={songs}
                    layout={songLayout}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                    lastGeneratedBlob={lastBlob}
                  />
                )}

                {activeMode === "profile" && (
                  <ProfilePreview
                    data={profileData}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                    lastGeneratedBlob={lastBlob}
                  />
                )}

                {activeMode === "leaderboard" && (
                  <LeaderboardPreview
                    data={leaderboardData}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                    lastGeneratedBlob={lastBlob}
                  />
                )}

                {activeMode === "quote" && (
                  <QuotePreview
                    data={quoteData}
                    onGenerate={() => handleGenerate()}
                    isGenerating={isGenerating}
                    lastGeneratedBlob={lastBlob}
                  />
                )}
              </div>
            </div>
          )}

          {/* Mode 5: Custom Studio Canvas Builder */}
          {activeMode === "custom" && (
            <CustomBuilder
              onGenerate={(customData) => {
                setCustomCanvasData(customData);
                handleGenerate(customData);
              }}
              isGenerating={isGenerating}
              lastGeneratedBlob={lastBlob}
            />
          )}

          {/* Mode 6: Animation Studio */}
          {activeMode === "animated" && (
            <AnimationTimeline />
          )}
        </div>
      </main>

      {/* Docs / API Modal */}
      {showDocs && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="relative max-h-[85vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/15 bg-[#100b24] p-6 shadow-2xl text-slate-200">
            <div className="flex items-center justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-2">
                <Code2 className="h-5 w-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Image Studio API Specification</h3>
              </div>
              <button
                onClick={() => setShowDocs(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-5 space-y-5 text-xs sm:text-sm">
              <div>
                <h4 className="font-semibold text-purple-300">1. Song Search Results Card (1130px dynamic, up to 20 tracks)</h4>
                <p className="mt-1 text-slate-400 text-xs">Supports <code>"layout": "list"</code> (16:9 thumbnails), <code>"grid"</code> (cards with play button), or <code>"classic"</code>.</p>
                <pre className="mt-1.5 overflow-x-auto rounded-xl bg-black/60 p-3 font-mono text-xs text-purple-200 border border-white/10">
{`POST /api/generate
Content-Type: application/json

{
  "type": "song",
  "title": "Top 20 Trending Search",
  "layout": "list", // "list" | "grid" | "classic"
  "items": [
    {
      "index": 1,
      "displayName": "lofi hip hop radio - beats to relax/study to",
      "author": "Chillhop Music",
      "views": "24M views",
      "time": "3:00:00",
      "source": "youtube",
      "avatar": "https://..."
    }
    // ... up to 20 tracks
  ]
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-rose-300">2. Profile Rank Card (950 × 260px)</h4>
                <pre className="mt-1.5 overflow-x-auto rounded-xl bg-black/60 p-3 font-mono text-xs text-rose-200 border border-white/10">
{`POST /api/generate
Content-Type: application/json

{
  "type": "profile",
  "data": {
    "username": "__ziji",
    "balance": "13080 xu",
    "avatar": "https://...",
    "level": 16,
    "currentXp": 0,
    "requiredXp": 801,
    "rank": "#1"
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-amber-300">3. Leaderboard Card (540px)</h4>
                <pre className="mt-1.5 overflow-x-auto rounded-xl bg-black/60 p-3 font-mono text-xs text-amber-200 border border-white/10">
{`POST /api/generate
Content-Type: application/json

{
  "type": "leaderboard",
  "data": {
    "guildIcon": "https://...",
    "items": [
      { "rank": 1, "username": "Ziji", "handle": "@xxxxxxziji", "avatar": "https://...", "level": 16, "xp": 1 }
    ]
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-indigo-300">4. Quote Banner (1000 × 500px)</h4>
                <pre className="mt-1.5 overflow-x-auto rounded-xl bg-black/60 p-3 font-mono text-xs text-indigo-200 border border-white/10">
{`POST /api/generate
Content-Type: application/json

{
  "type": "quote",
  "data": {
    "quote": "text: Ziji Execute Ziji Execute",
    "author": "Ziji",
    "handle": "@__ziji",
    "tag": "Ziji Execute#9575",
    "avatar": "https://..."
  }
}`}
                </pre>
              </div>

              <div>
                <h4 className="font-semibold text-cyan-300">5. Custom Canvas Designer Endpoint</h4>
                <pre className="mt-1.5 overflow-x-auto rounded-xl bg-black/60 p-3 font-mono text-xs text-cyan-200 border border-white/10">
{`POST /api/generate
Content-Type: application/json

{
  "type": "custom",
  "data": {
    "title": "Custom Card",
    "width": 900,
    "height": 400,
    "background": "linear-gradient(135deg, #090210 0%, #630c33 100%)",
    "elements": [
      { "id": "1", "type": "text", "x": 50, "y": 50, "width": 200, "height": 30, "content": "Hello", "color": "#fff", "fontSize": 24 }
    ]
  }
}`}
                </pre>
              </div>

              <div className="border-t border-white/10 pt-4 flex justify-end">
                <button
                  onClick={() => setShowDocs(false)}
                  className="rounded-lg bg-purple-600 px-4 py-2 text-xs font-semibold text-white hover:bg-purple-500"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-auto border-t border-white/8 bg-[#090614] px-6 py-6 text-center text-xs text-slate-500">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 sm:flex-row">
          <span>Image Studio © 2026 · Satori & Sharp Pipeline</span>
          <div className="flex items-center gap-4 text-slate-400">
            <span>5 Modes: Song · Profile · Leaderboard · Quote · Custom Studio</span>
            <span>·</span>
            <span>Fast Server Rendering</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
