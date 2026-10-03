export type GeneratorType = "song" | "profile" | "leaderboard" | "quote" | "animated";

export interface SongResult { index: number; avatar: string; displayName: string; time: string; source: string; author?: string; views?: string; }
export interface SongGenerateRequest { type?: "song"; title: string; items: SongResult[]; layout?: "auto" | "list" | "grid" | "classic"; }

export type ProfileTheme = "ruby-poly" | "cyber-neon" | "glass-minimal" | "gold-legend";
export interface ProfileData {
  username: string;
  balance: string;
  avatar: string;
  level: number;
  currentXp: number;
  requiredXp: number;
  rank: string;
  theme?: ProfileTheme;
  badge?: string;
  title?: string;
}
export interface ProfileGenerateRequest { type: "profile"; data: ProfileData; }

export type LeaderboardLayout = "podium" | "compact-list" | "cyber-grid" | "minimal-cards";
export interface LeaderboardItem { rank: number; username: string; handle: string; avatar: string; level: number; xp: number; }
export interface LeaderboardData {
  guildIcon: string;
  guildName?: string;
  season?: string;
  items: LeaderboardItem[];
  layout?: LeaderboardLayout;
}
export interface LeaderboardGenerateRequest { type: "leaderboard"; data: LeaderboardData; }

export type QuoteLayout = "split-portrait" | "centered-minimal" | "modern-card" | "neon-cyber";
export interface QuoteData {
  quote: string;
  author: string;
  handle: string;
  tag: string;
  avatar: string;
  layout?: QuoteLayout;
}
export interface QuoteGenerateRequest { type: "quote"; data: QuoteData; }

export type CustomElementType = "text" | "image" | "avatar" | "badge" | "progress" | "box";

/**
 * Unified Transform system for canvas elements and animation keyframes.
 * Consolidates position, dimension, rotation, 2D scale, and origin anchor into a single model.
 */
export interface Transform {
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  anchorX: number;
  anchorY: number;
}

export type ElementTransform = Transform;

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

  // Unified Transform System
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  anchorX?: number;
  anchorY?: number;
  transform?: Transform;

  // Appearance Filters
  blur?: number;
  brightness?: number;
  saturation?: number;
  contrast?: number;

  // Extended Typography
  letterSpacing?: number;
  lineHeight?: number;
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
  easing?: "ease-in-out" | "linear" | "ease-in" | "ease-out" | "bounce" | "elastic" | "spring";

  // Position
  x?: number;
  y?: number;

  // Transform
  width?: number;
  height?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  anchorX?: number;
  anchorY?: number;
  transform?: Partial<Transform>;

  // Appearance
  opacity?: number;
  blur?: number;
  brightness?: number;
  saturation?: number;
  contrast?: number;

  // Color & Glow
  color?: string;
  backgroundColor?: string;
  glowColor?: string;
  glowBlur?: number;

  // Typography
  fontSize?: number;
  letterSpacing?: number;
  lineHeight?: number;
  textShadow?: string;
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
