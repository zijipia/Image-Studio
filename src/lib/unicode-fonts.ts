const fontCache = new Map<string, Promise<Array<{
  name: string;
  data: Buffer;
  weight: 400 | 500;
  style: "normal";
  lang?: string;
}> | null>>();

const LANGUAGE_FONTS: Record<string, string | undefined> = {
  "ja-JP": "Noto Sans JP",
  "ko-KR": "Noto Sans KR",
  "zh-CN": "Noto Sans SC",
  "zh-TW": "Noto Sans TC",
  "zh-HK": "Noto Sans HK",
  "th-TH": "Noto Sans Thai",
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
  "unknown": "Noto Sans",
};

function normalizeLanguageCode(code: string) {
  const primary = code.split("|")[0];
  if (LANGUAGE_FONTS[primary]) return primary;
  const base = primary.split("-")[0].toLowerCase();
  if (base === "ja") return "ja-JP";
  if (base === "ko") return "ko-KR";
  if (base === "zh") return primary.toLowerCase() === "zh-tw" ? "zh-TW" : "zh-CN";
  if (base === "vi") return "vi-VN";
  if (base === "ar") return "ar";
  if (base === "he") return "he-IL";
  if (base === "th") return "th-TH";
  if (base === "ru") return "ru-RU";
  if (base === "uk") return "uk-UA";
  if (base === "el") return "el-GR";
  return "unknown";
}

// Satori can report a mixed Latin + CJK segment as `unknown`. Infer the
// script from the actual code points so titles such as "日本語 - Anemone"
// still select a CJK font instead of falling back to Latin-only Noto Sans.
function detectScriptLocale(text: string, languageCode: string) {
  if (/\p{Script=Hiragana}|\p{Script=Katakana}/u.test(text)) return "ja-JP";
  if (/\p{Script=Hangul}/u.test(text)) return "ko-KR";
  if (/\p{Script=Han}/u.test(text)) {
    const normalized = normalizeLanguageCode(languageCode);
    if (normalized === "ja-JP") return normalized;
    if (normalized === "zh-TW" || normalized === "zh-HK") return normalized;
    return "zh-CN";
  }
  if (/\p{Script=Thai}/u.test(text)) return "th-TH";
  if (/\p{Script=Arabic}/u.test(text)) return "ar";
  if (/\p{Script=Hebrew}/u.test(text)) return "he-IL";
  if (/\p{Script=Devanagari}/u.test(text)) return "hi-IN";
  if (/\p{Script=Georgian}/u.test(text)) return "ka-GE";
  if (/\p{Script=Armenian}/u.test(text)) return "hy-AM";
  if (/\p{Script=Khmer}/u.test(text)) return "km-KH";
  if (/\p{Script=Lao}/u.test(text)) return "lo-LA";
  if (/\p{Script=Myanmar}/u.test(text)) return "my-MM";
  if (/\p{Script=Cyrillic}/u.test(text)) return "ru-RU";
  if (/\p{Script=Greek}/u.test(text)) return "el-GR";
  if (/\p{Script=Latin}/u.test(text) && /[ăâđêôơưĂÂĐÊÔƠƯ]/u.test(text)) return "vi-VN";
  return normalizeLanguageCode(languageCode);
}

async function loadGoogleFont(family: string, text: string): Promise<Buffer> {
  const params = new URLSearchParams({ family, text });
  const cssResponse = await fetch(`https://fonts.googleapis.com/css2?${params.toString()}`, {
    headers: {
      // Google Fonts uses UA negotiation. An old UA returns TTF/OTF, which is
      // required because Satori does not support WOFF2.
      "User-Agent": "Mozilla/4.0",
    },
  });
  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  }

  const css = await cssResponse.text();
  const urls = [...css.matchAll(/src:\s*url\(([^)]+)\)\s*format\(['"](truetype|opentype)['"]\)/gi)];
  const url = urls[0]?.[1];
  if (!url) {
    throw new Error(`No TTF/OTF font source returned for ${family}`);
  }

  const fontResponse = await fetch(url);
  if (!fontResponse.ok) {
    throw new Error(`Google Fonts font request failed: ${fontResponse.status}`);
  }
  return Buffer.from(await fontResponse.arrayBuffer());
}

export async function loadSatoriAdditionalAsset(
  languageCode: string,
  text: string,
): Promise<Array<{ name: string; data: Buffer; weight: 400 | 500; style: "normal"; lang?: string }> | null> {
  if (!text || languageCode === "emoji") return null;

  const locale = detectScriptLocale(text, languageCode);
  const family = LANGUAGE_FONTS[locale] ?? "Noto Sans";
  const key = `${locale}:${text}`;

  let pending = fontCache.get(key);
  if (!pending) {
    pending = loadGoogleFont(family, text)
      .then((data) => [
        {
          name: `ImageStudio-${locale}-fallback`,
          data,
          weight: 400 as const,
          style: "normal" as const,
          lang: locale === "unknown" ? undefined : locale,
        },
        {
          name: `ImageStudio-${locale}-fallback`,
          data,
          weight: 500 as const,
          style: "normal" as const,
          lang: locale === "unknown" ? undefined : locale,
        },
      ])
      .catch((error) => {
        console.warn(`[unicode-fonts] Failed to load ${family} for ${JSON.stringify(text)}:`, error);
        return null;
      });
    fontCache.set(key, pending);
  }

  return pending;
}
