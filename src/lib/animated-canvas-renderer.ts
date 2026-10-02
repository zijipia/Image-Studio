import fs from "fs";
import path from "path";
import satori from "satori";
import type { CustomCanvasData, CustomElement } from "./types.js";
import { imageToDataUri } from "./image-generator.js";

let fonts: Array<{ name: string; data: Buffer; weight: 400 | 500; style: "normal" }> | null = null;

function loadFonts() {
  if (fonts) return fonts;
  const dir = path.resolve(process.cwd(), "public/fonts");
  const regularLatinPath = path.join(dir, "Roboto-Regular.ttf");
  const regularLatin = fs.readFileSync(
    fs.existsSync(regularLatinPath) ? regularLatinPath : path.join(dir, "Roboto-Medium-Latin.ttf")
  );
  fonts = [
    { name: "Roboto", data: regularLatin, weight: 400, style: "normal" },
    { name: "Roboto", data: fs.readFileSync(path.join(dir, "Roboto-Vietnamese.ttf")), weight: 400, style: "normal" },
    { name: "Roboto", data: fs.readFileSync(path.join(dir, "Roboto-Medium-Latin.ttf")), weight: 500, style: "normal" },
    { name: "Roboto", data: fs.readFileSync(path.join(dir, "Roboto-Medium-Vn.ttf")), weight: 500, style: "normal" },
  ];
  return fonts;
}

const px = (value: number | undefined, fallback = 0) => `${value ?? fallback}px`;

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
    return {
      type: "div",
      props: {
        style: {
          ...base,
          display: "flex",
          alignItems: "center",
          justifyContent: element.textAlign === "center" ? "center" : element.textAlign === "right" ? "flex-end" : "flex-start",
          color: element.color ?? "#fff",
          background: element.type === "badge" ? element.backgroundColor : undefined,
          border: element.border,
          borderRadius: px(element.borderRadius),
          fontSize: px(element.fontSize, 24),
          fontWeight: element.fontWeight ?? 400,
          lineHeight: 1.2,
          whiteSpace: "pre-wrap",
          padding: element.type === "badge" ? "0 10px" : undefined,
        },
        children: element.content ?? "",
      },
    };
  }

  if (element.type === "image" || element.type === "avatar") {
    const src = await imageToDataUri(element.imageUrl ?? "", Math.max(32, Math.round(Math.max(element.width, element.height))));
    return {
      type: "img",
      props: {
        src,
        width: element.width,
        height: element.height,
        style: {
          ...base,
          objectFit: "cover",
          borderRadius: px(element.borderRadius),
          border: element.border,
        },
      },
    };
  }

  if (element.type === "progress") {
    const percent = Math.max(0, Math.min(100, element.progressPercent ?? 0));
    return {
      type: "div",
      props: {
        style: { ...base, background: element.backgroundColor ?? "#27272a", borderRadius: px(element.borderRadius), border: element.border },
        children: [{
          type: "div",
          props: {
            style: { width: `${percent}%`, height: "100%", background: element.progressColor ?? "#a855f7", borderRadius: px(element.borderRadius) },
          },
        }],
      },
    };
  }

  return {
    type: "div",
    props: {
      style: { ...base, background: element.backgroundColor, border: element.border, borderRadius: px(element.borderRadius) },
    },
  };
}

export async function renderCustomCanvasSvg(canvas: CustomCanvasData): Promise<Buffer> {
  const children = await Promise.all(
    [...canvas.elements]
      .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
      .map(renderElement)
  );

  const tree = {
    type: "div",
    props: {
      style: {
        position: "relative",
        display: "flex",
        width: px(canvas.width),
        height: px(canvas.height),
        overflow: "hidden",
        background: canvas.background,
      },
      children,
    },
  };

  const svg = await satori(tree as any, {
    width: canvas.width,
    height: canvas.height,
    fonts: loadFonts(),
  });

  return Buffer.from(svg);
}
