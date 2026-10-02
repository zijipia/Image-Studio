export type GeneratorType = "song" | "profile" | "leaderboard" | "quote" | "custom" | "animated";

export interface SongResult { index: number; avatar: string; displayName: string; time: string; source: string; author?: string; views?: string; }
export interface SongGenerateRequest { type?: "song"; title: string; items: SongResult[]; layout?: "auto" | "list" | "grid" | "classic"; }
export interface ProfileData { username: string; balance: string; avatar: string; level: number; currentXp: number; requiredXp: number; rank: string; theme?: "ruby-poly" | "purple-glow" | "midnight-blue" | "dark-slate"; }
export interface ProfileGenerateRequest { type: "profile"; data: ProfileData; }
export interface LeaderboardItem { rank: number; username: string; handle: string; avatar: string; level: number; xp: number; }
export interface LeaderboardData { guildIcon: string; items: LeaderboardItem[]; }
export interface LeaderboardGenerateRequest { type: "leaderboard"; data: LeaderboardData; }
export interface QuoteData { quote: string; author: string; handle: string; tag: string; avatar: string; }
export interface QuoteGenerateRequest { type: "quote"; data: QuoteData; }

export type CustomElementType = "text" | "image" | "avatar" | "badge" | "progress" | "box";
export interface CustomElement {
  id: string; type: CustomElementType; x: number; y: number; width: number; height: number;
  content?: string; color?: string; backgroundColor?: string; fontSize?: number; fontWeight?: number;
  borderRadius?: number; border?: string; opacity?: number; zIndex?: number; progressPercent?: number;
  progressColor?: string; imageUrl?: string; textAlign?: "left" | "center" | "right";
}
export interface CustomCanvasData {
  title: string; width: number; height: number; background: string; elements: CustomElement[];
  /** Optional animated background image URL. GIF/APNG/WebP frames are sampled per output frame. */
  backgroundImageUrl?: string;
}
export interface CustomGenerateRequest { type: "custom"; data: CustomCanvasData; }

export type AnimatedImageFormat = "gif" | "webp";
export interface AnimatedGenerateData {
  title: string; frames: CustomCanvasData[]; delay?: number | number[]; loop?: number; format?: AnimatedImageFormat;
}
export interface AnimatedGenerateRequest { type: "animated"; data: AnimatedGenerateData; }
export type AnyGenerateRequest = SongGenerateRequest | ProfileGenerateRequest | LeaderboardGenerateRequest | QuoteGenerateRequest | CustomGenerateRequest | AnimatedGenerateRequest | { title: string; items: SongResult[]; type?: undefined };
export interface PresetSample { id: string; name: string; count: number; title: string; songs: SongResult[]; }
