import fs from "fs";
import path from "path";

const STATS_FILE = path.resolve(process.cwd(), ".app-stats.json");

export interface AppStats {
  totalGenerated: number;
  lastGeneratedAt: string | null;
}

let memoryStats: AppStats = {
  totalGenerated: 0,
  lastGeneratedAt: null,
};

// Initialize from file if available
try {
  if (fs.existsSync(STATS_FILE)) {
    const raw = fs.readFileSync(STATS_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (typeof parsed.totalGenerated === "number") {
      memoryStats = {
        totalGenerated: parsed.totalGenerated,
        lastGeneratedAt: parsed.lastGeneratedAt || null,
      };
    }
  }
} catch {
  // Fail-safe if running in read-only environment
}

export function getStats(): AppStats {
  return { ...memoryStats };
}

export function incrementGeneratedCount(): number {
  memoryStats.totalGenerated += 1;
  memoryStats.lastGeneratedAt = new Date().toISOString();

  try {
    fs.writeFileSync(STATS_FILE, JSON.stringify(memoryStats, null, 2), "utf-8");
  } catch {
    // Fail-safe in read-only environments
  }

  return memoryStats.totalGenerated;
}
