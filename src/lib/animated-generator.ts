import sharp from "sharp";
import type { AnimatedGenerateData, AnimatedGenerateRequest, AnyGenerateRequest, CustomCanvasData } from "./types.js";
import { dispatchGenerateImage } from "./image-generator.js";
import { renderCustomCanvasSvg } from "./animated-canvas-renderer.js";
import { compileTimelineToFrames } from "./timeline-interpolator.js";

export interface GenerateResult { buffer: Buffer; width: number; height: number; mime: "image/png" | "image/gif" | "image/webp"; filename: string; }
const MAX_FRAMES = 60;
const MAX_FRAME_DELAY = 65_535;
const MAX_TOTAL_DURATION = 10_000;
const DEFAULT_DELAY = 120;
const FRAME_RENDER_CONCURRENCY = 3;

function safeFilename(value: string, fallback: string) { const normalized = value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); return normalized || fallback; }
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
  let frames = data.frames;
  let delay = data.delay;

  // Support Compact Timeline Format (canvas + tracks) - ~98% smaller payload!
  if ((!frames || !frames.length) && data.canvas) {
    const compiled = compileTimelineToFrames({
      canvas: data.canvas,
      tracks: data.tracks || [],
      duration: data.duration,
      fps: data.fps,
      templateVariables: data.templateVariables,
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
  const format = data.format ?? "gif";
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
