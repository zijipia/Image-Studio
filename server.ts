import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { dispatchGenerateImage } from "./src/lib/image-generator";
import type { AnyGenerateRequest } from "./src/lib/types";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const port = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: "15mb" }));

  // API Route for image generation (Song, Profile, Leaderboard, Quote)
  app.post("/api/generate", async (req, res) => {
    try {
      const body = req.body as AnyGenerateRequest;

      if (!body) {
        return res.status(400).json({ error: "Invalid payload: request body is required." });
      }

      const { png, height, filename } = await dispatchGenerateImage(body);

      res.setHeader("Content-Type", "image/png");
      res.setHeader("Content-Length", png.length.toString());
      res.setHeader("X-Image-Height", height.toString());
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${encodeURIComponent(filename)}"`
      );

      return res.status(200).send(png);
    } catch (error) {
      console.error("[server] Generation error:", error);
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
