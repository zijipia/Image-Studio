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
 * Satori currently does not classify Vietnamese as a dedicated locale in all
 * versions, so the resolver below also recognizes Vietnamese code points when
 * Satori reports `unknown`.
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
  "vi": "Noto Sans",
  "vi-VN": "Noto Sans",
  "devanagari": "Noto Sans Devanagari",
};

/**
 * `FontOptions.lang` is validated by Satori against its own Locale enum.
 * Vietnamese, Russian, Ukrainian, Greek, etc. are not accepted there even
 * though they are valid language identifiers. Keep the language for font
 * selection/name purposes, but only pass supported locales to Satori.
 */
const SATORI_SUPPORTED_LOCALES = new Set([
  "ja-JP",
  "ko-KR",
  "zh-CN",
  "zh-TW",
  "zh-HK",
  "th-TH",
  "bn-IN",
  "ar-AR",
  "ta-IN",
  "ml-IN",
  "he-IL",
  "te-IN",
  "devanagari",
  "kannada",
  "emoji",
  "symbol",
  "math",
]);

type FontSource = {
  family: string;
  language: string;
  requestText?: string;
};

const fontCache = new Map<string, Promise<SatoriFont[]>>();

// Google Fonts separates Vietnamese into its own glyph set. Include the full
// Vietnamese alphabet/marks in the request so a tiny segment such as `ỳ`,
// `ượ`, or `ệ` cannot accidentally receive a Latin-only subset.
const VIETNAMESE_GLYPHS =
  "ĂăÂâĐđÊêÔôƠơƯư ÁáÀàẢảÃãẠạ Ăắằẳẵặ Âấầẩẫậ Êếềểễệ Ôốồổỗộ Ơớờởỡợ Ưứừửữự " +
  "ỲỳÝýỶỷỸỹỴỵ";

function normalizeLanguageCode(code: string): string | null {
  const primary = code.trim().split("|")[0];
  if (LANGUAGE_FONTS[primary]) return primary;

  const base = primary.toLowerCase().replace("_", "-").split("-")[0];
  if (base === "vi") return "vi-VN";
  return null;
}

function containsVietnamese(text: string): boolean {
  // Vietnamese precomposed letters live mainly in U+1EA0..U+1EF9, with a few
  // letters/marks in Latin Extended-A and combining-mark ranges.
  return /[\u0102\u0103\u0110\u0111\u0128\u0129\u0168\u0169\u01A0\u01A1\u01AF\u01B0\u0300-\u0303\u0306\u031B\u0323\u1EA0-\u1EF9]/u.test(
    text,
  );
}

/**
 * Google Fonts is requested with an old UA so it returns TTF/OTF/WOFF rather
 * than WOFF2, which Satori does not support.
 */
async function loadGoogleFont(family: string, text: string): Promise<Buffer> {
  const params = new URLSearchParams({ family, text });
  const cssResponse = await fetch(
    `https://fonts.googleapis.com/css2?${params.toString()}`,
    { headers: { "User-Agent": "Mozilla/4.0" } },
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
 * For normal locales we trust Satori's detected language code. Vietnamese is
 * the explicit exception: Satori may report `unknown`, while the supplied
 * text still contains Vietnamese Extended glyphs that are absent from the
 * bundled Roboto subset.
 */
export async function loadSatoriAdditionalAsset(
  languageCode: string,
  text: string,
): Promise<SatoriFont[]> {
  if (!text || languageCode === "emoji") return [];

  const sources: FontSource[] = [];
  const seen = new Set<string>();
  const addSource = (language: string, family: string, requestText = text) => {
    const key = `${language}:${family}`;
    if (seen.has(key)) return;
    seen.add(key);
    sources.push({ family, language, requestText });
  };

  for (const rawLanguage of languageCode
    .split("|")
    .map((code) => code.trim())
    .filter(Boolean)) {
    const language = normalizeLanguageCode(rawLanguage) ?? rawLanguage;
    const family = LANGUAGE_FONTS[language];
    if (family) {
      addSource(
        language,
        family,
        language === "vi" || language === "vi-VN"
          ? `${VIETNAMESE_GLYPHS} ${text}`
          : text,
      );
    }
  }

  // Satori versions that do not expose Vietnamese in detectLanguageCode report
  // these characters as `unknown`. Do the minimum content-based detection
  // needed to recover the missing Vietnamese glyphs.
  if (containsVietnamese(text)) {
    addSource("vi-VN", "Noto Sans", `${VIETNAMESE_GLYPHS} ${text}`);
  }

  if (!sources.length) return [];

  const cacheKey = sources
    .map(({ language, family, requestText }) => `${language}:${family}:${requestText}`)
    .join("|");
  const cached = fontCache.get(cacheKey);
  if (cached) return cached;

  const pending = Promise.all(
    sources.map(async ({ family, language, requestText }) => {
      const data = await loadGoogleFont(family, requestText ?? text);
      const safeLanguage = language.replace(/[^a-zA-Z0-9-]/g, "_");
      const name = `ImageStudio-${safeLanguage}-${hashText(requestText ?? text)}`;

      // Only pass locales that Satori explicitly accepts. For Vietnamese we
      // intentionally omit `lang`; the font still supplies the missing glyphs.
      const satoriLang = SATORI_SUPPORTED_LOCALES.has(language)
        ? language
        : undefined;

      return [
        {
          name,
          data,
          weight: 400 as const,
          style: "normal" as const,
          ...(satoriLang ? { lang: satoriLang } : {}),
        },
        {
          name,
          data,
          weight: 500 as const,
          style: "normal" as const,
          ...(satoriLang ? { lang: satoriLang } : {}),
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
      return [];
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
