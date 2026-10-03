import type { CustomElement } from "./types";

export interface TextShadowPreset {
  id: string;
  name: string;
  category: "none" | "shadow" | "glow" | "combo";
  value: string;
  textColor?: string;
  description?: string;
}

export const TEXT_SHADOW_PRESETS: TextShadowPreset[] = [
  {
    id: "none",
    name: "Tắt",
    category: "none",
    value: "",
    description: "Không có hiệu ứng bóng hoặc phát sáng",
  },
  {
    id: "soft-shadow",
    name: "Bóng dịu",
    category: "shadow",
    value: "2px 3px 6px rgba(0, 0, 0, 0.85)",
    description: "Bóng đen dịu nhẹ tăng tương phản trên nền sáng/màu",
  },
  {
    id: "deep-3d-shadow",
    name: "Bóng 3D Đậm",
    category: "shadow",
    value: "3px 4px 0px rgba(0, 0, 0, 0.95), 5px 8px 14px rgba(0, 0, 0, 0.7)",
    description: "Hiệu ứng bóng nổi khối đa lớp sâu",
  },
  {
    id: "purple-glow",
    name: "Tím Neon",
    category: "glow",
    value: "0 0 10px #c084fc, 0 0 24px #a855f7",
    textColor: "#ffffff",
    description: "Phát sáng tím tím huyền ảo cyberpunk",
  },
  {
    id: "cyan-glow",
    name: "Xanh Cyber",
    category: "glow",
    value: "0 0 10px #38bdf8, 0 0 24px #06b6d4",
    textColor: "#ffffff",
    description: "Phát sáng xanh dương vị lai công nghệ",
  },
  {
    id: "gold-glow",
    name: "Hoàng Kim",
    category: "glow",
    value: "0 0 10px #facc15, 0 0 24px #ca8a04",
    textColor: "#fef08a",
    description: "Hào quang vàng rực rỡ cao cấp",
  },
  {
    id: "rose-glow",
    name: "Hồng Neon",
    category: "glow",
    value: "0 0 10px #f43f5e, 0 0 24px #e11d48",
    textColor: "#ffe4e6",
    description: "Phát sáng hồng neon nổi bật",
  },
  {
    id: "emerald-glow",
    name: "Lục Bảo",
    category: "glow",
    value: "0 0 10px #34d399, 0 0 24px #059669",
    textColor: "#ecfdf5",
    description: "Phát sáng xanh ngọc bích tươi tắn",
  },
  {
    id: "white-neon-purple",
    name: "Siêu Neon",
    category: "glow",
    value: "0 0 4px #ffffff, 0 0 12px #c084fc, 0 0 30px #9333ea",
    textColor: "#ffffff",
    description: "Lõi trắng phát quang cực mạnh với viền tím neon",
  },
  {
    id: "shadow-glow-combo",
    name: "Bóng + Tím Glow",
    category: "combo",
    value: "2px 3px 6px rgba(0, 0, 0, 0.9), 0 0 16px #c084fc",
    textColor: "#ffffff",
    description: "Vừa có bóng đen tạo chiều sâu, vừa có hào quang tím",
  },
  {
    id: "fire-combo",
    name: "Lửa Cam Rực",
    category: "combo",
    value: "2px 3px 5px rgba(0, 0, 0, 0.9), 0 0 14px #fb923c, 0 0 26px #ef4444",
    textColor: "#fff7ed",
    description: "Bóng đen kết hợp ánh lửa cam đỏ mãnh liệt",
  },
];

/**
 * Builds a CSS text-shadow string from individual shadow and glow parameters.
 */
export function buildTextShadowString(params: {
  shadowEnabled?: boolean;
  shadowOffsetX?: number;
  shadowOffsetY?: number;
  shadowBlur?: number;
  shadowColor?: string;
  glowEnabled?: boolean;
  glowBlur?: number;
  glowColor?: string;
  glowIntensity?: "soft" | "medium" | "neon";
}): string {
  const parts: string[] = [];

  if (params.shadowEnabled) {
    const ox = params.shadowOffsetX ?? 2;
    const oy = params.shadowOffsetY ?? 3;
    const blur = params.shadowBlur ?? 6;
    const color = params.shadowColor || "rgba(0, 0, 0, 0.85)";
    parts.push(`${ox}px ${oy}px ${blur}px ${color}`);
  }

  if (params.glowEnabled) {
    const blur = Math.max(2, params.glowBlur ?? 14);
    const color = params.glowColor || "#c084fc";
    const intensity = params.glowIntensity || "medium";

    if (intensity === "neon") {
      parts.push(`0 0 4px #ffffff`);
      parts.push(`0 0 ${Math.max(4, Math.round(blur * 0.5))}px ${color}`);
      parts.push(`0 0 ${blur}px ${color}`);
      parts.push(`0 0 ${Math.round(blur * 2)}px ${color}`);
    } else if (intensity === "medium") {
      parts.push(`0 0 ${Math.max(4, Math.round(blur * 0.6))}px ${color}`);
      parts.push(`0 0 ${blur}px ${color}`);
    } else {
      parts.push(`0 0 ${blur}px ${color}`);
    }
  }

  return parts.join(", ");
}

/**
 * Computes the final text-shadow CSS string for any element.
 * Prioritizes custom `textShadow` if defined, else derives from `shadowEnabled` / `glowEnabled`.
 */
export function computeElementTextShadow(element: Partial<CustomElement> | null | undefined): string | undefined {
  if (!element) return undefined;

  if (typeof element.textShadow === "string" && element.textShadow.trim().length > 0) {
    return element.textShadow.trim();
  }

  if (element.shadowEnabled || element.glowEnabled) {
    const res = buildTextShadowString({
      shadowEnabled: element.shadowEnabled,
      shadowOffsetX: element.shadowOffsetX,
      shadowOffsetY: element.shadowOffsetY,
      shadowBlur: element.shadowBlur,
      shadowColor: element.shadowColor,
      glowEnabled: element.glowEnabled,
      glowBlur: element.glowBlur,
      glowColor: element.glowColor,
      glowIntensity: element.glowIntensity,
    });
    return res || undefined;
  }

  return undefined;
}
