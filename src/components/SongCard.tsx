import React, { useState } from "react";
import type { SongResult } from "../lib/types";
import { ChevronUp, ChevronDown, Trash2, Edit3, Check, Music } from "lucide-react";

interface SongCardProps {
  song: SongResult;
  isFirst: boolean;
  isLast: boolean;
  onUpdate: (updated: SongResult) => void;
  onDelete: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
}

export function SongCard({
  song,
  isFirst,
  isLast,
  onUpdate,
  onDelete,
  onMoveUp,
  onMoveDown,
}: SongCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(song.displayName);
  const [avatar, setAvatar] = useState(song.avatar);
  const [time, setTime] = useState(song.time);
  const [source, setSource] = useState(song.source);
  const [author, setAuthor] = useState(song.author || "");
  const [views, setViews] = useState(song.views || "");
  const [imgError, setImgError] = useState(false);

  const handleSave = () => {
    onUpdate({
      ...song,
      displayName: displayName.trim() || "Untitled Song",
      avatar: avatar.trim(),
      time: time.trim() || "03:00",
      source: source.trim() || "youtube",
      author: author.trim() || undefined,
      views: views.trim() || undefined,
    });
    setIsEditing(false);
  };

  return (
    <div className="group relative rounded-xl border border-white/8 bg-[#141026]/90 p-3 transition-all duration-200 hover:border-purple-500/30 hover:bg-[#1a1532]">
      {isEditing ? (
        <div className="space-y-3">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="text-xs font-medium text-purple-400">
              Edit Track #{song.index}
            </span>
            <button
              onClick={handleSave}
              className="flex items-center gap-1 rounded-md bg-purple-600 px-2.5 py-1 text-xs font-medium text-white hover:bg-purple-500"
            >
              <Check className="h-3.5 w-3.5" />
              Save
            </button>
          </div>

          <div className="space-y-2">
            <div>
              <label className="text-[11px] text-slate-400">Track Name / Title</label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400">Channel / Artist (e.g. Chillhop Music)</label>
                <input
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  placeholder="Chillhop Music"
                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Views / Likes (e.g. 24M views)</label>
                <input
                  type="text"
                  value={views}
                  onChange={(e) => setViews(e.target.value)}
                  placeholder="24M views"
                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[11px] text-slate-400">Duration (e.g. 3:00:00 or 04:15)</label>
                <input
                  type="text"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  placeholder="3:00:00"
                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none font-mono"
                />
              </div>
              <div>
                <label className="text-[11px] text-slate-400">Source Platform</label>
                <input
                  type="text"
                  value={source}
                  onChange={(e) => setSource(e.target.value)}
                  placeholder="youtube"
                  className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="text-[11px] text-slate-400">Thumbnail URL (16:9 or Square)</label>
              <input
                type="url"
                value={avatar}
                onChange={(e) => {
                  setAvatar(e.target.value);
                  setImgError(false);
                }}
                placeholder="https://..."
                className="mt-0.5 w-full rounded-lg border border-white/10 bg-black/40 px-2.5 py-1.5 text-xs text-white focus:border-purple-500 focus:outline-none"
              />
            </div>
          </div>
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Index badge */}
          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white/10 text-xs font-semibold text-slate-200">
            {song.index}
          </div>

          {/* Thumbnail */}
          <div className="relative h-11 w-16 shrink-0 overflow-hidden rounded-md border border-white/10 bg-black/50">
            {!imgError && song.avatar ? (
              <img
                src={song.avatar}
                alt={song.displayName}
                onError={() => setImgError(true)}
                className="h-full w-full object-cover"
                referrerPolicy="no-referrer"
                loading="lazy"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-purple-400">
                <Music className="h-5 w-5" />
              </div>
            )}
            <div className="absolute bottom-0.5 right-0.5 rounded bg-black/80 px-1 py-0.2 text-[9px] font-mono text-white">
              {song.time}
            </div>
          </div>

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h4 className="truncate text-sm font-medium text-white group-hover:text-purple-200">
              {song.displayName}
            </h4>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-indigo-300">
              <span className="truncate">{song.author || song.source}</span>
              <span className="text-slate-600">·</span>
              <span className="font-mono text-[11px] text-slate-400">{song.views || song.time}</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 opacity-70 transition-opacity group-hover:opacity-100">
            <button
              onClick={() => setIsEditing(true)}
              title="Edit track"
              className="rounded-md p-1.5 text-slate-400 hover:bg-white/10 hover:text-white"
            >
              <Edit3 className="h-3.5 w-3.5" />
            </button>
            <div className="flex flex-col">
              <button
                disabled={isFirst}
                onClick={onMoveUp}
                title="Move up"
                className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20"
              >
                <ChevronUp className="h-3 w-3" />
              </button>
              <button
                disabled={isLast}
                onClick={onMoveDown}
                title="Move down"
                className="rounded p-0.5 text-slate-400 hover:bg-white/10 hover:text-white disabled:opacity-20"
              >
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>
            <button
              onClick={onDelete}
              title="Delete track"
              className="rounded-md p-1.5 text-red-400 hover:bg-red-500/20 hover:text-red-300"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
