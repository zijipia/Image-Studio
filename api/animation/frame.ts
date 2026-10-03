import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { AnyGenerateRequest } from "../../src/lib/types.js";
import { dispatchGenerate } from "../../src/lib/animated-generator.js";
import { incrementGeneratedCount } from "../../src/server/stats.js";
import { PRESETS, getPresetById, DEFAULT_TEMPLATE_VARIABLES } from "../../src/lib/animation-presets.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    let body: AnyGenerateRequest;

    if (req.method === "GET") {
      const presetId = (req.query.preset as string) || "welcome";
      const preset = getPresetById(presetId) || PRESETS[0];
      const time = req.query.time
        ? parseFloat(req.query.time as string)
        : req.query.frameTime
        ? parseFloat(req.query.frameTime as string)
        : 350;
      const frameIndex = req.query.frame !== undefined
        ? parseInt(req.query.frame as string, 10)
        : req.query.frameIndex !== undefined
        ? parseInt(req.query.frameIndex as string, 10)
        : undefined;

      const templateVariables: Record<string, string> = {
        ...DEFAULT_TEMPLATE_VARIABLES,
      };
      for (const [k, v] of Object.entries(req.query)) {
        if (typeof v === "string" && k !== "preset" && k !== "time" && k !== "frameTime" && k !== "frame" && k !== "frameIndex") {
          templateVariables[k] = v;
        }
      }

      body = {
        type: "animated",
        data: {
          title: preset.canvas.title,
          format: "png",
          frameTime: frameIndex !== undefined ? undefined : time,
          frameIndex,
          canvas: preset.canvas,
          tracks: preset.tracks,
          templateVariables,
        },
      };
    } else if (req.method === "POST") {
      const reqBody = req.body || {};
      let animData: any = reqBody.type === "animated" && reqBody.data ? reqBody.data : reqBody;

      const qFrame = req.query.frame ?? req.query.frameIndex;
      const qTime = req.query.time ?? req.query.frameTime;

      let frameTime = animData.frameTime ?? (qTime !== undefined ? parseFloat(qTime as string) : undefined);
      let frameIndex = animData.frameIndex ?? (qFrame !== undefined ? parseInt(qFrame as string, 10) : undefined);

      if (frameTime === undefined && frameIndex === undefined) {
        frameTime = 0;
      }

      body = {
        type: "animated",
        data: {
          ...animData,
          format: "png",
          frameTime,
          frameIndex,
        },
      };
    } else {
      res.setHeader("Allow", "GET, POST");
      return res.status(405).json({ error: "Method Not Allowed. Use GET or POST." });
    }

    const { buffer, height, mime, filename } = await dispatchGenerate(body);
    const totalCount = incrementGeneratedCount();

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Length", buffer.length.toString());
    res.setHeader("X-Image-Height", height.toString());
    res.setHeader("X-Total-Generated", totalCount.toString());
    res.setHeader("Access-Control-Expose-Headers", "X-Total-Generated, X-Image-Height");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${encodeURIComponent(filename)}"`
    );

    return res.status(200).send(buffer);
  } catch (error) {
    console.error("[api/animation/frame] Generation error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}
