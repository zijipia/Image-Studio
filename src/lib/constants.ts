import type { CustomCanvasData } from "./types";

export const CANVAS_WIDTH = 1130;
export const CARD_WIDTH = 543;
export const CARD_HEIGHT = 80;
export const ROW_GAP = 8;
export const COL_GAP = 14;
export const PADDING_X = 14;
export const PADDING_TOP = 20;
export const PADDING_BOTTOM = 20;
export const HEADER_HEIGHT = 65;
export const HEADER_GAP = 12;

/**
 * Pure calculation of dynamic canvas height based on song count.
 * Safe for browser and server runtime.
 */
export function calculateHeight(
  itemCount: number,
  layout: "auto" | "list" | "grid" | "classic" = "auto"
): number {
  if (itemCount <= 0) return 220;

  const effectiveLayout =
    layout !== "auto"
      ? layout
      : itemCount <= 10
      ? "grid"
      : "list";

  if (effectiveLayout === "grid") {
    const cols = itemCount <= 8 ? 4 : 5;
    const rows = Math.ceil(itemCount / cols);
    const cardH = cols === 5 ? 245 : 275;
    const gap = 16;
    return (
      PADDING_TOP +
      HEADER_HEIGHT +
      HEADER_GAP +
      rows * cardH +
      Math.max(0, rows - 1) * gap +
      PADDING_BOTTOM
    );
  }

  // Dual column list (2 columns x N rows, up to 20 songs = 10 rows)
  const rows = Math.ceil(itemCount / 2);
  const cardH = effectiveLayout === "list" ? 76 : CARD_HEIGHT;
  const base =
    PADDING_TOP +
    HEADER_HEIGHT +
    HEADER_GAP +
    rows * cardH +
    Math.max(0, rows - 1) * ROW_GAP +
    PADDING_BOTTOM;

  return rows === 5 && effectiveLayout === "classic" ? base + 1 : base;
}

// Profile Banner Constants
export const PROFILE_WIDTH = 950;
export const PROFILE_HEIGHT = 260;

// Leaderboard Constants
export const LEADERBOARD_WIDTH = 540;
export function calculateLeaderboardHeight(itemCount: number, layout?: "podium" | "compact-list" | "cyber-grid" | "minimal-cards"): number {
  if (layout === "compact-list") {
    return 20 + 76 + 16 + Math.max(1, itemCount) * 64 + Math.max(0, itemCount - 1) * 8 + 20;
  }
  if (layout === "cyber-grid") {
    const rows = Math.ceil(Math.max(1, itemCount) / 2);
    return 20 + 76 + 16 + rows * 82 + Math.max(0, rows - 1) * 8 + 20;
  }
  if (layout === "minimal-cards") {
    return 20 + 76 + 16 + Math.max(1, itemCount) * 72 + Math.max(0, itemCount - 1) * 8 + 20;
  }
  if (itemCount <= 0) return 420;
  if (itemCount <= 3) {
    return 20 + 76 + 16 + 265 + 20; // 397px for top 3 podium only
  }
  const remaining = itemCount - 3;
  return 20 + 76 + 16 + 265 + 16 + remaining * 68 + Math.max(0, remaining - 1) * 8 + 20;
}

// Quote Card Constants
export const QUOTE_WIDTH = 1000;
export const QUOTE_HEIGHT = 500;

// Custom Canvas Presets
export const CANVAS_PRESET_BACKGROUNDS = [
  {
    id: "dark-purple",
    name: "Midnight Indigo",
    value: "radial-gradient(circle at 90% 100%, #5b00b8 0%, transparent 55%), linear-gradient(120deg, #0c0918, #100b2d)",
  },
  {
    id: "ruby-polygon",
    name: "Ruby Polygon",
    value: "linear-gradient(135deg, #090210 0%, #1a031e 30%, #3d0728 65%, #630c33 100%)",
  },
  {
    id: "cyber-blue",
    name: "Cyber Azure",
    value: "linear-gradient(135deg, #040d21 0%, #08214d 50%, #0284c7 100%)",
  },
  {
    id: "emerald-tech",
    name: "Emerald Glow",
    value: "linear-gradient(135deg, #021a12 0%, #063e2c 50%, #059669 100%)",
  },
  {
    id: "pitch-black",
    name: "Pure Obsidian",
    value: "#000000",
  },
  {
    id: "discord-dark",
    name: "Discord Gray",
    value: "#1e1f23",
  },
];

export const DEFAULT_CUSTOM_CANVAS: CustomCanvasData = {
  title: "My Custom Card",
  width: 900,
  height: 400,
  background:
    "radial-gradient(circle at 90% 100%, #5b00b8 0%, transparent 55%), linear-gradient(120deg, #0c0918, #100b2d)",
  elements: [
    {
      id: "el-avatar-1",
      type: "avatar",
      x: 40,
      y: 50,
      width: 120,
      height: 120,
      imageUrl: "https://i.ytimg.com/vi/MsHvLrs6sjk/hq720.jpg",
      borderRadius: 999,
      border: "3px solid #a855f7",
    },
    {
      id: "el-text-name",
      type: "text",
      x: 185,
      y: 60,
      width: 400,
      height: 40,
      content: "Alex Rivers",
      color: "#ffffff",
      fontSize: 32,
      fontWeight: 600,
      textShadow: "0 0 12px rgba(192, 132, 252, 0.7), 2px 3px 6px rgba(0, 0, 0, 0.85)",
      shadowEnabled: true,
      shadowOffsetX: 2,
      shadowOffsetY: 3,
      shadowBlur: 6,
      shadowColor: "rgba(0, 0, 0, 0.85)",
      glowEnabled: true,
      glowBlur: 12,
      glowColor: "#c084fc",
      glowIntensity: "medium",
    },
    {
      id: "el-badge-role",
      type: "badge",
      x: 185,
      y: 110,
      width: 130,
      height: 28,
      content: "VIP CREATOR",
      color: "#facc15",
      backgroundColor: "rgba(234, 179, 8, 0.15)",
      fontSize: 12,
      fontWeight: 600,
      borderRadius: 999,
      border: "1px solid rgba(250, 204, 21, 0.4)",
    },
    {
      id: "el-progress-1",
      type: "progress",
      x: 40,
      y: 210,
      width: 820,
      height: 20,
      progressPercent: 72,
      progressColor: "linear-gradient(90deg, #a855f7, #ec4899)",
      backgroundColor: "#27272a",
      borderRadius: 999,
    },
    {
      id: "el-text-stats",
      type: "text",
      x: 40,
      y: 245,
      width: 820,
      height: 30,
      content: "LEVEL: 24    ·    XP: 7,200 / 10,000    ·    RANK: #4",
      color: "#cbd5e1",
      fontSize: 16,
      fontWeight: 500,
    },
    {
      id: "el-image-qr",
      type: "image",
      x: 720,
      y: 40,
      width: 140,
      height: 140,
      imageUrl: "https://i.ytimg.com/vi/NRRXrZnhT5s/hq720.jpg",
      borderRadius: 14,
      border: "1px solid rgba(255, 255, 255, 0.2)",
    },
  ],
};
