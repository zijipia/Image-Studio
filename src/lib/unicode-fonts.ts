const fontCache = new Map<string, Promise<Array<{
  name: string;
  data: Buffer;
  weight: 400;
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
  const base = primary.split("-")[0];
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

async function loadGoogleFont(family: string, text: string): Promise<Buffer> {
  const params = new URLSearchParams({
    family,
    text,
  });
  const cssResponse = await fetch(`https://fonts.googleapis.com/css2?${params.toString()}`, {
    headers: {
      // Google Fonts serves WOFF2 to modern browsers. Satori accepts TTF/OTF/WOFF,
      // so use a legacy UA to request a TTF-compatible source.
      "User-Agent": "Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8) AppleWebKit/533.21.1 Safari/533.21.1",
    },
  });
  if (!cssResponse.ok) {
    throw new Error(`Google Fonts CSS request failed: ${cssResponse.status}`);
  }

  const css = await cssResponse.text();
  const match = css.match(/src:\s*url\\(([^)]+)\\)\s*format\\(['\"](?:truetype|opentype)['\"]\\)/i);
  if (!match?.[1]) {
    throw new Error(`No TTF/OTF font source returned for ${family}`);
  }

  const fontResponse = await fetch(match[1]);
  if (!fontResponse.ok) {
    throw new Error(`Google Fonts font request failed: ${fontResponse.status}`);
  }
  return Buffer.from(await fontResponse.arrayBuffer());
}

export async function loadSatoriAdditionalAsset(
  languageCode: string,
  text: string,
): Promise<Array<{ name: string; data: Buffer; weight: 400; style: "normal"; lang?: string }> | null> {
  if (!text || languageCode === "emoji") return null;

  const locale = normalizeLanguageCode(languageCode);
  const family = LANGUAGE_FONTS[locale] ?? "Noto Sans";
  const key = `${locale}:${text}`;

  let pending = fontCache.get(key);
  if (!pending) {
    pending = loadGoogleFont(family, text)
      .then((data) => [{
        name: `ImageStudio-${locale}-fallback`,
        data,
        weight: 400 as const,
        style: "normal" as const,
        lang: locale === "unknown" ? undefined : locale,
      }])
      .catch((error) => {
        console.warn(`[unicode-fonts] Failed to load ${family} for ${JSON.stringify(text)}:`, error);
        return null;
      });
    fontCache.set(key, pending);
  }

  return pending;
}
