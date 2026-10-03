import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getStats } from "../src/server/stats.js";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader("Cache-Control", "no-cache, no-store, must-revalidate");
  return res.status(200).json(getStats());
}
