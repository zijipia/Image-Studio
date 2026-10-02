import fs from "fs";
import path from "path";
import satori from "satori";
import sharp from "sharp";
import type { CustomCanvasData, CustomElement } from "./types.js";
import { imageToDataUri } from "./image-generator.js";
import { loadSatoriAdditionalAsset } from "./unicode-fonts.js";

let fonts: Array<{ name: string; data: Buffer; weight: 400 | 500; style: "normal" }> | null = null;
const animatedSourceCache = new Map<string, Promise<Buffer>>();
const animatedMetadataCache = new Map<string, Promise<sharp.Metadata>>();

function loadFonts() {
  if (fonts) return fonts;
  const dir = path.resolve(process.cwd(), "public/fonts");
  const regularLatinPath = path.join(dir, "Roboto-Regular.ttf");
  const regularLatin = fs.readFileSync(fs.existsSync(regularLatinPath) ? regularLatinPath : path.join(dir, "Roboto-Medium-Latin.ttf"));
  fonts = [
    { name: "Roboto", data: regularLatin, weight: 400, style: "normal" },
    { name: "Roboto", data: fs.readFileSync(path.join(dir, "Roboto-Vietnamese.ttf")), weight: 400, style: "normal" },
    { name: "Roboto", data: fs.readFileSync(path.join(dir, "Roboto-Medium-Latin.ttf")), weight: 500, style: "normal" },
    { name: "Roboto", data: fs.readFileSync(path.join(dir, "Roboto-Medium-Vn.ttf")), weight: 500, style: "normal" },
  ];
  return fonts;
}

const px = (value: number | undefined, fallback = 0) => `${value ?? fallback}px`;
const safeBackground = (value: string | undefined) => value?.trim() || "#000";

async function getAnimatedSource(url: string) {
  let source = animatedSourceCache.get(url);
  if (!source) {
    source = fetch(url).then(async (response) => {
      if (!response.ok) throw new Error(`Background image request failed: ${response.status}`);
      return Buffer.from(await response.arrayBuffer());
    });
    animatedSourceCache.set(url, source);
  }
  return source;
}

async function getAnimatedMetadata(url: string) {
  let metadata = animatedMetadataCache.get(url);
  if (!metadata) {
    metadata = getAnimatedSource(url).then((buffer) => sharp(buffer, { animated: true }).metadata());
    animatedMetadataCache.set(url, metadata);
  }
  return metadata;
}

async function animatedImageToDataUri(url: string, timeMs: number, targetWidth: number, targetHeight: number) {
  const source = await getAnimatedSource(url);
  const metadata = await getAnimatedMetadata(url);
  const pages = Math.max(1, metadata.pages ?? 1);
  let page = 0;
  const delays = metadata.delay ?? [];
  if (pages > 1 && delays.length) {
    const total = delays.reduce((sum, value) => sum + value, 0) || pages * 100;
    let cursor = ((timeMs % total) + total) % total;
    for (let i = 0; i < pages; i++) {
      const delay = delays[i] ?? 100;
      if (cursor < delay) { page = i; break; }
      cursor -= delay;
      page = i;
    }
  } else if (pages > 1) {
    page = Math.min(pages - 1, Math.floor(Math.max(0, timeMs) / 100) % pages);
  }
  const frame = await sharp(source, { page }).resize(targetWidth, targetHeight, { fit: "cover" }).png().toBuffer();
  return `data:image/png;base64,${frame.toString("base64")}`;
}

async function renderElement(element: CustomElement): Promise<any> {
  const base: any = {
    position: "absolute",
    left: px(element.x),
    top: px(element.y),
    width: px(element.width),
    height: px(element.height),
    opacity: element.opacity ?? 1,
    zIndex: element.zIndex ?? 0,
    boxSizing: "border-box",
    overflow: "hidden",
  };

  if (element.type === "text" || element.type === "badge") {
    const style: Record<string, unknown> = {
      ...base,
      display: "flex",
      alignItems: "center",
      justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
      color: element.color ?? "#fff",
      borderRadius: px(element.borderRadius),
      fontSize: px(element.fontSize, 24),
      fontWeight: element.fontWeight ?? 400,
      lineHeight: 1.2,
      whiteSpace: "pre-wrap",
    };
    if (element.type === "badge") {
      if (element.backgroundColor) style.background = element.backgroundColor;
      if (element.border) style.border = element.border;
      style.padding = "0 10px";
    } else if (element.border) {
      style.border = element.border;
    }
    return { type: "div", props: { style, children: element.content ?? "" } };
  }

  if (element.type === "image" || element.type === "avatar") {
    const src = await imageToDataUri(element.imageUrl ?? "", Math.max(32, Math.round(Math.max(element.width, element.height))));
    const style: Record<string, unknown> = { ...base, objectFit: "cover", borderRadius: px(element.borderRadius) };
    if (element.border) style.border = element.border;
    return { type: "img", props: { src, width: element.width, height: element.height, style } };
  }

  if (element.type === "progress") {
    const percent = Math.max(0, Math.min(100, element.progressPercent ?? 0));
    const style: Record<string, unknown> = { ...base, background: element.backgroundColor ?? "#27272a", borderRadius: px(element.borderRadius) };
    if (element.border) style.border = element.border;
    return { type: "div", props: { style, children: [{ type: "div", props: { style: { width: `${percent}%`, height: "100%", background: element.progressColor ?? "#a855f7", borderRadius: px(element.borderRadius) } } }] } };
  }

  const style: Record<string, unknown> = { ...base, borderRadius: px(element.borderRadius) };
  if (element.backgroundColor) style.background = element.backgroundColor;
  if (element.border) style.border = element.border;
  return { type: "div", props: { style } };
}

export async function renderCustomCanvasSvg(canvas: CustomCanvasData, timeMs = 0): Promise<Buffer> {
  const children: any[] = [];
  if (canvas.backgroundImageUrl) {
    try {
      const src = await animatedImageToDataUri(canvas.backgroundImageUrl, timeMs, canvas.width, canvas.height);
      children.push({ type: "img", props: { src, width: canvas.width, height: canvas.height, style: { position: "absolute", inset: 0, width: px(canvas.width), height: px(canvas.height), objectFit: "cover" } } });
    } catch (error) {
      console.warn(`[animated-canvas-renderer] Failed background image ${canvas.backgroundImageUrl}:`, error);
    }
  }
  const elements = await Promise.all([...canvas.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map(renderElement));
  children.push(...elements);
  const tree = { type: "div", props: { style: { position: "relative", display: "flex", width: px(canvas.width), height: px(canvas.height), overflow: "hidden", background: safeBackground(canvas.background) }, children } };
  const svg = await satori(tree as any, { width: canvas.width, height: canvas.height, fonts: loadFonts(), loadAdditionalAsset: loadSatoriAdditionalAsset });
  return Buffer.from(svg);
}
