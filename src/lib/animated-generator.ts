import sharp from "sharp";
import { dispatchGenerateImage, generateCustomCanvasImage } from "./image-generator.js";
import type {
  AnimatedGenerateData,
  AnyGenerateRequest,
  CustomCanvasData,
} from "./types.js";

export interface GenerateResult {
  buffer: Buffer;
  width: number;
  height: number;
  mime: "image/png" | "image/gif" | "image/webp";
  filename: string;
}

const MAX_FRAMES = 60;
const MAX_FRAME_DELAY = 65_535;
const MAX_TOTAL_DURATION = 10_000;
const DEFAULT_DELAY = 120;
const FRAME_RENDER_CONCURRENCY = 3;

function safeFilename(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized || fallback;
}

function normalizeDelays(
  delay: AnimatedGenerateData["delay"],
  frameCount: number
): number[] {
  const delays = Array.isArray(delay)
    ? [...delay]
    : Array.from({ length: frameCount }, () => delay ?? DEFAULT_DELAY);

  if (delays.length !== frameCount) {
    throw new Error(
      `Animated delay array must contain exactly ${frameCount} values; received ${delays.length}.`
    );
  }

  for (const value of delays) {
    if (!Number.isInteger(value) || value < 10 || value > MAX_FRAME_DELAY) {
      throw new Error(
        `Animated frame delays must be integers between 10 and ${MAX_FRAME_DELAY} ms.`
      );
    }
  }

  const totalDuration = delays.reduce((sum, value) => sum + value, 0);
  if (totalDuration > MAX_TOTAL_DURATION) {
    throw new Error(
      `Animated output duration cannot exceed ${MAX_TOTAL_DURATION} ms.`
    );
  }

  return delays;
}

async function mapWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  worker: (item: T, index: number) => Promise<R>
): Promise<R[]> {
  const results = new Array<R>(items.length);
  let nextIndex = 0;

  async function consume(): Promise<void> {
    while (true) {
      const index = nextIndex++;
      if (index >= items.length) return;
      results[index] = await worker(items[index], index);
    }
  }

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => consume()
  );

  await Promise.all(workers);
  return results;
}

async function encodeAnimatedFrames(
  frames: Buffer[],
  format: "gif" | "webp",
  delays: number[],
  loop: number
): Promise<Buffer> {
  if (frames.length === 0) {
    throw new Error("Animated output requires at least one frame.");
  }

  // Sharp/libvips accepts an array of images with join.animated enabled and
  // turns the inputs into a multi-page image suitable for animated output.
  const animated = sharp(frames, {
    join: {
      animated: true,
    },
  });

  if (format === "gif") {
    return animated
      .gif({
        delay: delays,
        loop,
        keepDuplicateFrames: true,
        reuse: true,
      })
      .toBuffer();
  }

  return animated
    .webp({
      delay: delays,
      loop,
      effort: 4,
      quality: 90,
    })
    .toBuffer();
}

export async function generateAnimatedImage(
  data: AnimatedGenerateData
): Promise<GenerateResult> {
  const frames = data.frames || [];

  if (frames.length === 0) {
    throw new Error("Animated generation requires at least one frame.");
  }

  if (frames.length > MAX_FRAMES) {
    throw new Error(
      `Animated generation supports at most ${MAX_FRAMES} frames per request.`
    );
  }

  const firstFrame = frames[0];
  if (!firstFrame?.width || !firstFrame?.height) {
    throw new Error("Animated frames must define a positive width and height.");
  }

  if (firstFrame.width <= 0 || firstFrame.height <= 0) {
    throw new Error("Animated frame dimensions must be positive integers.");
  }

  for (const [index, frame] of frames.entries()) {
    if (frame.width !== firstFrame.width || frame.height !== firstFrame.height) {
      throw new Error(
        `Animated frame ${index} has ${frame.width}x${frame.height}; all frames must use ${firstFrame.width}x${firstFrame.height}.`
      );
    }
  }

  const delays = normalizeDelays(data.delay, frames.length);
  const loop = data.loop ?? 0;

  if (!Number.isInteger(loop) || loop < 0 || loop > 65_535) {
    throw new Error("Animated loop must be an integer between 0 and 65535.");
  }

  const format = data.format ?? "gif";

  const renderedFrames = await mapWithConcurrency(
    frames,
    FRAME_RENDER_CONCURRENCY,
    async (frame: CustomCanvasData) => {
      const rendered = await generateCustomCanvasImage(frame);
      return rendered.png;
    }
  );

  const buffer = await encodeAnimatedFrames(
    renderedFrames,
    format,
    delays,
    loop
  );

  const extension = format === "gif" ? "gif" : "webp";
  const mime = format === "gif" ? "image/gif" : "image/webp";
  const filename = `${safeFilename(data.title, "animated-image")}.${extension}`;

  return {
    buffer,
    width: firstFrame.width,
    height: firstFrame.height,
    mime,
    filename,
  };
}

/**
 * Unified dispatcher. Static generators continue to use the existing image
 * generator unchanged, while animated requests are handled by the animation
 * pipeline above.
 */
export async function dispatchGenerate(
  req: AnyGenerateRequest
): Promise<GenerateResult> {
  if (req.type === "animated") {
    return generateAnimatedImage(req.data);
  }

  const result = await dispatchGenerateImage(req);
  return {
    buffer: result.png,
    width: 0,
    height: result.height,
    mime: "image/png",
    filename: result.filename,
  };
}
