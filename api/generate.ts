import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { AnyGenerateRequest } from "../src/lib/types.js";
import { dispatchGenerate } from "../src/lib/animated-generator.js";
import { incrementGeneratedCount } from "../src/server/stats.js";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method Not Allowed. Use POST." });
  }

  try {
    const body = req.body as AnyGenerateRequest;

    if (!body) {
      return res.status(400).json({ error: "Invalid payload: request body is required." });
    }

    // Support extracting single PNG frame from animation via query or body
    if (body.type === "animated" && body.data) {
      const qFrame = req.query.frame ?? req.query.frameIndex;
      const qTime = req.query.time ?? req.query.frameTime;
      const qFormat = req.query.format;

      if (qFrame !== undefined) {
        body.data.frameIndex = parseInt(qFrame as string, 10);
        body.data.format = "png";
      }
      if (qTime !== undefined) {
        body.data.frameTime = parseFloat(qTime as string);
        body.data.format = "png";
      }
      if (qFormat === "png") {
        body.data.format = "png";
      }
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
    console.error("[api/generate] Generation error:", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    return res.status(500).json({ error: message });
  }
}
