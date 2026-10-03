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
