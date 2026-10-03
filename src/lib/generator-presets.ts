import type { SongResult, ProfileData, LeaderboardData, QuoteData } from "./types";
import { sampleSongs } from "./sample-data";

export interface StoredPreset<T = any> {
  id: string;
  name: string;
  description: string;
  category: "builtin" | "user";
  createdAt?: string;
  data: T;
  badge?: string;
}

export type PresetGeneratorType = "song" | "profile" | "leaderboard" | "quote";

// 1. Built-in Song Presets
export const BUILTIN_SONG_PRESETS: StoredPreset<{
  title: string;
  songs: SongResult[];
  layout: "auto" | "list" | "grid" | "classic";
}>[] = [
  {
    id: "song-lofi-list",
    name: "Lo-Fi Study (List)",
    description: "5 relaxing lo-fi beats in clean modern vertical list layout",
    category: "builtin",
    badge: "List · 5 Tracks",
    data: {
      title: "Lo-Fi Beats to Relax & Study",
      layout: "list",
      songs: sampleSongs.slice(0, 5).map((s, i) => ({ ...s, index: i + 1 })),
    },
  },
  {
    id: "song-chill-grid",
    name: "Summer Chill (Grid)",
    description: "6 vibrant tracks in compact 2-column grid cards",
    category: "builtin",
    badge: "Grid · 6 Tracks",
    data: {
      title: "Summer Chill Vibes 2026",
      layout: "grid",
      songs: sampleSongs.slice(0, 6).map((s, i) => ({ ...s, index: i + 1 })),
    },
  },
  {
    id: "song-classic-compact",
    name: "Trending Hits (Classic)",
    description: "4 top tracks in classic Discord bot style banner",
    category: "builtin",
    badge: "Classic · 4 Tracks",
    data: {
      title: "Trending Music Search",
      layout: "classic",
      songs: sampleSongs.slice(0, 4).map((s, i) => ({ ...s, index: i + 1 })),
    },
  },
  {
    id: "song-mega-auto",
    name: "Mega Playlist (Auto 10)",
    description: "10 curated tracks with automated responsive sizing",
    category: "builtin",
    badge: "Auto · 10 Tracks",
    data: {
      title: "Essential Study Vibes (Top 10)",
      layout: "auto",
      songs: sampleSongs.slice(0, 10).map((s, i) => ({ ...s, index: i + 1 })),
    },
  },
];

// 2. Built-in Profile Presets
export const BUILTIN_PROFILE_PRESETS: StoredPreset<ProfileData>[] = [
  {
    id: "profile-ruby-legend",
    name: "Ruby Poly Legend",
    description: "Rank #1 elite player with geometric ruby backdrop and 13K gold",
    category: "builtin",
    badge: "Ruby · Lv.16",
    data: {
      username: "__ziji",
      balance: "13,080 xu",
      avatar: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg",
      level: 16,
      currentXp: 350,
      requiredXp: 800,
      rank: "#1",
      theme: "ruby-poly",
      title: "Ruby Grandmaster",
      badge: "★ TOP 1 GUILD",
    },
  },
  {
    id: "profile-cyber-samurai",
    name: "Cyber Neon Samurai",
    description: "Futuristic neon purple & cyan theme with tech stats and cyber grid",
    category: "builtin",
    badge: "Cyber · Lv.42",
    data: {
      username: "Neon_Kenshi",
      balance: "85,400 xu",
      avatar: "https://i.ytimg.com/vi/jfKfPfyJRdk/hq720.jpg",
      level: 42,
      currentXp: 3200,
      requiredXp: 4000,
      rank: "#3",
      theme: "cyber-neon",
      title: "Neon Infiltrator",
      badge: "⚡ CYBER RONIN",
    },
  },
  {
    id: "profile-glass-emerald",
    name: "Glassmorphic Emerald",
    description: "Clean frosted glass aesthetic with emerald aurora and circular glow",
    category: "builtin",
    badge: "Glass · Lv.99",
    data: {
      username: "AetherLord",
      balance: "1,250,000 xu",
      avatar: "https://i.ytimg.com/vi/rUxyKA_-grg/hq720.jpg",
      level: 99,
      currentXp: 9500,
      requiredXp: 10000,
      rank: "#1",
      theme: "glass-minimal",
      title: "Aura Champion",
      badge: "✦ EMERALD AURA",
    },
  },
  {
    id: "profile-gold-legend",
    name: "Imperial Gold Legend",
    description: "Majestic imperial gold & dark obsidian with crowned warrior stats",
    category: "builtin",
    badge: "Gold · Lv.80",
    data: {
      username: "Aurelius_Rex",
      balance: "540,000 xu",
      avatar: "https://i.ytimg.com/vi/5qap5aO4i9A/hq720.jpg",
      level: 80,
      currentXp: 6800,
      requiredXp: 7500,
      rank: "#2",
      theme: "gold-legend",
      title: "Imperial Vanguard",
      badge: "👑 IMPERIAL AETHER",
    },
  },
];

// 3. Built-in Leaderboard Presets
export const BUILTIN_LEADERBOARD_PRESETS: StoredPreset<LeaderboardData>[] = [
  {
    id: "lb-championship-podium",
    name: "Championship Podium (Top 10)",
    description: "Full guild leaderboard with 3D top 3 podium & Season 1 banner",
    category: "builtin",
    badge: "Podium · 10 Players",
    data: {
      guildName: "Legends of Arcana",
      guildIcon: "https://i.ytimg.com/vi/NRRXrZnhT5s/hq720.jpg",
      season: "SEASON 1",
      layout: "podium",
      items: [
        { rank: 1, username: "Ziji", handle: "@xxxxxxziji", avatar: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg", level: 16, xp: 8250 },
        { rank: 2, username: "ShadowFang", handle: "@shadow_ninja", avatar: "https://i.ytimg.com/vi/jfKfPfyJRdk/hq720.jpg", level: 14, xp: 7100 },
        { rank: 3, username: "Valkyrie", handle: "@valk_queen", avatar: "https://i.ytimg.com/vi/rUxyKA_-grg/hq720.jpg", level: 12, xp: 5800 },
        { rank: 4, username: "CyberRonin", handle: "@ronin99", avatar: "https://i.ytimg.com/vi/DWcJFNfaw9c/hq720.jpg", level: 10, xp: 4300 },
        { rank: 5, username: "FrostBite", handle: "@frosty", avatar: "https://i.ytimg.com/vi/5qap5aO4i9A/hq720.jpg", level: 9, xp: 3900 },
        { rank: 6, username: "Phoenix", handle: "@firebird", avatar: "https://i.ytimg.com/vi/7NOSDKb0HlU/hq720.jpg", level: 8, xp: 3400 },
        { rank: 7, username: "NovaStrike", handle: "@nova_star", avatar: "https://i.ytimg.com/vi/n61ULEU7SU0/hq720.jpg", level: 7, xp: 2800 },
        { rank: 8, username: "IronClad", handle: "@iron_tank", avatar: "https://i.ytimg.com/vi/1_C_Z9xT1m8/hq720.jpg", level: 6, xp: 2100 },
        { rank: 9, username: "BlazeRider", handle: "@blaze", avatar: "https://i.ytimg.com/vi/aGSYKFb_zxg/hq720.jpg", level: 5, xp: 1600 },
        { rank: 10, username: "StormSeeker", handle: "@storm", avatar: "https://i.ytimg.com/vi/gGEyRz0x7Kk/hq720.jpg", level: 4, xp: 1100 },
      ],
    },
  },
  {
    id: "lb-compact-list",
    name: "Streamlined List (Compact)",
    description: "High-density clean list with medal badges 🥇🥈🥉 and sleek rows",
    category: "builtin",
    badge: "List · 6 Players",
    data: {
      guildName: "Grand Masters Arena",
      guildIcon: "https://i.ytimg.com/vi/jfKfPfyJRdk/hq720.jpg",
      season: "GLOBAL RANK",
      layout: "compact-list",
      items: [
        { rank: 1, username: "AetherKing", handle: "@aether_1", avatar: "https://i.ytimg.com/vi/rUxyKA_-grg/hq720.jpg", level: 50, xp: 48900 },
        { rank: 2, username: "SilverBlade", handle: "@silver_blade", avatar: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg", level: 46, xp: 42100 },
        { rank: 3, username: "CrimsonNova", handle: "@crimson_x", avatar: "https://i.ytimg.com/vi/5qap5aO4i9A/hq720.jpg", level: 41, xp: 37500 },
        { rank: 4, username: "ValkyriePrime", handle: "@valk_prime", avatar: "https://i.ytimg.com/vi/DWcJFNfaw9c/hq720.jpg", level: 38, xp: 32000 },
        { rank: 5, username: "ZenithHunter", handle: "@zenith", avatar: "https://i.ytimg.com/vi/7NOSDKb0HlU/hq720.jpg", level: 34, xp: 27400 },
        { rank: 6, username: "NightStalker", handle: "@stalker", avatar: "https://i.ytimg.com/vi/n61ULEU7SU0/hq720.jpg", level: 30, xp: 23100 },
      ],
    },
  },
  {
    id: "lb-cyber-grid",
    name: "Cyber Neon Grid",
    description: "Cyberpunk 2-column battle grid with glowing rank tiles & neon accents",
    category: "builtin",
    badge: "Cyber Grid · 6 Players",
    data: {
      guildName: "Neo Tokyo Speedrunners",
      guildIcon: "https://i.ytimg.com/vi/DWcJFNfaw9c/hq720.jpg",
      season: "CYBER TOURNEY",
      layout: "cyber-grid",
      items: [
        { rank: 1, username: "WarlordThor", handle: "@thor_hammer", avatar: "https://i.ytimg.com/vi/DWcJFNfaw9c/hq720.jpg", level: 30, xp: 19800 },
        { rank: 2, username: "OdinSpear", handle: "@odin_all", avatar: "https://i.ytimg.com/vi/7NOSDKb0HlU/hq720.jpg", level: 28, xp: 17200 },
        { rank: 3, username: "LokiTrickster", handle: "@loki_chaos", avatar: "https://i.ytimg.com/vi/n61ULEU7SU0/hq720.jpg", level: 25, xp: 14500 },
        { rank: 4, username: "FreyaFalcon", handle: "@freya_wings", avatar: "https://i.ytimg.com/vi/1_C_Z9xT1m8/hq720.jpg", level: 22, xp: 11900 },
        { rank: 5, username: "HeimdallGaze", handle: "@bifrost", avatar: "https://i.ytimg.com/vi/aGSYKFb_zxg/hq720.jpg", level: 20, xp: 9800 },
        { rank: 6, username: "TyrJustice", handle: "@tyr_blade", avatar: "https://i.ytimg.com/vi/gGEyRz0x7Kk/hq720.jpg", level: 18, xp: 8400 },
      ],
    },
  },
];

// 4. Built-in Quote Presets
export const BUILTIN_QUOTE_PRESETS: StoredPreset<QuoteData>[] = [
  {
    id: "quote-steve-jobs",
    name: "Steve Jobs (Split Cinema)",
    description: "Cinematic side-by-side portrait with horizontal gradient fade",
    category: "builtin",
    badge: "Split Cinema",
    data: {
      quote: "The people who are crazy enough to think they can change the world are the ones who do.",
      author: "Steve Jobs",
      handle: "@stevejobs",
      tag: "Apple Co-founder",
      avatar: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg",
      layout: "split-portrait",
    },
  },
  {
    id: "quote-marcus-aurelius",
    name: "Marcus Aurelius (Centered Editorial)",
    description: "Philosophical centered typography with quote watermark & verified seal",
    category: "builtin",
    badge: "Centered Editorial",
    data: {
      quote: "You have power over your mind - not outside events. Realize this, and you will find strength.",
      author: "Marcus Aurelius",
      handle: "@meditations",
      tag: "Roman Emperor & Stoic",
      avatar: "https://i.ytimg.com/vi/jfKfPfyJRdk/hq720.jpg",
      layout: "centered-minimal",
    },
  },
  {
    id: "quote-alan-turing",
    name: "Alan Turing (Modern Card)",
    description: "Frosted speech card with author pill header and highlighted quotation",
    category: "builtin",
    badge: "Modern Card",
    data: {
      quote: "Sometimes it is the people no one can imagine anything of who do things no one can imagine.",
      author: "Alan Turing",
      handle: "@alanturing",
      tag: "Father of Modern Computing",
      avatar: "https://i.ytimg.com/vi/rUxyKA_-grg/hq720.jpg",
      layout: "modern-card",
    },
  },
  {
    id: "quote-bruce-lee",
    name: "Bruce Lee (Cyberpunk Neon)",
    description: "Glowing neon cyan & gold cyber terminal card with neon author frame",
    category: "builtin",
    badge: "Neon Cyber",
    data: {
      quote: "Be like water making its way through cracks. Do not be assertive, but adjust to the object, and you shall find a way around or through it.",
      author: "Bruce Lee",
      handle: "@brucelee",
      tag: "Philosopher & Martial Artist",
      avatar: "https://i.ytimg.com/vi/DWcJFNfaw9c/hq720.jpg",
      layout: "neon-cyber",
    },
  },
];

// Helper: Get localStorage key for a generator
export function getStorageKey(type: PresetGeneratorType): string {
  return `image_studio_user_presets_${type}`;
}

// Helper: Read user presets from localStorage
export function loadUserPresets<T>(type: PresetGeneratorType): StoredPreset<T>[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(getStorageKey(type));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

// Helper: Save a new user preset to localStorage
export function saveUserPreset<T>(
  type: PresetGeneratorType,
  name: string,
  description: string,
  data: T,
  badge?: string
): StoredPreset<T> {
  const existing = loadUserPresets<T>(type);
  const newPreset: StoredPreset<T> = {
    id: `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`,
    name: name.trim() || `My Preset ${existing.length + 1}`,
    description: description.trim() || `Saved on ${new Date().toLocaleDateString()}`,
    category: "user",
    createdAt: new Date().toISOString(),
    data,
    badge: badge || "User Saved",
  };

  const updated = [newPreset, ...existing];
  try {
    localStorage.setItem(getStorageKey(type), JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to save preset to localStorage:", err);
  }

  return newPreset;
}

// Helper: Delete a user preset
export function deleteUserPreset(type: PresetGeneratorType, presetId: string): void {
  const existing = loadUserPresets(type);
  const updated = existing.filter((p) => p.id !== presetId);
  try {
    localStorage.setItem(getStorageKey(type), JSON.stringify(updated));
  } catch (err) {
    console.error("Failed to delete preset from localStorage:", err);
  }
}

// Helper: Get all built-in presets for a given generator type
export function getBuiltinPresets(type: PresetGeneratorType): StoredPreset[] {
  switch (type) {
    case "song":
      return BUILTIN_SONG_PRESETS;
    case "profile":
      return BUILTIN_PROFILE_PRESETS;
    case "leaderboard":
      return BUILTIN_LEADERBOARD_PRESETS;
    case "quote":
      return BUILTIN_QUOTE_PRESETS;
    default:
      return [];
  }
}
