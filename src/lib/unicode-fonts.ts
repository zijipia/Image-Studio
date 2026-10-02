type SatoriFont = {
  name: string;
  data: Buffer;
  weight: 400 | 500;
  style: "normal";
  lang?: string;
};

/**
 * Font families keyed by Satori language codes.
 *
 * Satori can return multiple codes for ambiguous Han text, e.g.
 * zh-CN|ja-JP|zh-TW|zh-HK. We intentionally keep all candidates instead
 * of guessing the script from code points ourselves.
 */
const LANGUAGE_FONTS: Record<string, string> = {
  "ja-JP": "Noto Sans JP",
  "ko-KR": "Noto Sans KR",
  "zh-CN": "Noto Sans SC",
  "zh-TW": "Noto Sans TC",
  "zh-HK": "Noto Sans HK",
  "th-TH": "Noto Sans Thai",
  "ar-AR": "Noto Sans Arabic",
  "ar": "Noto Sans Arabic",
  "he-IL": "Noto Sans Hebrew",
  "hi-IN": "Noto Sans Devanagari",
  "bn-IN": "Noto Sans Bengali",
  "ta-IN": "Noto Sans Tamil",
  "te-IN": "Noto Sans Telugu",
  "ml-IN": "Noto Sans Malayalam",
  "kn-IN": "Noto Sans Kannada",
  "ka-GE": "Noto Sans Georgian",
  "hy-AM": "Noto Sans Armenian",
  "km-KH": "Noto Sans Khmer",
  "lo-LA": "Noto Sans Lao",
  "my-MM": "Noto Sans Myanmar",
  "si-LK": "Noto Sans Sinhala",
  "am-ET": "Noto Sans Ethiopic",
  "ru-RU": "Noto Sans",
  "uk-UA": "Noto Sans",
  "el-GR": "Noto Sans",
  "vi-VN": "Noto Sans",
  "devanagari": "Noto Sans Devanagari",
};

type FontSource = {
  family: string;
  language: string;
};

const fontCache = new Map<string, Promise<SatoriFont[] | null>>();

/**
 * Satori supports TTF/OTF/WOFF, but not WOFF2. Ask Google Fonts for a
 * compatible source and reject a response that only contains WOFF2.
 */
async function loadGoogleFont(family: string, text: string): Promise<Buffer> {
  const params = new URLSearchParams({ family, text });
  const cssResponse = await fetch(
    `https://fonts.googleapis.com/css2?${params.toString()}`,
    {
      headers: {
        // Google Fonts uses UA negotiation. This UA returns legacy TTF sources.
        "User-Agent": "Mozilla/4.0",
      },
    },
  );

  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  }

  const css = await cssResponse.text();
  const sources = [
    ...css.matchAll(
      /src:\s*url\(([^)]+)\)\s*format\(['"](truetype|opentype|woff)['"]\)/gi,
    ),
  ];
  const url = sources[0]?.[1];

  if (!url) {
    throw new Error(`No Satori-compatible font source returned for ${family}`);
  }

  const fontResponse = await fetch(url);
  if (!fontResponse.ok) {
    throw new Error(`Google Fonts font request failed: ${fontResponse.status}`);
  }

  return Buffer.from(await fontResponse.arrayBuffer());
}

/**
 * Implementation of Satori's loadAdditionalAsset(code, segment) contract.
 *
 * Do not infer a language from the segment here. Satori has already detected
 * the language and deliberately supplies every candidate locale needed for
 * ambiguous characters. We simply resolve each code to its font family and
 * return FontOptions, just like Satori's own playground/test implementation.
 */
export async function loadSatoriAdditionalAsset(
  languageCode: string,
  text: string,
): Promise<SatoriFont[] | null> {
  if (!text || languageCode === "emoji") return null;

  const sources: FontSource[] = [];
  const seen = new Set<string>();

  for (const language of languageCode
    .split("|")
    .map((code) => code.trim())
    .filter(Boolean)) {
    const family = LANGUAGE_FONTS[language];
    if (!family) continue;

    const key = `${language}:${family}`;
    if (seen.has(key)) continue;
    seen.add(key);
    sources.push({ family, language });
  }

  if (!sources.length) return null;

  const cacheKey = `${languageCode}:${text}`;
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const pending = Promise.all(
    sources.map(async ({ family, language }) => {
      const data = await loadGoogleFont(family, text);
      const safeLanguage = language.replace(/[^a-zA-Z0-9-]/g, "_");
      const name = `ImageStudio-${safeLanguage}-${hashText(text)}`;

      return [
        {
          name,
          data,
          weight: 400 as const,
          style: "normal" as const,
          lang: language,
        },
        {
          name,
          data,
          weight: 500 as const,
          style: "normal" as const,
          lang: language,
        },
      ];
    }),
  )
    .then((groups) => groups.flat())
    .catch((error) => {
      console.warn(
        `[unicode-fonts] Failed to load dynamic font for ${JSON.stringify(text)} (${languageCode}):`,
        error,
      );
      return null;
    });

  fontCache.set(cacheKey, pending);
  return pending;
}

function hashText(text: string): string {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36);
}
