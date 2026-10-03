export type GeneratorType = "song" | "profile" | "leaderboard" | "quote" | "animated";

export interface SongResult { index: number; avatar: string; displayName: string; time: string; source: string; author?: string; views?: string; }
export interface SongGenerateRequest { type?: "song"; title: string; items: SongResult[]; layout?: "auto" | "list" | "grid" | "classic"; }
export interface ProfileData { username: string; balance: string; avatar: string; level: number; currentXp: number; requiredXp: number; rank: string; theme?: "ruby-poly" | "purple-glow" | "midnight-blue" | "dark-slate"; }
export interface ProfileGenerateRequest { type: "profile"; data: ProfileData; }
export interface LeaderboardItem { rank: number; username: string; handle: string; avatar: string; level: number; xp: number; }
export interface LeaderboardData { guildIcon: string; guildName?: string; items: LeaderboardItem[]; }
export interface LeaderboardGenerateRequest { type: "leaderboard"; data: LeaderboardData; }
export interface QuoteData { quote: string; author: string; handle: string; tag: string; avatar: string; }
export interface QuoteGenerateRequest { type: "quote"; data: QuoteData; }

export type CustomElementType = "text" | "image" | "avatar" | "badge" | "progress" | "box";
export interface CustomElement {
  id: string; type: CustomElementType; x: number; y: number; width: number; height: number;
  content?: string; color?: string; backgroundColor?: string; fontSize?: number; fontWeight?: number;
  borderRadius?: number; border?: string; opacity?: number; zIndex?: number; progressPercent?: number;
  progressColor?: string; imageUrl?: string; textAlign?: "left" | "center" | "right";
  textShadow?: string;
  shadowEnabled?: boolean;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  glowEnabled?: boolean;
  glowColor?: string;
  glowBlur?: number;
  glowIntensity?: "soft" | "medium" | "neon";
}
export interface CustomCanvasData {
  title: string; width: number; height: number; background: string; elements: CustomElement[];
  /** Optional animated background image URL. GIF/APNG/WebP frames are sampled per output frame. */
  backgroundImageUrl?: string;
}
export interface CustomGenerateRequest { type: "custom"; data: CustomCanvasData; }

export type AnimatedImageFormat = "gif" | "webp" | "png";

export interface KeyframeData {
  id?: string;
  time: number;
  easing?: "ease-in-out" | "linear" | "ease-in" | "ease-out" | "bounce";
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  opacity?: number;
}

export interface TrackData {
  elementId: string;
  keyframes: KeyframeData[];
}

export interface AnimatedGenerateData {
  title: string;
  format?: AnimatedImageFormat;
  loop?: number;

  /** Target a single frame index for PNG output (0-indexed) */
  frameIndex?: number;
  /** Target a specific timestamp in milliseconds for PNG output */
  frameTime?: number;

  // Format A: Baked frames (classic format)
  frames?: CustomCanvasData[];
  delay?: number | number[];

  // Format B: Super Compact Timeline (Canvas + Keyframe Tracks - ~98% smaller payload!)
  canvas?: CustomCanvasData;
  tracks?: TrackData[];
  duration?: number;
  fps?: number;
  templateVariables?: Record<string, string>;
}
export interface AnimatedGenerateRequest { type: "animated"; data: AnimatedGenerateData; }
export type AnyGenerateRequest = SongGenerateRequest | ProfileGenerateRequest | LeaderboardGenerateRequest | QuoteGenerateRequest | CustomGenerateRequest | AnimatedGenerateRequest | { title: string; items: SongResult[]; type?: undefined };
export interface PresetSample { id: string; name: string; count: number; title: string; songs: SongResult[]; }
