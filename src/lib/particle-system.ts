export type ParticleShape = "circle" | "spark" | "petal" | "snow" | "fire" | "star" | "music";
export type ParticlePresetId = "spark" | "petals" | "snow" | "fire" | "stars" | "music";

export interface ParticleConfig {
  count: number;          // Number of particles (1 - 300)
  size: number;           // Size in px (2 - 50)
  speed: number;          // Speed in px/s (0 - 600)
  direction: number;      // Base angle in degrees (0 - 360, 270 = Up, 90 = Down, 0 = Right, 180 = Left)
  spread: number;         // Dispersion angle in degrees (0 - 360)
  gravity: number;        // Gravitational acceleration px/s² (-200 to +300)
  opacity: number;        // Base opacity (0.1 - 1.0)
  lifetime: number;       // Lifespan in seconds (0.5 - 10)
  color: string;          // Main color hex
  colorSecondary?: string;// Secondary/highlight color
  shape?: ParticleShape;  // Visual shape
  preset?: ParticlePresetId;
  glow?: boolean;         // Radial blur/glow effect
}

export interface ComputedParticle {
  id: number;
  x: number;
  y: number;
  size: number;
  opacity: number;
  rotation: number;
  color: string;
  shape: ParticleShape;
  glow?: boolean;
}

export interface ParticlePresetDefinition {
  id: ParticlePresetId;
  name: string;
  icon: string;
  description: string;
  config: ParticleConfig;
}

export const PARTICLE_PRESETS: Record<ParticlePresetId, ParticlePresetDefinition> = {
  spark: {
    id: "spark",
    name: "Spark",
    icon: "✨",
    description: "Tia lửa lấp lánh rực rỡ, tỏa ánh sáng vàng kim sang trọng",
    config: {
      count: 60,
      size: 8,
      speed: 160,
      direction: 270,
      spread: 360,
      gravity: 35,
      opacity: 0.95,
      lifetime: 1.8,
      color: "#fbbf24",
      colorSecondary: "#ffffff",
      shape: "spark",
      preset: "spark",
      glow: true,
    },
  },
  petals: {
    id: "petals",
    name: "Petals",
    icon: "🌸",
    description: "Cánh hoa anh đào sakura bay nhẹ nhàng lãng mạn",
    config: {
      count: 36,
      size: 15,
      speed: 50,
      direction: 110,
      spread: 45,
      gravity: 30,
      opacity: 0.85,
      lifetime: 3.8,
      color: "#f472b6",
      colorSecondary: "#fda4af",
      shape: "petal",
      preset: "petals",
      glow: false,
    },
  },
  snow: {
    id: "snow",
    name: "Snow",
    icon: "❄",
    description: "Bông tuyết trắng rơi êm đềm bồng bềnh trong gió lạnh",
    config: {
      count: 75,
      size: 7,
      speed: 35,
      direction: 90,
      spread: 30,
      gravity: 22,
      opacity: 0.9,
      lifetime: 4.2,
      color: "#e0f2fe",
      colorSecondary: "#ffffff",
      shape: "snow",
      preset: "snow",
      glow: true,
    },
  },
  fire: {
    id: "fire",
    name: "Fire",
    icon: "🔥",
    description: "Tàn lửa than đỏ bốc lên bập bùng với nhiệt độ bốc cao",
    config: {
      count: 85,
      size: 13,
      speed: 140,
      direction: 270,
      spread: 55,
      gravity: -85,
      opacity: 0.85,
      lifetime: 1.5,
      color: "#f97316",
      colorSecondary: "#facc15",
      shape: "fire",
      preset: "fire",
      glow: true,
    },
  },
  stars: {
    id: "stars",
    name: "Stars",
    icon: "💫",
    description: "Ngôi sao huyền ảo lấp lánh như vũ trụ đêm vô tận",
    config: {
      count: 50,
      size: 10,
      speed: 20,
      direction: 0,
      spread: 360,
      gravity: 0,
      opacity: 0.9,
      lifetime: 3.0,
      color: "#c084fc",
      colorSecondary: "#38bdf8",
      shape: "star",
      preset: "stars",
      glow: true,
    },
  },
  music: {
    id: "music",
    name: "Music particles",
    icon: "🎵",
    description: "Nốt nhạc bay bổng theo giai điệu neon rộn ràng",
    config: {
      count: 32,
      size: 18,
      speed: 65,
      direction: 280,
      spread: 80,
      gravity: -25,
      opacity: 0.9,
      lifetime: 2.8,
      color: "#a855f7",
      colorSecondary: "#06b6d4",
      shape: "music",
      preset: "music",
      glow: true,
    },
  },
};

export const PARTICLE_PRESET_LIST: ParticlePresetDefinition[] = Object.values(PARTICLE_PRESETS);

export function createDefaultParticleConfig(preset: ParticlePresetId = "spark"): ParticleConfig {
  const p = PARTICLE_PRESETS[preset] || PARTICLE_PRESETS.spark;
  return { ...p.config };
}

/**
 * Deterministic pseudo-random number generator based on hash
 */
function pseudoHash(seed: number): number {
  const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453123;
  return x - Math.floor(x);
}

/**
 * Fast color hex interpolator
 */
function lerpColor(hexA: string, hexB: string, t: number): string {
  if (!hexA || !hexB) return hexA || hexB || "#ffffff";
  const cleanA = hexA.replace("#", "");
  const cleanB = hexB.replace("#", "");
  if (cleanA.length !== 6 || cleanB.length !== 6) return hexA;

  const rA = parseInt(cleanA.substring(0, 2), 16);
  const gA = parseInt(cleanA.substring(2, 4), 16);
  const bA = parseInt(cleanA.substring(4, 6), 16);

  const rB = parseInt(cleanB.substring(0, 2), 16);
  const gB = parseInt(cleanB.substring(2, 4), 16);
  const bB = parseInt(cleanB.substring(4, 6), 16);

  const r = Math.round(rA + (rB - rA) * t);
  const g = Math.round(gA + (gB - gA) * t);
  const b = Math.round(bA + (bB - bA) * t);

  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

export const PARTICLE_SVG_PATHS: Record<Exclude<ParticleShape, "circle">, string> = {
  // 4-point sparkle diamond star
  spark: "M 12 0 Q 12 12 0 12 Q 12 12 12 24 Q 12 12 24 12 Q 12 12 12 0 Z",
  // Organic Sakura petal
  petal: "M 12 2 C 7 5 3 10 3 15 C 3 19 6 22 10 22 C 11.5 22 12 21 12 21 C 12 21 12.5 22 14 22 C 18 22 21 19 21 15 C 21 10 17 5 12 2 Z",
  // Crisp snowflake
  snow: "M11 2h2v4.2l2.6-1.5 1 1.73-2.6 1.5 3.6 2.1-1 1.73-3.6-2.1V11h4.2l-1.5-2.6 1.73-1 1.5 2.6 2.1-3.6 1.73 1-2.1 3.6H22v2h-4.2l1.5 2.6-1.73 1-1.5-2.6-2.1 3.6-1.73-1 2.1-3.6H13v4.2l2.6-1.5 1 1.73-2.6 1.5 3.6 2.1-1 1.73-3.6-2.1V22h-2v-4.2l-2.6 1.5-1-1.73 2.6-1.5-3.6-2.1 1-1.73 3.6 2.1V13H8.2l1.5 2.6-1.73 1-1.5-2.6-2.1 3.6-1.73-1 2.1-3.6H2v-2h4.2l-1.5-2.6 1.73-1 1.5 2.6-2.1-3.6 1.73-1 2.1 3.6H11V2z",
  // Flame ember
  fire: "M12 2c-.5 2.5-3 5.5-3 8.5a6 6 0 1012 0c0-3-2.5-6-3-8.5-1 3-3 4-3 4s-2-1-3-4z",
  // 5-point star
  star: "M12 2l2.9 6.2 6.8.9-5 4.7 1.3 6.7-6-3.3-6 3.3 1.3-6.7-5-4.7 6.8-.9L12 2z",
  // Music note
  music: "M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z",
};

/**
 * Compute deterministic particle positions at any given time (in milliseconds).
 * Completely pure, thread-safe, and frame-accurate.
 */
export function computeParticles(
  config: ParticleConfig,
  timeMs: number,
  bounds: { width: number; height: number; x?: number; y?: number }
): ComputedParticle[] {
  const count = Math.max(1, Math.min(300, Math.round(config.count || 50)));
  const lifetime = Math.max(0.5, config.lifetime || 2.0);
  const lifeMs = lifetime * 1000;
  const W = Math.max(10, bounds.width);
  const H = Math.max(10, bounds.height);
  const offsetX = bounds.x ?? 0;
  const offsetY = bounds.y ?? 0;
  const shape = config.shape || (config.preset ? PARTICLE_PRESETS[config.preset]?.config.shape : "circle") || "circle";
  const speed = config.speed ?? 80;
  const baseSize = Math.max(2, config.size || 8);
  const baseOpacity = Math.max(0.05, Math.min(1.0, config.opacity ?? 0.9));
  const gravity = config.gravity ?? 0;
  const direction = config.direction ?? 270;
  const spread = config.spread ?? 360;

  const isFalling = gravity > 25 || (direction >= 45 && direction <= 135);
  const isRising = gravity < -25 || (direction >= 225 && direction <= 315);

  const particles: ComputedParticle[] = [];

  for (let i = 0; i < count; i++) {
    const h1 = pseudoHash(i * 13.1 + 1.7);
    const h2 = pseudoHash(i * 37.3 + 9.2);
    const h3 = pseudoHash(i * 71.9 + 23.4);
    const h4 = pseudoHash(i * 109.1 + 51.8);
    const h5 = pseudoHash(i * 157.7 + 73.1);

    // Staggered birth phase so particles are uniformly spread in timeline
    const phase = i / count + (h1 - 0.5) * (0.8 / count);
    const ageMs = ((timeMs + phase * lifeMs) % lifeMs + lifeMs) % lifeMs;
    const tau = ageMs / lifeMs; // normalized 0..1
    const tSec = ageMs / 1000;  // seconds

    // Spawn Origin
    let x0: number;
    let y0: number;

    if (isFalling) {
      x0 = h2 * W;
      y0 = -baseSize * 1.5 - h3 * (H * 0.15);
    } else if (isRising) {
      x0 = h2 * W;
      y0 = H + baseSize * 1.5 + h3 * (H * 0.15);
    } else {
      // Emitter distributed or radial burst
      if (config.preset === "spark") {
        // Sparkle burst can originate from central / distributed area
        x0 = W * 0.5 + (h2 - 0.5) * (W * 0.7);
        y0 = H * 0.5 + (h3 - 0.5) * (H * 0.6);
      } else {
        x0 = h2 * W;
        y0 = h3 * H;
      }
    }

    // Direction with spread
    const angleDeg = direction + (h3 - 0.5) * spread;
    const rad = (angleDeg * Math.PI) / 180;
    const v = speed * (0.65 + 0.7 * h4);

    const vx = Math.cos(rad) * v;
    const vy = Math.sin(rad) * v;

    // Sway / organic undulating motion (especially for petals, snow, music)
    let sway = 0;
    if (shape === "petal" || shape === "snow" || shape === "music") {
      const freq = 2.5 + h1 * 3.0;
      const amp = 14 * (0.5 + h2 * 0.8);
      sway = Math.sin(tSec * freq + h3 * 6.28) * amp;
    }

    let px = x0 + vx * tSec + sway;
    let py = y0 + vy * tSec + 0.5 * gravity * (tSec * tSec);

    // Wrap horizontally if drift carries beyond canvas boundary
    if (px < -baseSize * 2) px = (px % W) + W;
    if (px > W + baseSize * 2) px = px % W;

    // Wrap vertically for continuous ambient drift
    if (isFalling && py > H + baseSize * 2) {
      py = (py % (H + baseSize * 4)) - baseSize * 2;
    } else if (isRising && py < -baseSize * 2) {
      py = H + baseSize * 2 - ((Math.abs(py) + H) % (H + baseSize * 4));
    }

    // Opacity envelope: smooth fade in at beginning, sustained, smooth fade out
    let envelope = 1;
    if (tau < 0.15) {
      envelope = tau / 0.15;
    } else if (tau > 0.75) {
      envelope = (1 - tau) / 0.25;
    }

    // Twinkling / sparkle pulsation for stars and sparks
    let twinkle = 1;
    if (shape === "spark" || shape === "star") {
      twinkle = 0.7 + 0.35 * Math.sin(tSec * (12 + h1 * 8) + h2 * 6.28);
    } else if (shape === "fire") {
      twinkle = 0.8 + 0.25 * Math.sin(tSec * 16 + h4 * 6.28);
    }

    const currentOpacity = Math.max(0, Math.min(1, baseOpacity * envelope * twinkle));

    // Size calculation: particles can scale over lifetime
    let sizeMultiplier = 0.7 + 0.6 * h5;
    if (shape === "fire") {
      // Fire embers shrink as they rise and cool
      sizeMultiplier *= Math.max(0.3, 1.2 - tau * 0.7);
    } else if (shape === "spark") {
      // Sparks flash bright and small
      sizeMultiplier *= Math.sin(tau * Math.PI);
    }

    const currentSize = Math.max(2, baseSize * sizeMultiplier);

    // Rotation over lifetime
    const rotSpeed = (h4 - 0.5) * 160;
    const rotation = (h2 * 360 + tSec * rotSpeed) % 360;

    // Color interpolation
    let color = config.color;
    if (config.colorSecondary && config.colorSecondary !== config.color) {
      // Alternate or gradient over lifetime
      const colorT = (h1 + tau * 0.5) % 1;
      color = lerpColor(config.color, config.colorSecondary, colorT);
    }

    particles.push({
      id: i,
      x: Math.round((offsetX + px) * 10) / 10,
      y: Math.round((offsetY + py) * 10) / 10,
      size: Math.round(currentSize * 10) / 10,
      opacity: Math.round(currentOpacity * 100) / 100,
      rotation: Math.round(rotation),
      color,
      shape,
      glow: config.glow ?? true,
    });
  }

  return particles;
}

/**
 * Render particles into Satori-compatible VNodes for server-side SVG/PNG/GIF generation
 */
export function renderParticlesToSatoriVNodes(
  particles: ComputedParticle[],
  bounds: { width: number; height: number }
): any[] {
  return particles.map((p) => {
    const s = p.size;
    const half = s / 2;
    const glowShadow = p.glow ? `0 0 ${Math.max(4, Math.round(s * 0.8))}px ${p.color}` : undefined;

    const baseStyle: Record<string, any> = {
      position: "absolute",
      left: `${p.x - half}px`,
      top: `${p.y - half}px`,
      width: `${s}px`,
      height: `${s}px`,
      opacity: p.opacity,
      transform: p.rotation !== 0 ? `rotate(${p.rotation}deg)` : undefined,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      pointerEvents: "none",
    };

    if (p.shape === "circle") {
      return {
        type: "div",
        props: {
          style: {
            ...baseStyle,
            backgroundColor: p.color,
            borderRadius: "50%",
            boxShadow: glowShadow,
          },
        },
      };
    }

    // Vector shapes
    const svgPath = PARTICLE_SVG_PATHS[p.shape] || PARTICLE_SVG_PATHS.spark;

    return {
      type: "div",
      props: {
        style: baseStyle,
        children: [
          {
            type: "svg",
            props: {
              viewBox: "0 0 24 24",
              width: `${s}px`,
              height: `${s}px`,
              style: {
                width: "100%",
                height: "100%",
                filter: glowShadow ? `drop-shadow(0 0 ${Math.max(2, Math.round(s * 0.4))}px ${p.color})` : undefined,
              },
              children: [
                {
                  type: "path",
                  props: {
                    d: svgPath,
                    fill: p.color,
                  },
                },
              ],
            },
          },
        ],
      },
    };
  });
}

/**
 * Draw particles to an HTML5 2D Canvas context for high-performance 60fps browser rendering
 */
export function drawParticlesToCanvas(
  ctx: CanvasRenderingContext2D,
  particles: ComputedParticle[],
  scale = 1
): void {
  ctx.save();
  for (const p of particles) {
    if (p.opacity <= 0.01) continue;

    const x = p.x * scale;
    const y = p.y * scale;
    const size = p.size * scale;
    const half = size / 2;

    ctx.save();
    ctx.globalAlpha = p.opacity;
    ctx.translate(x, y);

    if (p.rotation !== 0) {
      ctx.rotate((p.rotation * Math.PI) / 180);
    }

    if (p.glow) {
      ctx.shadowColor = p.color;
      ctx.shadowBlur = Math.max(3, size * 0.7);
    }

    ctx.fillStyle = p.color;

    if (p.shape === "circle") {
      ctx.beginPath();
      ctx.arc(0, 0, half, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // Draw SVG path via Path2D if available or fallback
      const pathData = PARTICLE_SVG_PATHS[p.shape] || PARTICLE_SVG_PATHS.spark;
      try {
        if (typeof Path2D !== "undefined") {
          const path2d = new Path2D(pathData);
          // Scale from 24x24 viewBox to size
          const scaleFactor = size / 24;
          ctx.translate(-half, -half);
          ctx.scale(scaleFactor, scaleFactor);
          ctx.fill(path2d);
        } else {
          ctx.beginPath();
          ctx.arc(0, 0, half, 0, Math.PI * 2);
          ctx.fill();
        }
      } catch {
        ctx.beginPath();
        ctx.arc(0, 0, half, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.restore();
  }
  ctx.restore();
}
