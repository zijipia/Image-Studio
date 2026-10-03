import fs from "fs";
import path from "path";
import satori from "satori";
import sharp from "sharp";
import { loadSatoriAdditionalAsset } from "./unicode-fonts.js";
import { computeElementTextShadow } from "./text-effects.js";
import { computeParticles, renderParticlesToSatoriVNodes, createDefaultParticleConfig } from "./particle-system.js";
import type {
  SongResult,
  ProfileData,
  LeaderboardData,
  QuoteData,
  CustomCanvasData,
  AnyGenerateRequest,
} from "./types.js";
import {
  CANVAS_WIDTH,
  CARD_WIDTH,
  CARD_HEIGHT,
  ROW_GAP,
  COL_GAP,
  PADDING_X,
  PADDING_TOP,
  PADDING_BOTTOM,
  HEADER_HEIGHT,
  HEADER_GAP,
  calculateHeight,
  PROFILE_WIDTH,
  PROFILE_HEIGHT,
  LEADERBOARD_WIDTH,
  calculateLeaderboardHeight,
  QUOTE_WIDTH,
  QUOTE_HEIGHT,
} from "./constants.js";

export {
  CANVAS_WIDTH,
  CARD_WIDTH,
  CARD_HEIGHT,
  ROW_GAP,
  COL_GAP,
  PADDING_X,
  PADDING_TOP,
  PADDING_BOTTOM,
  HEADER_HEIGHT,
  HEADER_GAP,
  calculateHeight,
};

// In-memory avatar cache to minimize duplicate network calls
const avatarCache = new Map<string, string>();

const FALLBACK_AVATAR =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 24 24" fill="none" stroke="%23c084fc" stroke-width="2"><circle cx="12" cy="12" r="10" fill="%232e1065"/><path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3" fill="%23c084fc"/><circle cx="18" cy="16" r="3" fill="%23c084fc"/></svg>';

export async function imageToDataUri(url: string, targetSize = 96): Promise<string> {
  if (!url || typeof url !== "string" || (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("data:"))) {
    return FALLBACK_AVATAR;
  }

  if (url.startsWith("data:")) {
    return url;
  }

  const cacheKey = `${url}_${targetSize}`;
  if (avatarCache.has(cacheKey)) {
    return avatarCache.get(cacheKey)!;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        Accept: "image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8",
        "User-Agent": "Mozilla/5.0 (compatible; ImageStudioBot/1.0)",
      },
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      avatarCache.set(cacheKey, FALLBACK_AVATAR);
      return FALLBACK_AVATAR;
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const optimized = await sharp(buffer)
      .resize(targetSize, targetSize, { fit: "cover" })
      .jpeg({ quality: 85 })
      .toBuffer();

    const dataUri = `data:image/jpeg;base64,${optimized.toString("base64")}`;
    avatarCache.set(cacheKey, dataUri);
    return dataUri;
  } catch (error) {
    console.warn(`[image-generator] Failed to fetch avatar ${url}:`, error);
    avatarCache.set(cacheKey, FALLBACK_AVATAR);
    return FALLBACK_AVATAR;
  }
}

// Cache font buffers
let cachedFonts: Array<{
  name: string;
  data: Buffer;
  weight: 400 | 500;
  style: "normal";
}> | null = null;

function loadFonts() {
  if (cachedFonts) return cachedFonts;

  const fontDir = path.resolve(process.cwd(), "public/fonts");
  // Keep the API usable in deployments where only the bundled font assets exist.
  // Roboto-Regular.ttf is not part of this project; use the available Roboto medium
  // face as the Latin fallback instead of failing the whole function with ENOENT.
  const regularLatinPath = path.join(fontDir, "Roboto-Regular.ttf");
  const regularLatin = fs.readFileSync(
    fs.existsSync(regularLatinPath)
      ? regularLatinPath
      : path.join(fontDir, "Roboto-Medium-Latin.ttf")
  );
  const regularVn = fs.readFileSync(path.join(fontDir, "Roboto-Vietnamese.ttf"));
  const mediumLatin = fs.readFileSync(path.join(fontDir, "Roboto-Medium-Latin.ttf"));
  const mediumVn = fs.readFileSync(path.join(fontDir, "Roboto-Medium-Vn.ttf"));

  cachedFonts = [
    { name: "Roboto", data: regularLatin, weight: 400, style: "normal" },
    { name: "Roboto", data: regularVn, weight: 400, style: "normal" },
    { name: "Roboto", data: mediumLatin, weight: 500, style: "normal" },
    { name: "Roboto", data: mediumVn, weight: 500, style: "normal" },
  ];

  return cachedFonts;
}

/* =========================================================================
   1. SONG SEARCH CARD GENERATION
   ========================================================================= */

function renderVideoListItem(song: (SongResult & { avatarUri: string }) | null) {
  if (!song) {
    return {
      type: "div",
      props: {
        style: { width: "543px", height: "76px" },
      },
    };
  }

  const subtitle = song.author
    ? `${song.author} · ${song.views || song.time}`
    : `${song.source} · ${song.views || song.time}`;

  return {
    type: "div",
    props: {
      style: {
        width: "543px",
        height: "76px",
        display: "flex",
        alignItems: "center",
        padding: "0 12px",
        background: "rgba(18, 22, 38, 0.72)",
        borderRadius: "12px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "24px",
              color: "rgba(255, 255, 255, 0.4)",
              fontSize: "14px",
              fontWeight: 600,
              textAlign: "center",
              marginRight: "8px",
              flexShrink: 0,
            },
            children: String(song.index),
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "relative",
              width: "114px",
              height: "64px",
              borderRadius: "8px",
              overflow: "hidden",
              marginRight: "14px",
              flexShrink: 0,
              display: "flex",
            },
            children: [
              {
                type: "img",
                props: {
                  src: song.avatarUri,
                  width: 114,
                  height: 64,
                  style: {
                    width: "114px",
                    height: "64px",
                    objectFit: "cover",
                  },
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    bottom: "3px",
                    right: "3px",
                    background: "rgba(0, 0, 0, 0.85)",
                    color: "#ffffff",
                    fontSize: "11px",
                    fontWeight: 600,
                    padding: "1px 5px",
                    borderRadius: "4px",
                  },
                  children: song.time || "03:00",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              overflow: "hidden",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "365px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    color: "#ffffff",
                    fontSize: "16px",
                    fontWeight: 500,
                    lineHeight: "22px",
                  },
                  children: song.displayName,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    marginTop: "4px",
                    color: "#818cf8",
                    fontSize: "13px",
                    lineHeight: "16px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                  },
                  children: subtitle,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function renderGridCardItem(song: (SongResult & { avatarUri: string }) | null, cols = 4) {
  const cardW = cols === 5 ? "206px" : "261px";
  const cardH = cols === 5 ? "245px" : "275px";
  const imgH = cols === 5 ? "175px" : "210px";
  const playSize = cols === 5 ? "32px" : "38px";

  if (!song) {
    return {
      type: "div",
      props: {
        style: { width: cardW, height: cardH },
      },
    };
  }

  const subtitle = song.author
    ? `by ${song.author} · ${song.views || song.time}`
    : `by ${song.source} · ${song.views || song.time}`;

  return {
    type: "div",
    props: {
      style: {
        width: cardW,
        height: cardH,
        display: "flex",
        flexDirection: "column",
        padding: "6px",
        background: "rgba(18, 22, 38, 0.65)",
        borderRadius: "16px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "relative",
              width: "100%",
              height: imgH,
              borderRadius: "14px",
              overflow: "hidden",
              display: "flex",
            },
            children: [
              {
                type: "img",
                props: {
                  src: song.avatarUri,
                  width: cols === 5 ? 206 : 261,
                  height: cols === 5 ? 175 : 210,
                  style: {
                    width: "100%",
                    height: imgH,
                    objectFit: "cover",
                  },
                },
              },
              // Track index badge in top-left corner
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    top: "8px",
                    left: "8px",
                    width: cols === 5 ? "26px" : "30px",
                    height: cols === 5 ? "26px" : "30px",
                    borderRadius: "999px",
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1.5px solid rgba(255, 255, 255, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: cols === 5 ? "12px" : "13px",
                    fontWeight: 700,
                  },
                  children: String(song.index),
                },
              },
              // Play button badge in bottom right corner (Image 1 style)
              {
                type: "div",
                props: {
                  style: {
                    position: "absolute",
                    bottom: "8px",
                    right: "8px",
                    width: playSize,
                    height: playSize,
                    borderRadius: "999px",
                    background: "rgba(0, 0, 0, 0.8)",
                    border: "1.5px solid rgba(255, 255, 255, 0.3)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#ffffff",
                    fontSize: cols === 5 ? "12px" : "14px",
                  },
                  children: "▶",
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              marginTop: "10px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              color: "#ffffff",
              fontSize: cols === 5 ? "14px" : "16px",
              fontWeight: 600,
              lineHeight: "22px",
            },
            children: song.displayName,
          },
        },
        {
          type: "div",
          props: {
            style: {
              marginTop: "3px",
              overflow: "hidden",
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              color: "#818cf8",
              fontSize: cols === 5 ? "11px" : "13px",
              lineHeight: "16px",
            },
            children: subtitle,
          },
        },
      ],
    },
  };
}

function renderSongCard(song: (SongResult & { avatarUri: string }) | null) {
  if (!song) {
    return {
      type: "div",
      props: {
        style: { width: `${CARD_WIDTH}px`, height: `${CARD_HEIGHT}px` },
      },
    };
  }

  return {
    type: "div",
    props: {
      style: {
        width: `${CARD_WIDTH}px`,
        height: `${CARD_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        padding: "0 14px",
        background: "rgba(45, 44, 70, 0.78)",
        borderRadius: "12px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "34px",
              height: "34px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              marginRight: "14px",
              borderRadius: "999px",
              background: "rgba(255, 255, 255, 0.15)",
              color: "#ffffff",
              fontSize: "18px",
              fontWeight: 500,
            },
            children: String(song.index),
          },
        },
        {
          type: "img",
          props: {
            src: song.avatarUri,
            width: 48,
            height: 48,
            style: {
              width: "48px",
              height: "48px",
              flexShrink: 0,
              marginRight: "16px",
              borderRadius: "999px",
              objectFit: "cover",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              flex: 1,
              overflow: "hidden",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "410px",
                    overflow: "hidden",
                    whiteSpace: "nowrap",
                    textOverflow: "ellipsis",
                    color: "#ffffff",
                    fontSize: "19px",
                    fontWeight: 500,
                    lineHeight: "24px",
                  },
                  children: song.displayName,
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    marginTop: "4px",
                    color: "rgba(255, 255, 255, 0.65)",
                    fontSize: "15px",
                    lineHeight: "18px",
                  },
                  children: `${song.time} - ${song.source}`,
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function generateSongImage(request: {
  title: string;
  items: SongResult[];
  layout?: "auto" | "list" | "grid" | "classic";
}): Promise<{ png: Buffer; height: number }> {
  const songs = request.items || [];
  if (songs.length === 0) {
    throw new Error("No songs provided in request");
  }

  // Automatic adaptive layout: <= 10 tracks -> Large card grid, > 10 tracks -> 2-column video list
  const effectiveLayout: "list" | "grid" | "classic" =
    request.layout && request.layout !== "auto"
      ? request.layout
      : songs.length <= 10
      ? "grid"
      : "list";

  const height = calculateHeight(songs.length, effectiveLayout);

  const processedSongs = await Promise.all(
    songs.map(async (song, index) => {
      const avatarUri = await imageToDataUri(song.avatar, effectiveLayout === "grid" ? 300 : 120);
      return {
        ...song,
        index: song.index ?? index + 1,
        avatarUri,
      };
    })
  );

  let contentRows: any[];

  if (effectiveLayout === "grid") {
    // Large cards: 4 columns for <= 8 tracks, 5 columns for 9-10 tracks
    const cols = processedSongs.length <= 8 ? 4 : 5;
    const groupCount = Math.ceil(processedSongs.length / cols);
    contentRows = Array.from({ length: groupCount }, (_, rIdx) => {
      const start = rIdx * cols;
      const rowItems = Array.from({ length: cols }, (__, cIdx) => processedSongs[start + cIdx] || null);
      return {
        type: "div",
        props: {
          style: {
            display: "flex",
            flexDirection: "row",
            gap: "16px",
          },
          children: rowItems.map((item) => renderGridCardItem(item, cols)),
        },
      };
    });
  } else {
    // Dual column list (2 columns x N rows, up to 20 songs = 10 rows)
    const half = Math.ceil(processedSongs.length / 2);
    const left = processedSongs.slice(0, half);
    const right = processedSongs.slice(half);
    const rows = Array.from({ length: half }, (_, i) => [left[i] || null, right[i] || null]);

    contentRows = rows.map(([a, b]) => ({
      type: "div",
      props: {
        style: {
          display: "flex",
          flexDirection: "row",
          gap: `${COL_GAP}px`,
        },
        children: [
          effectiveLayout === "classic" ? renderSongCard(a) : renderVideoListItem(a),
          effectiveLayout === "classic" ? renderSongCard(b) : renderVideoListItem(b),
        ],
      },
    }));
  }

  const element: any = {
    type: "div",
    props: {
      style: {
        width: `${CANVAS_WIDTH}px`,
        height: `${height}px`,
        display: "flex",
        flexDirection: "column",
        paddingTop: `${PADDING_TOP}px`,
        paddingBottom: `${PADDING_BOTTOM}px`,
        paddingLeft: `${PADDING_X}px`,
        paddingRight: `${PADDING_X}px`,
        background:
          "radial-gradient(circle at 90% 100%, #1e1b4b 0%, transparent 60%), linear-gradient(135deg, #070913 0%, #0d1224 50%, #0a0e1c 100%)",
        borderRadius: "16px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              height: `${HEADER_HEIGHT}px`,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    color: "#ffffff",
                    fontSize: "26px",
                    fontWeight: 500,
                    lineHeight: "32px",
                  },
                  children: request.title || "Song Search",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: "60px",
                    height: "2px",
                    marginTop: "8px",
                    background: "rgba(255, 255, 255, 0.4)",
                    borderRadius: "999px",
                  },
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              gap: effectiveLayout === "grid" ? "16px" : `${ROW_GAP}px`,
              marginTop: `${HEADER_GAP}px`,
            },
            children: contentRows,
          },
        },
      ],
    },
  };

  if ((request as any).particleConfig) {
    const particles = computeParticles((request as any).particleConfig, 0, { width: CANVAS_WIDTH, height });
    const pNodes = renderParticlesToSatoriVNodes(particles, { width: CANVAS_WIDTH, height });
    element.props.children.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          position: "absolute",
          inset: 0,
          width: `${CANVAS_WIDTH}px`,
          height: `${height}px`,
          pointerEvents: "none",
          zIndex: 999,
        },
        children: pNodes,
      },
    });
  }

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: CANVAS_WIDTH,
    height,
    fonts,
    loadAdditionalAsset: loadSatoriAdditionalAsset,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height };
}

/* =========================================================================
   2. PROFILE RANK CARD GENERATION (4 DISTINCT THEMES)
   ========================================================================= */

function renderProfileRubyPoly(data: ProfileData, avatarUri: string, percent: number) {
  return {
    type: "div",
    props: {
      style: {
        width: `${PROFILE_WIDTH}px`,
        height: `${PROFILE_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        padding: "0 35px",
        borderRadius: "20px",
        background: "linear-gradient(135deg, #090210 0%, #1a031e 30%, #3d0728 65%, #630c33 100%)",
        border: "1px solid rgba(244, 63, 94, 0.35)",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              top: "-50px",
              right: "-50px",
              width: "450px",
              height: "450px",
              borderRadius: "40px",
              transform: "rotate(45deg)",
              background: "linear-gradient(45deg, rgba(225, 29, 72, 0.25), rgba(159, 18, 57, 0.05))",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "absolute",
              bottom: "-80px",
              left: "250px",
              width: "350px",
              height: "350px",
              borderRadius: "30px",
              transform: "rotate(25deg)",
              background: "linear-gradient(135deg, rgba(136, 19, 55, 0.3), transparent)",
            },
          },
        },
        {
          type: "div",
          props: {
            style: {
              position: "relative",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "150px",
                    height: "150px",
                    borderRadius: "999px",
                    padding: "4px",
                    background: "linear-gradient(135deg, #f43f5e, #fda4af, #f43f5e)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 10px 25px rgba(0, 0, 0, 0.5)",
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: avatarUri,
                        width: 142,
                        height: 142,
                        style: {
                          width: "142px",
                          height: "142px",
                          borderRadius: "999px",
                          objectFit: "cover",
                        },
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    marginTop: "-14px",
                    borderRadius: "999px",
                    background: "#e11d48",
                    border: "1px solid rgba(254, 205, 211, 0.5)",
                    padding: "2px 10px",
                    fontSize: "11px",
                    fontWeight: 700,
                    color: "#ffffff",
                    fontFamily: "monospace",
                    display: "flex",
                  },
                  children: `Lv. ${data.level ?? 1}`,
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              marginLeft: "35px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              zIndex: 2,
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { display: "flex", alignItems: "center", gap: "10px" },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      fontSize: "34px",
                                      fontWeight: 700,
                                      color: "#f43f5e",
                                      lineHeight: "40px",
                                    },
                                    children: data.username || "__ziji",
                                  },
                                },
                                ...(data.badge
                                  ? [
                                      {
                                        type: "div",
                                        props: {
                                          style: {
                                            padding: "3px 10px",
                                            borderRadius: "999px",
                                            background: "rgba(244, 63, 94, 0.15)",
                                            border: "1px solid rgba(244, 63, 94, 0.4)",
                                            color: "#fb7185",
                                            fontSize: "11px",
                                            fontWeight: 700,
                                            letterSpacing: "0.5px",
                                            display: "flex",
                                          },
                                          children: data.badge,
                                        },
                                      },
                                    ]
                                  : []),
                              ],
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "19px",
                                color: "#a1a1aa",
                                marginTop: "2px",
                                lineHeight: "25px",
                              },
                              children: `${data.title ? `${data.title} · ` : ""}${data.balance || "0 xu"}`,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          padding: "5px 14px",
                          borderRadius: "10px",
                          background: "rgba(244, 63, 94, 0.18)",
                          border: "1px solid rgba(244, 63, 94, 0.45)",
                          color: "#fb7185",
                          fontSize: "16px",
                          fontWeight: 700,
                          display: "flex",
                        },
                        children: data.rank ?? "#1",
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: "660px",
                    height: "26px",
                    borderRadius: "999px",
                    background: "#3e4147",
                    marginTop: "16px",
                    overflow: "hidden",
                    display: "flex",
                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.5)",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: `${Math.max(2, percent)}%`,
                          height: "100%",
                          borderRadius: "999px",
                          background: "linear-gradient(90deg, #f43f5e, #fb7185)",
                        },
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "row",
                    gap: "50px",
                    marginTop: "16px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#fb7185",
                          letterSpacing: "1px",
                          display: "flex",
                        },
                        children: `⚔️ LEVEL ${data.level ?? 1}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#fb7185",
                          letterSpacing: "1px",
                          display: "flex",
                        },
                        children: `⚡ XP: ${data.currentXp ?? 0}/${data.requiredXp ?? 100} (${percent}%)`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "18px",
                          fontWeight: 600,
                          color: "#fb7185",
                          letterSpacing: "1px",
                          display: "flex",
                        },
                        children: `🏆 RANK: ${data.rank ?? "#1"}`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function renderProfileCyberNeon(data: ProfileData, avatarUri: string, percent: number) {
  return {
    type: "div",
    props: {
      style: {
        width: `${PROFILE_WIDTH}px`,
        height: `${PROFILE_HEIGHT}px`,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        padding: "16px 24px",
        borderRadius: "16px",
        background:
          "radial-gradient(circle at 85% 15%, rgba(192, 132, 252, 0.2) 0%, transparent 60%), linear-gradient(135deg, #050816 0%, #0c1024 50%, #160e29 100%)",
        border: "2px solid rgba(56, 189, 248, 0.65)",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Cyber Top Status Bar
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderBottom: "1px solid rgba(56, 189, 248, 0.35)",
              paddingBottom: "8px",
              fontSize: "12px",
              fontFamily: "monospace",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#38bdf8",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "8px",
                          height: "8px",
                          borderRadius: "999px",
                          background: "#38bdf8",
                        },
                      },
                    },
                    {
                      type: "span",
                      props: { children: "CYBER_ID // NETWORK_RANK_STATUS" },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    gap: "16px",
                    fontSize: "11px",
                  },
                  children: [
                    {
                      type: "span",
                      props: {
                        style: { color: "#e879f9" },
                        children: `NET_WORTH: ${data.balance || "0 xu"}`,
                      },
                    },
                    {
                      type: "span",
                      props: {
                        style: { color: "#94a3b8" },
                        children: "SYS_ID: #4092-A",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Main 3-Zone Body
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "24px",
              padding: "8px 0",
            },
            children: [
              // Left: Square Tech Avatar
              {
                type: "div",
                props: {
                  style: {
                    position: "relative",
                    width: "128px",
                    height: "128px",
                    borderRadius: "14px",
                    border: "2px solid #38bdf8",
                    padding: "4px",
                    background: "rgba(0, 0, 0, 0.6)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: avatarUri,
                        width: 118,
                        height: 118,
                        style: {
                          width: "118px",
                          height: "118px",
                          borderRadius: "10px",
                          objectFit: "cover",
                        },
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "absolute",
                          bottom: "-6px",
                          borderRadius: "4px",
                          background: "#38bdf8",
                          padding: "2px 8px",
                          fontSize: "9px",
                          fontWeight: 700,
                          color: "#000000",
                          fontFamily: "monospace",
                          letterSpacing: "0.5px",
                          display: "flex",
                        },
                        children: `SYNCED // LVL ${data.level ?? 1}`,
                      },
                    },
                  ],
                },
              },
              // Center: Info & Segmented XP Bar
              {
                type: "div",
                props: {
                  style: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    gap: "6px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "30px",
                                fontWeight: 700,
                                color: "#67e8f9",
                                lineHeight: "36px",
                              },
                              children: data.username || "Neon_Kenshi",
                            },
                          },
                          ...(data.badge
                            ? [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      padding: "2px 8px",
                                      borderRadius: "4px",
                                      background: "rgba(56, 189, 248, 0.2)",
                                      border: "1px solid rgba(56, 189, 248, 0.5)",
                                      color: "#38bdf8",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      fontFamily: "monospace",
                                      display: "flex",
                                    },
                                    children: data.badge,
                                  },
                                },
                              ]
                            : []),
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "12px",
                          color: "#f0abfc",
                          fontFamily: "monospace",
                        },
                        children: `${data.title ? `${data.title} // ` : ""}STATUS: COMBAT_ACTIVE`,
                      },
                    },
                    // Segmented Laser XP Bar
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          gap: "4px",
                          marginTop: "4px",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "11px",
                                fontFamily: "monospace",
                                color: "rgba(56, 189, 248, 0.9)",
                              },
                              children: [
                                {
                                  type: "span",
                                  props: { children: `EXP_BUFFER: ${data.currentXp ?? 0} / ${data.requiredXp ?? 100}` },
                                },
                                {
                                  type: "span",
                                  props: { children: `${percent}% INTEGRITY` },
                                },
                              ],
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                width: "500px",
                                height: "20px",
                                borderRadius: "4px",
                                background: "rgba(0, 0, 0, 0.7)",
                                border: "1px solid rgba(56, 189, 248, 0.45)",
                                padding: "2px",
                                display: "flex",
                                gap: "3px",
                              },
                              children: Array.from({ length: 20 }, (_, idx) => {
                                const active = (idx + 1) * 5 <= percent;
                                return {
                                  type: "div",
                                  props: {
                                    key: idx,
                                    style: {
                                      flex: 1,
                                      height: "100%",
                                      borderRadius: "2px",
                                      background: active
                                        ? "linear-gradient(180deg, #38bdf8 0%, #e879f9 100%)"
                                        : "rgba(255, 255, 255, 0.08)",
                                    },
                                  },
                                };
                              }),
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Right: Holographic Rank Box
              {
                type: "div",
                props: {
                  style: {
                    width: "128px",
                    height: "120px",
                    borderRadius: "14px",
                    border: "1px solid rgba(232, 121, 249, 0.45)",
                    background: "rgba(74, 4, 78, 0.25)",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { fontSize: "10px", color: "#f0abfc", fontFamily: "monospace" },
                        children: "SERVER RANK",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "32px",
                          fontWeight: 700,
                          color: "#e879f9",
                          lineHeight: "36px",
                          margin: "2px 0",
                          fontFamily: "monospace",
                        },
                        children: data.rank ?? "#1",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { fontSize: "10px", fontWeight: 700, color: "#38bdf8", fontFamily: "monospace" },
                        children: "TIER: ELITE_S",
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Bottom Telemetry Bar
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              borderTop: "1px solid rgba(56, 189, 248, 0.35)",
              paddingTop: "6px",
              fontSize: "10px",
              fontFamily: "monospace",
              color: "rgba(56, 189, 248, 0.75)",
            },
            children: [
              {
                type: "span",
                props: { children: "SEC_LAYER: AES-256 · ENCRYPTED LINK" },
              },
              {
                type: "span",
                props: { children: "IMAGE_STUDIO // CYBERNETIC_RENDER_CORE" },
              },
            ],
          },
        },
      ],
    },
  };
}

function renderProfileGlassMinimal(data: ProfileData, avatarUri: string, percent: number) {
  return {
    type: "div",
    props: {
      style: {
        width: `${PROFILE_WIDTH}px`,
        height: `${PROFILE_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        padding: "24px 36px",
        borderRadius: "24px",
        background:
          "radial-gradient(circle at 10% 20%, rgba(16, 185, 129, 0.25) 0%, transparent 60%), linear-gradient(135deg, #021a14 0%, #06241c 50%, #0a1b24 100%)",
        border: "1px solid rgba(52, 211, 153, 0.4)",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Left Avatar
        {
          type: "div",
          props: {
            style: {
              width: "138px",
              height: "138px",
              borderRadius: "999px",
              padding: "3px",
              background: "linear-gradient(135deg, #34d399, #2dd4bf, #ffffff)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            },
            children: [
              {
                type: "img",
                props: {
                  src: avatarUri,
                  width: 132,
                  height: 132,
                  style: {
                    width: "132px",
                    height: "132px",
                    borderRadius: "999px",
                    objectFit: "cover",
                  },
                },
              },
            ],
          },
        },
        // Right Content Area
        {
          type: "div",
          props: {
            style: {
              marginLeft: "32px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "190px",
            },
            children: [
              // Top: Title & Name
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                fontSize: "12px",
                                fontWeight: 600,
                                color: "#34d399",
                                letterSpacing: "1px",
                              },
                              children: (data.title || "Aura Champion · Verified Player").toUpperCase(),
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { display: "flex", alignItems: "center", gap: "12px", marginTop: "2px" },
                              children: [
                                {
                                  type: "div",
                                  props: {
                                    style: { fontSize: "32px", fontWeight: 700, color: "#ffffff", lineHeight: "38px" },
                                    children: data.username || "AetherLord",
                                  },
                                },
                                ...(data.badge
                                  ? [
                                      {
                                        type: "div",
                                        props: {
                                          style: {
                                            padding: "3px 10px",
                                            borderRadius: "999px",
                                            background: "rgba(16, 185, 129, 0.2)",
                                            border: "1px solid rgba(52, 211, 153, 0.4)",
                                            color: "#a7f3d0",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            display: "flex",
                                          },
                                          children: data.badge,
                                        },
                                      },
                                    ]
                                  : []),
                              ],
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column", alignItems: "flex-end" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { fontSize: "11px", color: "rgba(167, 243, 208, 0.8)", letterSpacing: "1px" },
                              children: "TREASURY BALANCE",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { fontSize: "20px", fontWeight: 700, color: "#34d399", fontFamily: "monospace" },
                              children: data.balance || "0 xu",
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Middle: Sleek Pill XP Track
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: "6px" },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#cbd5e1" },
                        children: [
                          {
                            type: "span",
                            props: { children: "Experience Progression" },
                          },
                          {
                            type: "span",
                            props: {
                              style: { color: "#6ee7b7", fontWeight: 600, fontFamily: "monospace" },
                              children: `${data.currentXp ?? 0} / ${data.requiredXp ?? 100} XP (${percent}%)`,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "100%",
                          height: "12px",
                          borderRadius: "999px",
                          background: "rgba(0, 0, 0, 0.5)",
                          border: "1px solid rgba(52, 211, 153, 0.25)",
                          padding: "1px",
                          display: "flex",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                width: `${Math.max(2, percent)}%`,
                                height: "100%",
                                borderRadius: "999px",
                                background: "linear-gradient(90deg, #10b981, #2dd4bf, #6ee7b7)",
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Bottom: 4 Minimalist Metric Columns
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                    paddingTop: "8px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          { type: "div", props: { style: { fontSize: "11px", color: "#94a3b8" }, children: "Current Level" } },
                          { type: "div", props: { style: { fontSize: "17px", fontWeight: 700, color: "#ffffff", fontFamily: "monospace" }, children: `Lv.${data.level ?? 1}` } },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          { type: "div", props: { style: { fontSize: "11px", color: "#94a3b8" }, children: "Server Rank" } },
                          { type: "div", props: { style: { fontSize: "17px", fontWeight: 700, color: "#34d399", fontFamily: "monospace" }, children: `${data.rank ?? "#1"} Elite` } },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          { type: "div", props: { style: { fontSize: "11px", color: "#94a3b8" }, children: "Completion" } },
                          { type: "div", props: { style: { fontSize: "17px", fontWeight: 700, color: "#2dd4bf", fontFamily: "monospace" }, children: `${percent}% XP` } },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", flexDirection: "column" },
                        children: [
                          { type: "div", props: { style: { fontSize: "11px", color: "#94a3b8" }, children: "Prestige Status" } },
                          { type: "div", props: { style: { fontSize: "17px", fontWeight: 700, color: "#6ee7b7", fontFamily: "monospace" }, children: "Tier X Legend" } },
                        ],
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

function renderProfileGoldLegend(data: ProfileData, avatarUri: string, percent: number) {
  return {
    type: "div",
    props: {
      style: {
        width: `${PROFILE_WIDTH}px`,
        height: `${PROFILE_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        padding: "22px 36px",
        borderRadius: "20px",
        background:
          "radial-gradient(circle at 90% 10%, rgba(245, 158, 11, 0.3) 0%, transparent 60%), linear-gradient(135deg, #140d02 0%, #261a05 45%, #181003 100%)",
        border: "2px solid rgba(245, 158, 11, 0.65)",
        position: "relative",
        overflow: "hidden",
      },
      children: [
        // Regal Filigree Accents in 4 corners
        { type: "div", props: { style: { position: "absolute", top: "8px", left: "12px", color: "#fbbf24", fontSize: "12px" }, children: "❖" } },
        { type: "div", props: { style: { position: "absolute", top: "8px", right: "12px", color: "#fbbf24", fontSize: "12px" }, children: "❖" } },
        { type: "div", props: { style: { position: "absolute", bottom: "8px", left: "12px", color: "#fbbf24", fontSize: "12px" }, children: "❖" } },
        { type: "div", props: { style: { position: "absolute", bottom: "8px", right: "12px", color: "#fbbf24", fontSize: "12px" }, children: "❖" } },

        // Left Crowned Avatar
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              flexShrink: 0,
            },
            children: [
              {
                type: "div",
                props: {
                  style: { fontSize: "22px", marginBottom: "4px" },
                  children: "👑",
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    width: "128px",
                    height: "128px",
                    borderRadius: "999px",
                    padding: "3px",
                    background: "linear-gradient(135deg, #fef08a, #f59e0b, #b45309)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: avatarUri,
                        width: 122,
                        height: 122,
                        style: {
                          width: "122px",
                          height: "122px",
                          borderRadius: "999px",
                          objectFit: "cover",
                        },
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        // Right Content Area
        {
          type: "div",
          props: {
            style: {
              marginLeft: "32px",
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              height: "190px",
            },
            children: [
              // Top Laurel & Name
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column" },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "center", justifyContent: "space-between" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { fontSize: "11px", fontWeight: 700, letterSpacing: "1.5px", color: "rgba(254, 240, 138, 0.9)" },
                              children: "✦ IMPERIAL SOVEREIGN OF THE REALM ✦",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                padding: "3px 10px",
                                borderRadius: "8px",
                                background: "rgba(245, 158, 11, 0.25)",
                                border: "1px solid rgba(245, 158, 11, 0.6)",
                                color: "#fef08a",
                                fontSize: "11px",
                                fontWeight: 700,
                                display: "flex",
                              },
                              children: `${data.rank ?? "#1"} SOVEREIGN`,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "center", gap: "12px", marginTop: "4px" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { fontSize: "32px", fontWeight: 700, color: "#fde047", lineHeight: "38px" },
                              children: data.username || "Aurelius_Rex",
                            },
                          },
                          ...(data.badge
                            ? [
                                {
                                  type: "div",
                                  props: {
                                    style: {
                                      padding: "3px 10px",
                                      borderRadius: "999px",
                                      background: "rgba(245, 158, 11, 0.2)",
                                      border: "1px solid rgba(245, 158, 11, 0.5)",
                                      color: "#fef08a",
                                      fontSize: "11px",
                                      fontWeight: 700,
                                      display: "flex",
                                    },
                                    children: data.badge,
                                  },
                                },
                              ]
                            : []),
                        ],
                      },
                    },
                  ],
                },
              },
              // Middle Imperial Gold Progress Bar
              {
                type: "div",
                props: {
                  style: { display: "flex", flexDirection: "column", gap: "5px" },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#fef3c7" },
                        children: [
                          { type: "span", props: { children: "Imperial Ascendancy XP" } },
                          {
                            type: "span",
                            props: {
                              style: { color: "#fde047", fontWeight: 700, fontFamily: "monospace" },
                              children: `${data.currentXp ?? 0} / ${data.requiredXp ?? 100} XP (${percent}%)`,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "100%",
                          height: "16px",
                          borderRadius: "999px",
                          background: "rgba(0, 0, 0, 0.65)",
                          border: "1px solid rgba(245, 158, 11, 0.45)",
                          padding: "2px",
                          display: "flex",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                width: `${Math.max(2, percent)}%`,
                                height: "100%",
                                borderRadius: "999px",
                                background: "linear-gradient(90deg, #f59e0b, #fde047, #f59e0b)",
                              },
                            },
                          },
                        ],
                      },
                    },
                  ],
                },
              },
              // Bottom Imperial Heraldic Badges
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    borderTop: "1px solid rgba(245, 158, 11, 0.3)",
                    paddingTop: "8px",
                    fontSize: "12px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: { display: "flex", alignItems: "center", gap: "12px" },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                padding: "3px 10px",
                                borderRadius: "6px",
                                background: "rgba(69, 26, 3, 0.8)",
                                border: "1px solid rgba(245, 158, 11, 0.5)",
                                color: "#fde047",
                                fontWeight: 700,
                                fontSize: "12px",
                                display: "flex",
                              },
                              children: `LEVEL: ${data.level ?? 80}`,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "rgba(254, 243, 199, 0.85)" },
                              children: `TITLE: ${data.title || "Imperial Vanguard"}`,
                            },
                          },
                        ],
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: { color: "#fde047", fontWeight: 700, fontFamily: "monospace", fontSize: "14px" },
                        children: `TREASURY: ${data.balance || "0 xu"}`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
      ],
    },
  };
}

export async function generateProfileImage(data: ProfileData): Promise<{ png: Buffer; height: number }> {
  const avatarUri = await imageToDataUri(data.avatar, 180);
  const percent = Math.min(100, Math.max(0, Math.round((data.currentXp / (data.requiredXp || 1)) * 100)));
  const theme = data.theme || "ruby-poly";

  let element: any;
  if (theme === "cyber-neon") {
    element = renderProfileCyberNeon(data, avatarUri, percent);
  } else if (theme === "glass-minimal") {
    element = renderProfileGlassMinimal(data, avatarUri, percent);
  } else if (theme === "gold-legend") {
    element = renderProfileGoldLegend(data, avatarUri, percent);
  } else {
    element = renderProfileRubyPoly(data, avatarUri, percent);
  }

  if (data.particleConfig) {
    const particles = computeParticles(data.particleConfig, 0, { width: PROFILE_WIDTH, height: PROFILE_HEIGHT });
    const pNodes = renderParticlesToSatoriVNodes(particles, { width: PROFILE_WIDTH, height: PROFILE_HEIGHT });
    element.props.children.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          position: "absolute",
          inset: 0,
          width: `${PROFILE_WIDTH}px`,
          height: `${PROFILE_HEIGHT}px`,
          pointerEvents: "none",
          zIndex: 999,
        },
        children: pNodes,
      },
    });
  }

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: PROFILE_WIDTH,
    height: PROFILE_HEIGHT,
    fonts,
    loadAdditionalAsset: loadSatoriAdditionalAsset,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height: PROFILE_HEIGHT };
}

/* =========================================================================
   3. LEADERBOARD GENERATION
   ========================================================================= */

export async function generateLeaderboardImage(data: LeaderboardData): Promise<{ png: Buffer; height: number }> {
  const items = data.items || [];
  const layout = data.layout || "podium";
  const height = calculateLeaderboardHeight(items.length, layout);

  const top1 = items.find((i) => i.rank === 1) || items[0];
  const top2 = items.find((i) => i.rank === 2) || items[1];
  const top3 = items.find((i) => i.rank === 3) || items[2];
  const rest = items.filter((i) => i.rank > 3);

  const [guildIconUri, ...itemUris] = await Promise.all([
    imageToDataUri(data.guildIcon || "https://i.ytimg.com/vi/NRRXrZnhT5s/hq720.jpg", 100),
    ...items.map((i) => imageToDataUri(i.avatar, 90)),
  ]);

  const top1Uri = top1 ? (itemUris[items.indexOf(top1)] || FALLBACK_AVATAR) : FALLBACK_AVATAR;
  const top2Uri = top2 ? (itemUris[items.indexOf(top2)] || FALLBACK_AVATAR) : FALLBACK_AVATAR;
  const top3Uri = top3 ? (itemUris[items.indexOf(top3)] || FALLBACK_AVATAR) : FALLBACK_AVATAR;
  const restUris = rest.map((r) => itemUris[items.indexOf(r)] || FALLBACK_AVATAR);

  // 1. Header Banner
  const headerBanner = {
    type: "div",
    props: {
      style: {
        width: "100%",
        height: "76px",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        marginBottom: "16px",
        borderRadius: "14px",
        background: "rgba(255, 255, 255, 0.04)",
        border: "1px solid rgba(255, 255, 255, 0.08)",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              display: "flex",
              alignItems: "center",
              gap: "12px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    width: "50px",
                    height: "50px",
                    borderRadius: "14px",
                    overflow: "hidden",
                    border: "2px solid rgba(245, 158, 11, 0.4)",
                    background: "#0c0d12",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  },
                  children: [
                    {
                      type: "img",
                      props: {
                        src: guildIconUri,
                        width: 50,
                        height: 50,
                        style: {
                          width: "50px",
                          height: "50px",
                          borderRadius: "12px",
                          objectFit: "cover",
                        },
                      },
                    },
                  ],
                },
              },
              {
                type: "div",
                props: {
                  style: {
                    display: "flex",
                    flexDirection: "column",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#ffffff",
                          fontSize: "17px",
                          fontWeight: 700,
                          letterSpacing: "0.4px",
                        },
                        children: data.guildName || "Server Leaderboard",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          color: "#94a3b8",
                          fontSize: "11px",
                          marginTop: "2px",
                          display: "flex",
                        },
                        children: `Top ${items.length} Members · XP Rankings`,
                      },
                    },
                  ],
                },
              },
            ],
          },
        },
        {
          type: "div",
          props: {
            style: {
              padding: "5px 11px",
              borderRadius: "999px",
              background: "rgba(245, 158, 11, 0.15)",
              border: "1px solid rgba(245, 158, 11, 0.35)",
              color: "#fbbf24",
              fontSize: "11px",
              fontWeight: 700,
              letterSpacing: "0.5px",
              display: "flex",
            },
            children: data.season || "SEASON 1",
          },
        },
      ],
    },
  };

  // Body content based on layout
  let bodyElements: any[] = [];

  if (layout === "compact-list") {
    bodyElements = [
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          },
          children: items.map((item, idx) => {
            const rankColor =
              item.rank === 1 ? "#f59e0b" : item.rank === 2 ? "#38bdf8" : item.rank === 3 ? "#f97316" : "#64748b";
            const uri = itemUris[idx] || FALLBACK_AVATAR;
            return {
              type: "div",
              props: {
                style: {
                  width: "100%",
                  height: "64px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  borderRadius: "12px",
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.06)",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "32px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "12px",
                        fontSize: "16px",
                        fontWeight: 700,
                        color: rankColor,
                      },
                      children: item.rank === 1 ? "1" : item.rank === 2 ? "2" : item.rank === 3 ? "3" : `#${item.rank}`,
                    },
                  },
                  {
                    type: "img",
                    props: {
                      src: uri,
                      width: 44,
                      height: 44,
                      style: {
                        width: "44px",
                        height: "44px",
                        borderRadius: "999px",
                        border: `2px solid ${rankColor}`,
                        objectFit: "cover",
                        marginRight: "14px",
                      },
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "15px",
                              fontWeight: 600,
                              color: "#ffffff",
                            },
                            children: item.username,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "11px",
                              color: "#94a3b8",
                              marginTop: "2px",
                            },
                            children: item.handle,
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: `${rankColor}25`,
                              border: `1px solid ${rankColor}55`,
                              color: rankColor,
                              fontSize: "11px",
                              fontWeight: 700,
                            },
                            children: `Level ${item.level}`,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#cbd5e1",
                              marginTop: "4px",
                            },
                            children: `${item.xp} XP`,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            };
          }),
        },
      },
    ];
  } else if (layout === "cyber-grid") {
    bodyElements = [
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            display: "flex",
            flexWrap: "wrap",
            gap: "8px",
            justifyContent: "space-between",
          },
          children: items.map((item, idx) => {
            const rankColor =
              item.rank === 1 ? "#38bdf8" : item.rank === 2 ? "#c084fc" : item.rank === 3 ? "#f59e0b" : "#475569";
            const uri = itemUris[idx] || FALLBACK_AVATAR;
            return {
              type: "div",
              props: {
                style: {
                  width: "248px",
                  height: "82px",
                  display: "flex",
                  alignItems: "center",
                  padding: "10px",
                  borderRadius: "14px",
                  background: "rgba(0, 0, 0, 0.5)",
                  border: `1px solid ${rankColor}66`,
                  boxShadow: `0 0 15px ${rankColor}15`,
                  position: "relative",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        position: "relative",
                        width: "48px",
                        height: "48px",
                        marginRight: "10px",
                      },
                      children: [
                        {
                          type: "img",
                          props: {
                            src: uri,
                            width: 48,
                            height: 48,
                            style: {
                              width: "48px",
                              height: "48px",
                              borderRadius: "12px",
                              border: `2px solid ${rankColor}`,
                              objectFit: "cover",
                            },
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              position: "absolute",
                              top: "-6px",
                              left: "-6px",
                              width: "20px",
                              height: "20px",
                              borderRadius: "999px",
                              background: rankColor,
                              color: "#000000",
                              fontSize: "11px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            },
                            children: String(item.rank),
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "13px",
                              fontWeight: 700,
                              color: "#ffffff",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                            children: item.username,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "10px",
                              color: "#94a3b8",
                            },
                            children: item.handle,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: "4px",
                            },
                            children: [
                              {
                                type: "div",
                                props: {
                                  style: {
                                    fontSize: "11px",
                                    fontWeight: 700,
                                    color: rankColor,
                                  },
                                  children: `Lv.${item.level}`,
                                },
                              },
                              {
                                type: "div",
                                props: {
                                  style: {
                                    fontSize: "10px",
                                    color: "#cbd5e1",
                                  },
                                  children: `${item.xp} XP`,
                                },
                              },
                            ],
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            };
          }),
        },
      },
    ];
  } else if (layout === "minimal-cards") {
    bodyElements = [
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          },
          children: items.map((item, idx) => {
            const rankColor =
              item.rank === 1 ? "#f59e0b" : item.rank === 2 ? "#38bdf8" : item.rank === 3 ? "#f97316" : "#818cf8";
            const uri = itemUris[idx] || FALLBACK_AVATAR;
            const maxXp = items[0]?.xp || 1000;
            const xpBarPercent = Math.min(100, Math.max(5, Math.round((item.xp / maxXp) * 100)));
            return {
              type: "div",
              props: {
                style: {
                  width: "100%",
                  height: "72px",
                  display: "flex",
                  alignItems: "center",
                  padding: "0 16px",
                  borderRadius: "14px",
                  background: "rgba(255, 255, 255, 0.05)",
                  border: `1px solid ${rankColor}44`,
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "36px",
                        height: "36px",
                        borderRadius: "10px",
                        background: `${rankColor}20`,
                        border: `1px solid ${rankColor}55`,
                        color: rankColor,
                        fontSize: "15px",
                        fontWeight: 700,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        marginRight: "14px",
                        flexShrink: 0,
                      },
                      children: item.rank === 1 ? "🥇" : item.rank === 2 ? "🥈" : item.rank === 3 ? "🥉" : `#${item.rank}`,
                    },
                  },
                  {
                    type: "img",
                    props: {
                      src: uri,
                      width: 46,
                      height: 46,
                      style: {
                        width: "46px",
                        height: "46px",
                        borderRadius: "12px",
                        border: `2px solid ${rankColor}`,
                        objectFit: "cover",
                        marginRight: "14px",
                        flexShrink: 0,
                      },
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        flex: 1,
                        display: "flex",
                        flexDirection: "column",
                        minWidth: 0,
                        marginRight: "14px",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "15px",
                              fontWeight: 700,
                              color: "#ffffff",
                              overflow: "hidden",
                              whiteSpace: "nowrap",
                              textOverflow: "ellipsis",
                            },
                            children: item.username,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "11px",
                              color: "#94a3b8",
                              marginTop: "2px",
                            },
                            children: item.handle,
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "90px",
                        height: "8px",
                        borderRadius: "999px",
                        background: "rgba(255, 255, 255, 0.1)",
                        overflow: "hidden",
                        display: "flex",
                        marginRight: "16px",
                        flexShrink: 0,
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              width: `${xpBarPercent}%`,
                              height: "100%",
                              borderRadius: "999px",
                              background: rankColor,
                            },
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "flex-end",
                        flexShrink: 0,
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              padding: "2px 8px",
                              borderRadius: "999px",
                              background: `${rankColor}20`,
                              border: `1px solid ${rankColor}55`,
                              color: rankColor,
                              fontSize: "11px",
                              fontWeight: 700,
                              display: "flex",
                            },
                            children: `Lv.${item.level}`,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#cbd5e1",
                              marginTop: "3px",
                              fontFamily: "monospace",
                            },
                            children: `${item.xp} XP`,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            };
          }),
        },
      },
    ];
  } else {
    // Podium (Original)
    bodyElements = [
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
            gap: "8px",
            marginBottom: "16px",
          },
          children: [
            // Rank 2 (Left)
            {
              type: "div",
              props: {
                style: {
                  flex: 1,
                  height: "232px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "100%",
                        height: "152px",
                        background: "linear-gradient(180deg, #242a38 0%, #171b26 100%)",
                        borderRadius: "14px 14px 0 0",
                        borderTop: "3px solid #38bdf8",
                        borderLeft: "1px solid rgba(56, 189, 248, 0.2)",
                        borderRight: "1px solid rgba(56, 189, 248, 0.2)",
                        paddingTop: "34px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              color: "#ffffff",
                              fontSize: "15px",
                              fontWeight: 600,
                              width: "135px",
                              textAlign: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                            children: top2?.username || "Player 2",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#94a3b8", fontSize: "11px", marginTop: "2px" },
                            children: top2?.handle || "@player2",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              color: "#38bdf8",
                              fontSize: "12px",
                              fontWeight: 600,
                              marginTop: "10px",
                              background: "rgba(56, 189, 248, 0.12)",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              display: "flex",
                            },
                            children: `Level ${top2?.level ?? 1}`,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#38bdf8", fontSize: "12px", marginTop: "4px" },
                            children: `${top2?.xp ?? 0} XP`,
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        position: "absolute",
                        bottom: "124px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      },
                      children: [
                        {
                          type: "img",
                          props: {
                            src: top2Uri,
                            width: 64,
                            height: 64,
                            style: {
                              width: "64px",
                              height: "64px",
                              borderRadius: "999px",
                              border: "3px solid #38bdf8",
                              objectFit: "cover",
                            },
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              marginTop: "-14px",
                              width: "24px",
                              height: "24px",
                              borderRadius: "999px",
                              background: "#38bdf8",
                              color: "#000000",
                              fontSize: "12px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            },
                            children: "2",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            // Rank 1 (Center)
            {
              type: "div",
              props: {
                style: {
                  flex: 1.1,
                  height: "265px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "100%",
                        height: "178px",
                        background: "linear-gradient(180deg, #2d263b 0%, #1c1827 100%)",
                        borderRadius: "14px 14px 0 0",
                        borderTop: "3px solid #f59e0b",
                        borderLeft: "1px solid rgba(245, 158, 11, 0.25)",
                        borderRight: "1px solid rgba(245, 158, 11, 0.25)",
                        paddingTop: "36px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              color: "#ffffff",
                              fontSize: "16px",
                              fontWeight: 700,
                              width: "145px",
                              textAlign: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                            children: top1?.username || "Winner",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#94a3b8", fontSize: "11px", marginTop: "2px" },
                            children: top1?.handle || "@winner",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              color: "#f59e0b",
                              fontSize: "12px",
                              fontWeight: 700,
                              marginTop: "10px",
                              background: "rgba(245, 158, 11, 0.18)",
                              padding: "2px 10px",
                              borderRadius: "999px",
                              display: "flex",
                            },
                            children: `Level ${top1?.level ?? 1}`,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#f59e0b", fontSize: "12px", fontWeight: 600, marginTop: "4px" },
                            children: `${top1?.xp ?? 0} XP`,
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        position: "absolute",
                        bottom: "146px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      },
                      children: [
                        {
                          type: "svg",
                          props: {
                            width: 32,
                            height: 22,
                            viewBox: "0 0 34 24",
                            style: { width: "32px", height: "22px", marginBottom: "4px" },
                            children: [
                              {
                                type: "path",
                                props: {
                                  d: "M3 20h28v2H3v-2zm1.5-14l6.5 6 6-10 6 10 6.5-6 2 12H2.5l2-12z",
                                  fill: "#f59e0b",
                                },
                              },
                              {
                                type: "path",
                                props: {
                                  d: "M17 2l-6 10 6-3 6 3-6-10z",
                                  fill: "#fbbf24",
                                },
                              },
                              {
                                type: "circle",
                                props: { cx: 4.5, cy: 5.5, r: 1.8, fill: "#fef08a" },
                              },
                              {
                                type: "circle",
                                props: { cx: 17, cy: 1.8, r: 2.2, fill: "#fef08a" },
                              },
                              {
                                type: "circle",
                                props: { cx: 29.5, cy: 5.5, r: 1.8, fill: "#fef08a" },
                              },
                            ],
                          },
                        },
                        {
                          type: "img",
                          props: {
                            src: top1Uri,
                            width: 72,
                            height: 72,
                            style: {
                              width: "72px",
                              height: "72px",
                              borderRadius: "999px",
                              border: "3px solid #f59e0b",
                              objectFit: "cover",
                            },
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              marginTop: "-14px",
                              width: "26px",
                              height: "26px",
                              borderRadius: "999px",
                              background: "#f59e0b",
                              color: "#000000",
                              fontSize: "13px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            },
                            children: "1",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
            // Rank 3 (Right)
            {
              type: "div",
              props: {
                style: {
                  flex: 1,
                  height: "218px",
                  position: "relative",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "flex-end",
                },
                children: [
                  {
                    type: "div",
                    props: {
                      style: {
                        width: "100%",
                        height: "138px",
                        background: "linear-gradient(180deg, #2b2323 0%, #1b1717 100%)",
                        borderRadius: "14px 14px 0 0",
                        borderTop: "3px solid #f97316",
                        borderLeft: "1px solid rgba(249, 115, 22, 0.2)",
                        borderRight: "1px solid rgba(249, 115, 22, 0.2)",
                        paddingTop: "34px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      },
                      children: [
                        {
                          type: "div",
                          props: {
                            style: {
                              color: "#ffffff",
                              fontSize: "14px",
                              fontWeight: 600,
                              width: "135px",
                              textAlign: "center",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            },
                            children: top3?.username || "Player 3",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#94a3b8", fontSize: "11px", marginTop: "2px" },
                            children: top3?.handle || "@player3",
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              color: "#f97316",
                              fontSize: "12px",
                              fontWeight: 600,
                              marginTop: "10px",
                              background: "rgba(249, 115, 22, 0.12)",
                              padding: "2px 8px",
                              borderRadius: "999px",
                              display: "flex",
                            },
                            children: `Level ${top3?.level ?? 1}`,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#f97316", fontSize: "12px", marginTop: "4px" },
                            children: `${top3?.xp ?? 0} XP`,
                          },
                        },
                      ],
                    },
                  },
                  {
                    type: "div",
                    props: {
                      style: {
                        position: "absolute",
                        bottom: "110px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                      },
                      children: [
                        {
                          type: "img",
                          props: {
                            src: top3Uri,
                            width: 64,
                            height: 64,
                            style: {
                              width: "64px",
                              height: "64px",
                              borderRadius: "999px",
                              border: "3px solid #f97316",
                              objectFit: "cover",
                            },
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: {
                              marginTop: "-14px",
                              width: "24px",
                              height: "24px",
                              borderRadius: "999px",
                              background: "#f97316",
                              color: "#000000",
                              fontSize: "12px",
                              fontWeight: 700,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                            },
                            children: "3",
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            },
          ],
        },
      },
      // Ranks 4 to 10 Rows
      {
        type: "div",
        props: {
          style: {
            width: "100%",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
          },
          children: rest.map((item, idx) => ({
            type: "div",
            props: {
              style: {
                width: "100%",
                height: "68px",
                background: "rgba(255, 255, 255, 0.04)",
                border: "1px solid rgba(255, 255, 255, 0.06)",
                borderRadius: "12px",
                display: "flex",
                alignItems: "center",
                padding: "0 16px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: "36px",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      marginRight: "10px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: { color: "#ffffff", fontSize: "18px", fontWeight: 700, lineHeight: "20px" },
                          children: String(item.rank),
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { color: "#94a3b8", fontSize: "10px", lineHeight: "12px" },
                          children: "Rank",
                        },
                      },
                    ],
                  },
                },
                {
                  type: "img",
                  props: {
                    src: restUris[idx] || FALLBACK_AVATAR,
                    width: 46,
                    height: 46,
                    style: {
                      width: "46px",
                      height: "46px",
                      borderRadius: "999px",
                      border: "2px solid rgba(255, 255, 255, 0.12)",
                      objectFit: "cover",
                      marginRight: "14px",
                    },
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      minWidth: 0,
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: { color: "#ffffff", fontSize: "15px", fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                          children: item.username,
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { color: "#94a3b8", fontSize: "12px", marginTop: "2px" },
                          children: item.handle,
                        },
                      },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "flex-end",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: { color: "#f1f5f9", fontSize: "13px", fontWeight: 600 },
                          children: `Level ${item.level}`,
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: { color: "#94a3b8", fontSize: "12px", marginTop: "2px" },
                          children: `${item.xp} XP`,
                        },
                      },
                    ],
                  },
                },
              ],
            },
          })),
        },
      },
    ];
  }

  const element: any = {
    type: "div",
    props: {
      style: {
        width: `${LEADERBOARD_WIDTH}px`,
        height: `${height}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 18px",
        background: "#18191c",
        borderRadius: "16px",
      },
      children: [headerBanner, ...bodyElements],
    },
  };

  if (data.particleConfig) {
    const particles = computeParticles(data.particleConfig, 0, { width: LEADERBOARD_WIDTH, height });
    const pNodes = renderParticlesToSatoriVNodes(particles, { width: LEADERBOARD_WIDTH, height });
    element.props.children.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          position: "absolute",
          inset: 0,
          width: `${LEADERBOARD_WIDTH}px`,
          height: `${height}px`,
          pointerEvents: "none",
          zIndex: 999,
        },
        children: pNodes,
      },
    });
  }

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: LEADERBOARD_WIDTH,
    height,
    fonts,
    loadAdditionalAsset: loadSatoriAdditionalAsset,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height };
}

/* =========================================================================
   4. QUOTE CARD GENERATION
   ========================================================================= */

export async function generateQuoteImage(data: QuoteData): Promise<{ png: Buffer; height: number }> {
  const avatarUri = await imageToDataUri(data.avatar, 500);
  const layout = data.layout || "split-portrait";

  let element: any;

  if (layout === "centered-minimal") {
    element = {
      type: "div",
      props: {
        style: {
          width: `${QUOTE_WIDTH}px`,
          height: `${QUOTE_HEIGHT}px`,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "40px 60px",
          background: "radial-gradient(circle at 50% 20%, #1e1b4b 0%, #090a12 60%, #030408 100%)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          position: "relative",
        },
        children: [
          // Background ambient quote mark
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: "20px",
                fontSize: "140px",
                fontWeight: 700,
                color: "rgba(99, 102, 241, 0.12)",
                lineHeight: "140px",
              },
              children: "“",
            },
          },
          // Avatar
          {
            type: "div",
            props: {
              style: {
                width: "96px",
                height: "96px",
                borderRadius: "999px",
                padding: "3px",
                background: "linear-gradient(135deg, #6366f1, #a855f7, #ec4899)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "20px",
              },
              children: [
                {
                  type: "img",
                  props: {
                    src: avatarUri,
                    width: 90,
                    height: 90,
                    style: {
                      width: "90px",
                      height: "90px",
                      borderRadius: "999px",
                      objectFit: "cover",
                    },
                  },
                },
              ],
            },
          },
          // Quote Text
          {
            type: "div",
            props: {
              style: {
                maxWidth: "820px",
                fontSize: "32px",
                fontWeight: 400,
                lineHeight: "44px",
                color: "#ffffff",
                textAlign: "center",
              },
              children: `"${data.quote || "Quote text"}"`,
            },
          },
          // Separator line
          {
            type: "div",
            props: {
              style: {
                width: "100px",
                height: "2px",
                background: "linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.8), transparent)",
                margin: "18px 0",
              },
            },
          },
          // Author & Handle
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "22px",
                      fontWeight: 600,
                      color: "#c7d2fe",
                    },
                    children: data.author || "Author",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "14px",
                      color: "#94a3b8",
                      display: "flex",
                      gap: "8px",
                    },
                    children: [
                      {
                        type: "span",
                        props: { children: data.handle || "@handle" },
                      },
                      {
                        type: "span",
                        props: { children: "·" },
                      },
                      {
                        type: "span",
                        props: {
                          style: { color: "rgba(165, 180, 252, 0.8)", fontFamily: "monospace" },
                          children: data.tag || "Verified",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    };
  } else if (layout === "modern-card") {
    element = {
      type: "div",
      props: {
        style: {
          width: `${QUOTE_WIDTH}px`,
          height: `${QUOTE_HEIGHT}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "48px",
          background: "radial-gradient(ellipse at 80% 90%, rgba(99, 102, 241, 0.2) 0%, transparent 60%), linear-gradient(135deg, #070913 0%, #0d1224 50%, #0a0e1c 100%)",
          position: "relative",
        },
        children: [
          // Floating frosted card
          {
            type: "div",
            props: {
              style: {
                width: "880px",
                height: "380px",
                borderRadius: "24px",
                background: "rgba(255, 255, 255, 0.06)",
                border: "1px solid rgba(255, 255, 255, 0.15)",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                padding: "32px",
              },
              children: [
                // Header: Author & Tag
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderBottom: "1px solid rgba(255, 255, 255, 0.1)",
                      paddingBottom: "16px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "14px",
                          },
                          children: [
                            {
                              type: "img",
                              props: {
                                src: avatarUri,
                                width: 56,
                                height: 56,
                                style: {
                                  width: "56px",
                                  height: "56px",
                                  borderRadius: "16px",
                                  border: "1px solid rgba(255, 255, 255, 0.2)",
                                  objectFit: "cover",
                                },
                              },
                            },
                            {
                              type: "div",
                              props: {
                                style: {
                                  display: "flex",
                                  flexDirection: "column",
                                },
                                children: [
                                  {
                                    type: "div",
                                    props: {
                                      style: {
                                        fontSize: "20px",
                                        fontWeight: 700,
                                        color: "#ffffff",
                                      },
                                      children: data.author || "Author",
                                    },
                                  },
                                  {
                                    type: "div",
                                    props: {
                                      style: {
                                        fontSize: "13px",
                                        color: "#a5b4fc",
                                      },
                                      children: data.handle || "@handle",
                                    },
                                  },
                                ],
                              },
                            },
                          ],
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            padding: "5px 14px",
                            borderRadius: "999px",
                            background: "rgba(99, 102, 241, 0.2)",
                            border: "1px solid rgba(99, 102, 241, 0.4)",
                            color: "#c7d2fe",
                            fontSize: "12px",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            display: "flex",
                          },
                          children: data.tag || "QUOTE",
                        },
                      },
                    ],
                  },
                },
                // Middle Quote
                {
                  type: "div",
                  props: {
                    style: {
                      fontSize: "28px",
                      fontWeight: 500,
                      lineHeight: "42px",
                      color: "#f1f5f9",
                      padding: "10px 0",
                    },
                    children: `“${data.quote || "Quote text"}”`,
                  },
                },
                // Footer
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      borderTop: "1px solid rgba(255, 255, 255, 0.1)",
                      paddingTop: "14px",
                      fontSize: "12px",
                      color: "#94a3b8",
                      fontFamily: "monospace",
                    },
                    children: [
                      {
                        type: "span",
                        props: { children: "Image Studio Quote · Authenticated" },
                      },
                      {
                        type: "span",
                        props: {
                          style: { color: "#818cf8" },
                          children: data.tag || "Verified",
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
        ],
      },
    };
  } else if (layout === "neon-cyber") {
    element = {
      type: "div",
      props: {
        style: {
          width: `${QUOTE_WIDTH}px`,
          height: `${QUOTE_HEIGHT}px`,
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "36px",
          background: "radial-gradient(circle at 10% 20%, rgba(56, 189, 248, 0.15) 0%, transparent 50%), radial-gradient(circle at 90% 80%, rgba(192, 132, 252, 0.15) 0%, transparent 50%), #040711",
          border: "2px solid rgba(56, 189, 248, 0.6)",
          borderRadius: "16px",
          position: "relative",
        },
        children: [
          // Top Cyber Status Bar
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderBottom: "1px solid rgba(56, 189, 248, 0.3)",
                paddingBottom: "12px",
                fontSize: "12px",
                fontFamily: "monospace",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                      color: "#38bdf8",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            width: "8px",
                            height: "8px",
                            borderRadius: "999px",
                            background: "#38bdf8",
                          },
                        },
                      },
                      {
                        type: "span",
                        props: { children: "TERMINAL_SPEECH // STREAM_ACTIVE" },
                      },
                    ],
                  },
                },
                {
                  type: "span",
                  props: {
                    style: { color: "#f472b6", letterSpacing: "2px" },
                    children: data.tag || "CYBER_ID",
                  },
                },
              ],
            },
          },
          // Middle Row: Cyber Avatar + Quote
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                gap: "30px",
                padding: "16px 0",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      width: "140px",
                      height: "140px",
                      borderRadius: "14px",
                      border: "2px solid #38bdf8",
                      padding: "4px",
                      background: "rgba(0, 0, 0, 0.6)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    },
                    children: [
                      {
                        type: "img",
                        props: {
                          src: avatarUri,
                          width: 128,
                          height: 128,
                          style: {
                            width: "128px",
                            height: "128px",
                            borderRadius: "10px",
                            objectFit: "cover",
                          },
                        },
                      },
                    ],
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      flex: 1,
                      display: "flex",
                      flexDirection: "column",
                      gap: "8px",
                    },
                    children: [
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: "12px",
                            color: "rgba(56, 189, 248, 0.8)",
                            fontFamily: "monospace",
                          },
                          children: "> INPUT_LOG_PROMPT:",
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            fontSize: "27px",
                            fontWeight: 600,
                            lineHeight: "38px",
                            color: "#ffffff",
                          },
                          children: `"${data.quote || "Quote text"}"`,
                        },
                      },
                      {
                        type: "div",
                        props: {
                          style: {
                            display: "flex",
                            alignItems: "center",
                            gap: "12px",
                            paddingTop: "6px",
                            fontFamily: "monospace",
                          },
                          children: [
                            {
                              type: "span",
                              props: {
                                style: { fontSize: "17px", fontWeight: 700, color: "#67e8f9" },
                                children: `// ${data.author || "Author"}`,
                              },
                            },
                            {
                              type: "span",
                              props: {
                                style: { fontSize: "12px", color: "#f472b6" },
                                children: data.handle || "@handle",
                              },
                            },
                          ],
                        },
                      },
                    ],
                  },
                },
              ],
            },
          },
          // Bottom Equalizer Bars & Telemetry
          {
            type: "div",
            props: {
              style: {
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                borderTop: "1px solid rgba(56, 189, 248, 0.3)",
                paddingTop: "12px",
                fontSize: "11px",
                fontFamily: "monospace",
                color: "rgba(56, 189, 248, 0.7)",
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: { display: "flex", alignItems: "flex-end", gap: "3px", height: "24px" },
                    children: [12, 18, 8, 22, 14, 24, 10, 16, 20, 12, 18, 9, 22, 15, 24].map((h, i) => ({
                      type: "div",
                      props: {
                        key: i,
                        style: {
                          width: "4px",
                          height: `${h}px`,
                          background: "#38bdf8",
                          borderRadius: "1px",
                        },
                      },
                    })),
                  },
                },
                {
                  type: "span",
                  props: { children: "BUFFER: 100% OK · HIGH RESOLUTION" },
                },
              ],
            },
          },
        ],
      },
    };
  } else {
    // 1. Split Cinema (Original)
    element = {
      type: "div",
      props: {
        style: {
          width: `${QUOTE_WIDTH}px`,
          height: `${QUOTE_HEIGHT}px`,
          display: "flex",
          background: "#000000",
          position: "relative",
          overflow: "hidden",
        },
        children: [
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                top: 0,
                left: 0,
                width: "480px",
                height: "500px",
                display: "flex",
              },
              children: [
                {
                  type: "img",
                  props: {
                    src: avatarUri,
                    width: 480,
                    height: 500,
                    style: {
                      width: "480px",
                      height: "500px",
                      objectFit: "cover",
                    },
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "480px",
                      height: "500px",
                      background: "linear-gradient(90deg, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 80%, #000000 100%)",
                    },
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                marginLeft: "450px",
                flex: 1,
                height: "500px",
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                padding: "0 40px",
                zIndex: 3,
              },
              children: [
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#ffffff",
                      fontSize: "36px",
                      lineHeight: "48px",
                      textAlign: "center",
                      fontWeight: 400,
                      maxWidth: "460px",
                    },
                    children: data.quote || "Quote text",
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#ffffff",
                      fontSize: "24px",
                      fontStyle: "italic",
                      marginTop: "24px",
                      textAlign: "center",
                    },
                    children: `- ${data.author || "Author"}`,
                  },
                },
                {
                  type: "div",
                  props: {
                    style: {
                      color: "#9ca3af",
                      fontSize: "17px",
                      marginTop: "6px",
                      textAlign: "center",
                    },
                    children: data.handle || "@handle",
                  },
                },
              ],
            },
          },
          {
            type: "div",
            props: {
              style: {
                position: "absolute",
                bottom: "16px",
                right: "24px",
                color: "#4b5563",
                fontSize: "14px",
                fontFamily: "monospace",
                zIndex: 4,
              },
              children: data.tag || "Ziji#9575",
            },
          },
        ],
      },
    };
  }

  if (data.particleConfig) {
    const particles = computeParticles(data.particleConfig, 0, { width: QUOTE_WIDTH, height: QUOTE_HEIGHT });
    const pNodes = renderParticlesToSatoriVNodes(particles, { width: QUOTE_WIDTH, height: QUOTE_HEIGHT });
    element.props.children.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          position: "absolute",
          inset: 0,
          width: `${QUOTE_WIDTH}px`,
          height: `${QUOTE_HEIGHT}px`,
          pointerEvents: "none",
          zIndex: 999,
        },
        children: pNodes,
      },
    });
  }

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: QUOTE_WIDTH,
    height: QUOTE_HEIGHT,
    fonts,
    loadAdditionalAsset: loadSatoriAdditionalAsset,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height: QUOTE_HEIGHT };
}

/* =========================================================================
   5. CUSTOM CANVAS BUILDER GENERATION
   ========================================================================= */

export async function generateCustomCanvasImage(data: CustomCanvasData): Promise<{ png: Buffer; height: number }> {
  const width = data.width || 900;
  const height = data.height || 400;
  const elements = data.elements || [];

  // Pre-process any image / avatar elements to base64 Data URIs
  const processedElements = await Promise.all(
    elements.map(async (el) => {
      if ((el.type === "image" || el.type === "avatar") && el.imageUrl) {
        const size = Math.max(el.width, el.height) * 2;
        const uri = await imageToDataUri(el.imageUrl, Math.min(600, Math.max(96, size)));
        return { ...el, processedUri: uri };
      }
      return el;
    })
  );

  const renderedChildren = processedElements.map((el) => {
    const textShadow = computeElementTextShadow(el);
    const baseStyle: any = {
      display: "flex",
      position: "absolute",
      left: `${el.x}px`,
      top: `${el.y}px`,
      width: `${el.width}px`,
      height: `${el.height}px`,
      zIndex: el.zIndex || 1,
      overflow: el.type === "text" ? "visible" : "hidden",
    };

    if (el.type === "text") {
      const style: Record<string, unknown> = {
        ...baseStyle,
        color: el.color || "#ffffff",
        fontSize: `${el.fontSize || 18}px`,
        fontWeight: el.fontWeight || 400,
        display: "flex",
        alignItems: "center",
        justifyContent:
          el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
      };
      if (textShadow) {
        style.textShadow = textShadow;
      }
      return {
        type: "div",
        props: {
          style,
          children: el.content || "",
        },
      };
    }

    if (el.type === "badge") {
      const style: Record<string, unknown> = {
        ...baseStyle,
        background: el.backgroundColor || "rgba(255,255,255,0.15)",
        borderRadius: `${el.borderRadius ?? 999}px`,
        border: el.border || "none",
        color: el.color || "#ffffff",
        fontSize: `${el.fontSize || 12}px`,
        fontWeight: el.fontWeight || 600,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      };
      if (textShadow) {
        style.textShadow = textShadow;
      }
      return {
        type: "div",
        props: {
          style,
          children: el.content || "",
        },
      };
    }

    if (el.type === "progress") {
      const pct = Math.min(100, Math.max(0, el.progressPercent ?? 50));
      return {
        type: "div",
        props: {
          style: {
            ...baseStyle,
            background: el.backgroundColor || "#27272a",
            borderRadius: `${el.borderRadius ?? 999}px`,
            overflow: "hidden",
            display: "flex",
          },
          children: [
            {
              type: "div",
              props: {
                style: {
                  width: `${pct}%`,
                  height: "100%",
                  background: el.progressColor || "linear-gradient(90deg, #a855f7, #ec4899)",
                  borderRadius: `${el.borderRadius ?? 999}px`,
                },
              },
            },
          ],
        },
      };
    }

    if (el.type === "image" || el.type === "avatar") {
      return {
        type: "img",
        props: {
          src: (el as any).processedUri || el.imageUrl || FALLBACK_AVATAR,
          width: el.width,
          height: el.height,
          style: {
            ...baseStyle,
            borderRadius: `${el.borderRadius ?? (el.type === "avatar" ? 999 : 12)}px`,
            border: el.border || "none",
            objectFit: "cover",
          },
        },
      };
    }

    if (el.type === "particle") {
      const pConfig = el.particleConfig || createDefaultParticleConfig("spark");
      const particles = computeParticles(pConfig, 0, { width: el.width, height: el.height });
      const particleNodes = renderParticlesToSatoriVNodes(particles, { width: el.width, height: el.height });
      return {
        type: "div",
        props: {
          style: {
            ...baseStyle,
            display: "flex",
            overflow: "hidden",
            pointerEvents: "none",
          },
          children: particleNodes,
        },
      };
    }

    // Default container / box
    return {
      type: "div",
      props: {
        style: {
          ...baseStyle,
          background: el.backgroundColor || "rgba(255,255,255,0.06)",
          borderRadius: `${el.borderRadius ?? 12}px`,
          border: el.border || "1px solid rgba(255,255,255,0.1)",
        },
      },
    };
  });

  if (data.particleSystem) {
    const globalParticles = computeParticles(data.particleSystem, 0, {
      width,
      height,
    });
    const globalNodes = renderParticlesToSatoriVNodes(globalParticles, {
      width,
      height,
    });
    renderedChildren.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          position: "absolute",
          inset: 0,
          width: `${width}px`,
          height: `${height}px`,
          pointerEvents: "none",
          zIndex: 999,
        },
        children: globalNodes,
      },
    });
  }

  const rootElement = {
    type: "div",
    props: {
      style: {
        width: `${width}px`,
        height: `${height}px`,
        position: "relative",
        background: data.background || "#090614",
        borderRadius: "16px",
        overflow: "hidden",
        display: "flex",
      },
      children: renderedChildren,
    },
  };

  const fonts = loadFonts();
  const svg = await satori(rootElement as any, {
    width,
    height,
    fonts,
    loadAdditionalAsset: loadSatoriAdditionalAsset,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height };
}

/* =========================================================================
   6. UNIFIED DISPATCHER
   ========================================================================= */

export async function dispatchGenerateImage(req: AnyGenerateRequest): Promise<{ png: Buffer; height: number; filename: string }> {
  if ("type" in req && req.type === "custom") {
    const res = await generateCustomCanvasImage(req.data);
    const safeTitle = (req.data.title || "custom-design").toLowerCase().replace(/[^a-z0-9]+/g, "-");
    return { ...res, filename: `${safeTitle}.png` };
  }

  if ("type" in req && req.type === "profile") {
    const res = await generateProfileImage(req.data);
    return { ...res, filename: `${req.data.username || "profile"}-rank.png` };
  }

  if ("type" in req && req.type === "leaderboard") {
    const res = await generateLeaderboardImage(req.data);
    return { ...res, filename: "leaderboard.png" };
  }

  if ("type" in req && req.type === "quote") {
    const res = await generateQuoteImage(req.data);
    return { ...res, filename: `${req.data.author || "quote"}.png` };
  }

  // Fallback to song generator
  const songReq =
    "items" in req
      ? req
      : {
          title: (req as any).title || "song-search",
          items: (req as any).items || [],
          layout: (req as any).layout || "list",
        };
  const res = await generateSongImage(songReq);
  return { ...res, filename: `${(songReq.title || "song-search").replace(/[/\\?%*:|"<>]/g, "-")}.png` };
}
