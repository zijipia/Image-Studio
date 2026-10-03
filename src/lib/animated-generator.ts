import sharp from "sharp";
import type { AnimatedGenerateData, AnimatedGenerateRequest, AnyGenerateRequest, CustomCanvasData } from "./types.js";
import { dispatchGenerateImage } from "./image-generator.js";
import { renderCustomCanvasSvg } from "./animated-canvas-renderer.js";
import { buildFrame, compileTimelineToFrames, parseTemplateString } from "./timeline-interpolator.js";
import { DEFAULT_TEMPLATE_VARIABLES } from "./animation-presets.js";

export interface GenerateResult { buffer: Buffer; width: number; height: number; mime: "image/png" | "image/gif" | "image/webp"; filename: string; }
const MAX_FRAMES = 60;
const MAX_FRAME_DELAY = 65_535;
const MAX_TOTAL_DURATION = 10_000;
const DEFAULT_DELAY = 120;
const FRAME_RENDER_CONCURRENCY = 3;

function safeFilename(value: string | undefined, fallback: string) {
  const normalized = (value || "").trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || fallback;
}
function normalizeDelays(delay: AnimatedGenerateData["delay"], frameCount: number) {
  const delays = Array.isArray(delay) ? [...delay] : Array.from({ length: frameCount }, () => delay ?? DEFAULT_DELAY);
  if (delays.length !== frameCount) throw new Error(`Animated delay array must contain exactly ${frameCount} values; received ${delays.length}.`);
  for (const value of delays) if (!Number.isInteger(value) || value < 10 || value > MAX_FRAME_DELAY) throw new Error(`Animated frame delays must be integers between 10 and ${MAX_FRAME_DELAY} ms.`);
  if (delays.reduce((sum, value) => sum + value, 0) > MAX_TOTAL_DURATION) throw new Error(`Animated output duration cannot exceed ${MAX_TOTAL_DURATION} ms.`);
  return delays;
}
async function mapWithConcurrency<T, R>(items: T[], concurrency: number, worker: (item: T, index: number) => Promise<R>): Promise<R[]> {
  const results = new Array<R>(items.length); let nextIndex = 0;
  async function consume() { while (true) { const index = nextIndex++; if (index >= items.length) return; results[index] = await worker(items[index], index); } }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, consume)); return results;
}
async function encodeAnimatedSvgFrames(frames: Buffer[], format: "gif" | "webp", delays: number[], loop: number) {
  const animated = sharp(frames, { join: { animated: true } });
  if (format === "gif") return animated.gif({ delay: delays, loop, keepDuplicateFrames: true, reuse: true }).toBuffer();
  return animated.webp({ delay: delays, loop, effort: 4, quality: 90 }).toBuffer();
}

export async function generateAnimatedImage(data: AnimatedGenerateData): Promise<GenerateResult> {
  const isSingleFrame =
    data.format === "png" ||
    data.frameIndex !== undefined ||
    data.frameTime !== undefined;

  const templateVariables = {
    ...DEFAULT_TEMPLATE_VARIABLES,
    ...(data.templateVariables || {}),
  };

  let frames = data.frames;
  let delay = data.delay;

  // Single Frame PNG Export branch: instant interpolation & exact rendering
  if (isSingleFrame) {
    let targetTime = 0;
    if (data.frameTime !== undefined) {
      targetTime = Math.max(0, data.frameTime);
    } else if (data.frameIndex !== undefined) {
      const fps = data.fps || 12;
      targetTime = Math.max(0, Math.round((data.frameIndex * 1000) / fps));
    }

    let targetFrame: CustomCanvasData | undefined;

    // Fast path: if compact canvas is provided, directly evaluate target frame without compiling unnecessary frames
    if (data.canvas) {
      const raw = buildFrame(data.canvas, data.tracks || [], targetTime);
      targetFrame = {
        ...raw,
        backgroundImageUrl: raw.backgroundImageUrl
          ? parseTemplateString(raw.backgroundImageUrl, templateVariables)
          : undefined,
        elements: raw.elements.map((el) => ({
          ...el,
          content: el.content ? parseTemplateString(el.content, templateVariables) : undefined,
          imageUrl: el.imageUrl ? parseTemplateString(el.imageUrl, templateVariables) : undefined,
        })),
      };
    } else {
      // If frames array was provided
      if (!frames || !frames.length) {
        throw new Error("Single frame generation requires either canvas/tracks or a frames array.");
      }
      const frameDelays: number[] = Array.isArray(delay)
        ? (delay as number[])
        : Array.from({ length: frames.length }, () => (typeof delay === "number" ? delay : DEFAULT_DELAY));

      let targetIndex = 0;
      if (data.frameIndex !== undefined) {
        targetIndex = Math.max(0, Math.min(frames.length - 1, Math.round(data.frameIndex)));
        targetTime = frameDelays.slice(0, targetIndex).reduce((sum, d) => sum + d, 0);
      } else if (data.frameTime !== undefined) {
        let elapsed = 0;
        targetIndex = frames.length - 1;
        for (let i = 0; i < frameDelays.length; i++) {
          const d = frameDelays[i];
          if (data.frameTime <= elapsed + d) {
            targetIndex = i;
            break;
          }
          elapsed += d;
        }
        targetTime = data.frameTime;
      }
      targetFrame = frames[targetIndex];
    }

    if (!targetFrame || targetFrame.width <= 0 || targetFrame.height <= 0) {
      throw new Error("Target frame must define a positive width and height.");
    }

    const renderedSvg = await renderCustomCanvasSvg(targetFrame as CustomCanvasData, targetTime);
    const buffer = await sharp(renderedSvg).png().toBuffer();

    const frameTag = data.frameTime !== undefined
      ? `${Math.round(data.frameTime)}ms`
      : data.frameIndex !== undefined
      ? `frame-${data.frameIndex}`
      : "frame";

    return {
      buffer,
      width: targetFrame.width,
      height: targetFrame.height,
      mime: "image/png",
      filename: `${safeFilename(data.title, "animation-frame")}-${frameTag}.png`,
    };
  }
  // Support Compact Timeline Format (canvas + tracks) for multi-frame animations
  if ((!frames || !frames.length) && data.canvas) {
    const compiled = compileTimelineToFrames({
      canvas: data.canvas,
      tracks: data.tracks || [],
      duration: data.duration,
      fps: data.fps,
      templateVariables,
    });
    frames = compiled.frames;
    delay = data.delay ?? compiled.frameDelay;
  }

  if (!frames || !frames.length) throw new Error("Animated generation requires at least one frame or a canvas with tracks.");

  if (frames.length > MAX_FRAMES) throw new Error(`Animated generation supports at most ${MAX_FRAMES} frames per request.`);
  const firstFrame = frames[0];
  if (!firstFrame || firstFrame.width <= 0 || firstFrame.height <= 0) throw new Error("Animated frames must define a positive width and height.");
  for (const [index, frame] of frames.entries()) if (frame.width !== firstFrame.width || frame.height !== firstFrame.height) throw new Error(`Animated frame ${index} has ${frame.width}x${frame.height}; all frames must use ${firstFrame.width}x${firstFrame.height}.`);
  const delays = normalizeDelays(delay, frames.length);
  const loop = data.loop ?? 0;
  if (!Number.isInteger(loop) || loop < 0 || loop > 65_535) throw new Error("Animated loop must be an integer between 0 and 65535.");
  const format: "gif" | "webp" = data.format === "webp" ? "webp" : "gif";
  const frameTimes: number[] = [];
  let elapsed = 0;
  for (const delay of delays) { frameTimes.push(elapsed); elapsed += delay; }
  const renderedSvgFrames = await mapWithConcurrency(frames as CustomCanvasData[], FRAME_RENDER_CONCURRENCY, (frame, index) => renderCustomCanvasSvg(frame, frameTimes[index]));
  const buffer = await encodeAnimatedSvgFrames(renderedSvgFrames, format, delays, loop);
  const extension = format === "gif" ? "gif" : "webp";
  return { buffer, width: firstFrame.width, height: firstFrame.height, mime: format === "gif" ? "image/gif" : "image/webp", filename: `${safeFilename(data.title, "animated-image")}.${extension}` };
}

export async function dispatchGenerate(req: AnyGenerateRequest): Promise<GenerateResult> {
  if ((req as AnimatedGenerateRequest).type === "animated") return generateAnimatedImage((req as AnimatedGenerateRequest).data);
  const result = await dispatchGenerateImage(req);
  return { buffer: result.png, width: 0, height: result.height, mime: "image/png", filename: result.filename };
}
