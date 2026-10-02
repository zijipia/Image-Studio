import fs from "fs";
import path from "path";
import satori from "satori";
import sharp from "sharp";
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
  if (!url || typeof url !== "string") {
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

  const element = {
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

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: CANVAS_WIDTH,
    height,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height };
}

/* =========================================================================
   2. PROFILE RANK CARD GENERATION
   ========================================================================= */

export async function generateProfileImage(data: ProfileData): Promise<{ png: Buffer; height: number }> {
  const avatarUri = await imageToDataUri(data.avatar, 180);
  const percent = Math.min(100, Math.max(0, Math.round((data.currentXp / (data.requiredXp || 1)) * 100)));

  const element = {
    type: "div",
    props: {
      style: {
        width: `${PROFILE_WIDTH}px`,
        height: `${PROFILE_HEIGHT}px`,
        display: "flex",
        alignItems: "center",
        padding: "0 35px",
        borderRadius: "20px",
        background:
          "linear-gradient(135deg, #090210 0%, #1a031e 30%, #3d0728 65%, #630c33 100%)",
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
              width: "150px",
              height: "150px",
              borderRadius: "999px",
              padding: "4px",
              background: "linear-gradient(135deg, rgba(244, 63, 94, 0.6), rgba(255, 255, 255, 0.2))",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
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
                    flexDirection: "column",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "34px",
                          fontWeight: 500,
                          color: "#f43f5e",
                          lineHeight: "40px",
                        },
                        children: data.username || "__ziji",
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          color: "#a1a1aa",
                          marginTop: "2px",
                          lineHeight: "26px",
                        },
                        children: data.balance || "0 xu",
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
                    gap: "60px",
                    marginTop: "18px",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontWeight: 500,
                          color: "#f43f5e",
                          letterSpacing: "1px",
                        },
                        children: `LEVEL: ${data.level ?? 1}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontWeight: 500,
                          color: "#f43f5e",
                          letterSpacing: "1px",
                        },
                        children: `XP: ${data.currentXp ?? 0}/${data.requiredXp ?? 100}`,
                      },
                    },
                    {
                      type: "div",
                      props: {
                        style: {
                          fontSize: "20px",
                          fontWeight: 500,
                          color: "#f43f5e",
                          letterSpacing: "1px",
                        },
                        children: `RANK: ${data.rank ?? "#1"}`,
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

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: PROFILE_WIDTH,
    height: PROFILE_HEIGHT,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height: PROFILE_HEIGHT };
}

/* =========================================================================
   3. LEADERBOARD GENERATION
   ========================================================================= */

export async function generateLeaderboardImage(data: LeaderboardData): Promise<{ png: Buffer; height: number }> {
  const height = calculateLeaderboardHeight(data.items.length);
  const items = data.items || [];

  const top1 = items.find((i) => i.rank === 1) || items[0];
  const top2 = items.find((i) => i.rank === 2) || items[1];
  const top3 = items.find((i) => i.rank === 3) || items[2];
  const rest = items.filter((i) => i.rank > 3);

  const [guildIconUri, top1Uri, top2Uri, top3Uri, ...restUris] = await Promise.all([
    imageToDataUri(data.guildIcon || "https://i.ytimg.com/vi/NRRXrZnhT5s/hq720.jpg", 100),
    top1 ? imageToDataUri(top1.avatar, 100) : FALLBACK_AVATAR,
    top2 ? imageToDataUri(top2.avatar, 90) : FALLBACK_AVATAR,
    top3 ? imageToDataUri(top3.avatar, 90) : FALLBACK_AVATAR,
    ...rest.map((r) => imageToDataUri(r.avatar, 70)),
  ]);

  const element = {
    type: "div",
    props: {
      style: {
        width: `${LEADERBOARD_WIDTH}px`,
        height: `${height}px`,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "20px 18px",
        background: "#1e1f23",
        borderRadius: "16px",
      },
      children: [
        {
          type: "div",
          props: {
            style: {
              width: "60px",
              height: "60px",
              borderRadius: "999px",
              padding: "2px",
              background: "rgba(255, 255, 255, 0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "16px",
            },
            children: [
              {
                type: "img",
                props: {
                  src: guildIconUri,
                  width: 56,
                  height: 56,
                  style: {
                    width: "56px",
                    height: "56px",
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
              width: "100%",
              display: "flex",
              alignItems: "flex-end",
              justifyContent: "center",
              gap: "6px",
              marginBottom: "14px",
            },
            children: [
              {
                type: "div",
                props: {
                  style: {
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "-15px",
                          zIndex: 5,
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
                                position: "absolute",
                                bottom: "-4px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "999px",
                                background: "#38bdf8",
                                color: "#000000",
                                fontSize: "12px",
                                fontWeight: 600,
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
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "100%",
                          height: "145px",
                          background: "#383d47",
                          borderRadius: "14px 14px 0 0",
                          paddingTop: "24px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { color: "#ffffff", fontSize: "15px", fontWeight: 500, width: "135px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                              children: top2?.username || "Player 2",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#9ca3af", fontSize: "11px", marginTop: "2px" },
                              children: top2?.handle || "@player2",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#38bdf8", fontSize: "13px", marginTop: "12px" },
                              children: `Level ${top2?.level ?? 1}`,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#38bdf8", fontSize: "12px", marginTop: "2px" },
                              children: `${top2?.xp ?? 0} XP`,
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
                    flex: 1.1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          marginBottom: "-18px",
                          zIndex: 6,
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: {
                                color: "#f59e0b",
                                fontSize: "20px",
                                marginBottom: "2px",
                              },
                              children: "👑",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              },
                              children: [
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
                                      position: "absolute",
                                      bottom: "-4px",
                                      width: "22px",
                                      height: "22px",
                                      borderRadius: "999px",
                                      background: "#f59e0b",
                                      color: "#000000",
                                      fontSize: "13px",
                                      fontWeight: 600,
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
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "100%",
                          height: "170px",
                          background: "#424854",
                          borderRadius: "14px 14px 0 0",
                          paddingTop: "26px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { color: "#ffffff", fontSize: "16px", fontWeight: 500, width: "145px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                              children: top1?.username || "Winner",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#9ca3af", fontSize: "11px", marginTop: "2px" },
                              children: top1?.handle || "@winner",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#f59e0b", fontSize: "14px", marginTop: "14px" },
                              children: `Level ${top1?.level ?? 1}`,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#f59e0b", fontSize: "12px", marginTop: "2px" },
                              children: `${top1?.xp ?? 0} XP`,
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
                    flex: 1,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                  },
                  children: [
                    {
                      type: "div",
                      props: {
                        style: {
                          position: "relative",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          marginBottom: "-15px",
                          zIndex: 5,
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
                                border: "3px solid #22c55e",
                                objectFit: "cover",
                              },
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: {
                                position: "absolute",
                                bottom: "-4px",
                                width: "20px",
                                height: "20px",
                                borderRadius: "999px",
                                background: "#22c55e",
                                color: "#000000",
                                fontSize: "12px",
                                fontWeight: 600,
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
                    {
                      type: "div",
                      props: {
                        style: {
                          width: "100%",
                          height: "135px",
                          background: "#383d47",
                          borderRadius: "14px 14px 0 0",
                          paddingTop: "24px",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                        },
                        children: [
                          {
                            type: "div",
                            props: {
                              style: { color: "#ffffff", fontSize: "14px", fontWeight: 500, width: "135px", textAlign: "center", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                              children: top3?.username || "Player 3",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#9ca3af", fontSize: "11px", marginTop: "2px" },
                              children: top3?.handle || "@player3",
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#22c55e", fontSize: "13px", marginTop: "12px" },
                              children: `Level ${top3?.level ?? 1}`,
                            },
                          },
                          {
                            type: "div",
                            props: {
                              style: { color: "#22c55e", fontSize: "12px", marginTop: "2px" },
                              children: `${top3?.xp ?? 0} XP`,
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
                  background: "#4f5563",
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
                            style: { color: "#ffffff", fontSize: "18px", fontWeight: 600, lineHeight: "20px" },
                            children: String(item.rank),
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#9ca3af", fontSize: "10px", lineHeight: "12px" },
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
                            style: { color: "#ffffff", fontSize: "16px", fontWeight: 500, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" },
                            children: item.username,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#cbd5e1", fontSize: "12px", marginTop: "2px" },
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
                            style: { color: "#f1f5f9", fontSize: "13px" },
                            children: `Level ${item.level}`,
                          },
                        },
                        {
                          type: "div",
                          props: {
                            style: { color: "#cbd5e1", fontSize: "12px", marginTop: "2px" },
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
      ],
    },
  };

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: LEADERBOARD_WIDTH,
    height,
    fonts,
  });

  const png = await sharp(Buffer.from(svg)).png().toBuffer();
  return { png, height };
}

/* =========================================================================
   4. QUOTE CARD GENERATION
   ========================================================================= */

export async function generateQuoteImage(data: QuoteData): Promise<{ png: Buffer; height: number }> {
  const avatarUri = await imageToDataUri(data.avatar, 500);

  const element = {
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
                    background: "linear-gradient(to right, rgba(0,0,0,0) 30%, rgba(0,0,0,0.85) 80%, #000000 100%)",
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

  const fonts = loadFonts();
  const svg = await satori(element as any, {
    width: QUOTE_WIDTH,
    height: QUOTE_HEIGHT,
    fonts,
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
    const baseStyle: any = {
      position: "absolute",
      left: `${el.x}px`,
      top: `${el.y}px`,
      width: `${el.width}px`,
      height: `${el.height}px`,
      zIndex: el.zIndex || 1,
    };

    if (el.type === "text") {
      return {
        type: "div",
        props: {
          style: {
            ...baseStyle,
            color: el.color || "#ffffff",
            fontSize: `${el.fontSize || 18}px`,
            fontWeight: el.fontWeight || 400,
            display: "flex",
            alignItems: "center",
            justifyContent:
              el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
          },
          children: el.content || "",
        },
      };
    }

    if (el.type === "badge") {
      return {
        type: "div",
        props: {
          style: {
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
          },
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
