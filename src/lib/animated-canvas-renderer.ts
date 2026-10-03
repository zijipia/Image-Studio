import fs from "fs";
import path from "path";
import satori from "satori";
import sharp, { type Metadata } from "sharp";
import type { CustomCanvasData, CustomElement } from "./types.js";
import { imageToDataUri } from "./image-generator.js";
import { loadSatoriAdditionalAsset } from "./unicode-fonts.js";
import { computeElementTextShadow } from "./text-effects.js";
import { computeParticles, renderParticlesToSatoriVNodes, createDefaultParticleConfig } from "./particle-system.js";

let fonts: Array<{ name: string; data: Buffer; weight: 400 | 500; style: "normal" }> | null = null;
const animatedSourceCache = new Map<string, Promise<Buffer>>();
const animatedMetadataCache = new Map<string, Promise<Metadata>>();

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
    const total = delays.reduce((sum: number, value: number) => sum + value, 0) || pages * 100;
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

async function renderElement(element: CustomElement, timeMs = 0): Promise<any> {
  const textShadow = computeElementTextShadow(element);

  const x = element.transform?.x ?? element.x;
  const y = element.transform?.y ?? element.y;
  const width = element.transform?.width ?? element.width;
  const height = element.transform?.height ?? element.height;
  const rotation = element.transform?.rotation ?? element.rotation ?? 0;
  const scaleX = element.transform?.scaleX ?? element.scaleX ?? 1;
  const scaleY = element.transform?.scaleY ?? element.scaleY ?? 1;
  const anchorX = element.transform?.anchorX ?? element.anchorX ?? 0.5;
  const anchorY = element.transform?.anchorY ?? element.anchorY ?? 0.5;

  const base: any = {
    display: "flex",
    position: "absolute",
    left: px(x),
    top: px(y),
    width: px(width),
    height: px(height),
    opacity: element.opacity ?? 1,
    zIndex: element.zIndex ?? 0,
    boxSizing: "border-box",
    overflow: element.type === "text" ? "visible" : "hidden",
  };

  if (rotation !== 0 || scaleX !== 1 || scaleY !== 1) {
    base.transform = `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
    base.transformOrigin = `${anchorX * 100}% ${anchorY * 100}%`;
  }

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
      lineHeight: element.lineHeight ?? 1.2,
      whiteSpace: "pre-wrap",
    };
    if (element.letterSpacing !== undefined && element.letterSpacing !== 0) {
      style.letterSpacing = px(element.letterSpacing);
    }
    if (textShadow) {
      style.textShadow = textShadow;
    }
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
    const src = await imageToDataUri(element.imageUrl ?? "", Math.max(32, Math.round(Math.max(width, height))));
    const style: Record<string, unknown> = { ...base, objectFit: "cover", borderRadius: px(element.borderRadius) };
    if (element.border) style.border = element.border;
    return { type: "img", props: { src, width, height, style } };
  }

  if (element.type === "progress") {
    const percent = Math.max(0, Math.min(100, element.progressPercent ?? 0));
    const style: Record<string, unknown> = { ...base, display: "flex", background: element.backgroundColor ?? "#27272a", borderRadius: px(element.borderRadius) };
    if (element.border) style.border = element.border;
    return { type: "div", props: { style, children: [{ type: "div", props: { style: { display: "flex", width: `${percent}%`, height: "100%", background: element.progressColor ?? "#a855f7", borderRadius: px(element.borderRadius) } } }] } };
  }

  if (element.type === "particle") {
    const pConfig = element.particleConfig || createDefaultParticleConfig("spark");
    const particles = computeParticles(pConfig, timeMs, { width, height });
    const particleNodes = renderParticlesToSatoriVNodes(particles, { width, height });
    return {
      type: "div",
      props: {
        style: {
          ...base,
          display: "flex",
          overflow: "hidden",
          pointerEvents: "none",
        },
        children: particleNodes,
      },
    };
  }

  const style: Record<string, unknown> = { ...base, display: "flex", borderRadius: px(element.borderRadius) };
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
  const elements = await Promise.all([...canvas.elements].sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0)).map((el) => renderElement(el, timeMs)));
  children.push(...elements);

  if (canvas.particleSystem) {
    const globalParticles = computeParticles(canvas.particleSystem, timeMs, {
      width: canvas.width,
      height: canvas.height,
    });
    const globalNodes = renderParticlesToSatoriVNodes(globalParticles, {
      width: canvas.width,
      height: canvas.height,
    });
    children.push({
      type: "div",
      props: {
        style: {
          display: "flex",
          position: "absolute",
          inset: 0,
          width: px(canvas.width),
          height: px(canvas.height),
          pointerEvents: "none",
          zIndex: 999,
        },
        children: globalNodes,
      },
    });
  }

  const tree = { type: "div", props: { style: { position: "relative", display: "flex", width: px(canvas.width), height: px(canvas.height), overflow: "hidden", background: safeBackground(canvas.background) }, children } };
  const svg = await satori(tree as any, { width: canvas.width, height: canvas.height, fonts: loadFonts(), loadAdditionalAsset: loadSatoriAdditionalAsset });
  return Buffer.from(svg);
}
