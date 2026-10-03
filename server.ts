import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { dispatchGenerate } from "./src/lib/animated-generator";
import { getStats, incrementGeneratedCount } from "./src/server/stats";
import { PRESETS, getPresetById, DEFAULT_TEMPLATE_VARIABLES } from "./src/lib/animation-presets";
import type { AnyGenerateRequest } from "./src/lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "15mb" }));

  // Stats Route
  app.get("/api/stats", (_req, res) => {
    res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
    return res.status(200).json(getStats());
  });

  // API Route for static and animated image generation.
  app.post("/api/generate", async (req, res) => {
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
      console.error("[server] Generation error:", error);
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return res.status(500).json({ error: message });
    }
  });

  // Dedicated API endpoint for extracting a single PNG frame from animation (POST or GET)
  app.all(["/api/animation/frame", "/api/animated/frame"], async (req, res) => {
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
      console.error("[server] Frame generation error:", error);
      const message = error instanceof Error ? error.message : "Internal Server Error";
      return res.status(500).json({ error: message });
    }
  });

  const isProd = process.env.NODE_ENV === "production";
  if (!isProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, "dist")));
    app.get("*", (_req, res) => {
      res.sendFile(path.resolve(__dirname, "dist", "index.html"));
    });
  }

  app.listen(port, "0.0.0.0", () => {
    console.log(`Image Studio server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
