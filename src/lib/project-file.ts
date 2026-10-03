import type { CustomCanvasData, CustomElement } from "./types";
import type { Track } from "./timeline-interpolator";

export interface IStudioProjectFile {
  version: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  canvas: CustomCanvasData;
  elements: CustomElement[];
  tracks: Track[];
  variables: Record<string, string>;
  assets?: Array<{ id: string; name: string; url: string; type: string }>;
  export: {
    duration: number;
    fps: number;
    format: "gif" | "webp";
  };
}

const LOCAL_STORAGE_KEY = "istudio_saved_project_v1";

/**
 * Builds a validated .istudio project file structure
 */
export function createIStudioProject(
  name: string,
  canvas: CustomCanvasData,
  tracks: Track[],
  variables: Record<string, string>,
  exportSettings: { duration: number; fps: number; format: "gif" | "webp" }
): IStudioProjectFile {
  const now = new Date().toISOString();
  return {
    version: 1,
    name: name.trim() || "my-animation",
    createdAt: now,
    updatedAt: now,
    canvas,
    elements: canvas.elements || [],
    tracks: tracks || [],
    variables: variables || {},
    assets: [],
    export: {
      duration: exportSettings.duration || 2000,
      fps: exportSettings.fps || 15,
      format: exportSettings.format || "gif",
    },
  };
}

/**
 * Download the project as a `.istudio` JSON file
 */
export function downloadIStudioFile(project: IStudioProjectFile, customFilename?: string): void {
  const filename =
    customFilename ||
    `${(project.name || "animation").replace(/[/\\?%*:|"<>]/g, "-")}.istudio`;

  const jsonString = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonString], { type: "application/json;charset=utf-8" });
  const url = URL.createObjectURL(blob);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename.endsWith(".istudio") ? filename : `${filename}.istudio`;
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

/**
 * Validates and parses raw text (from file upload or drag-and-drop) into an IStudioProjectFile
 */
export function parseIStudioFile(fileContent: string): {
  success: boolean;
  project?: IStudioProjectFile;
  error?: string;
} {
  try {
    const parsed = JSON.parse(fileContent);

    if (!parsed || typeof parsed !== "object") {
      return { success: false, error: "Tệp không hợp lệ: Dữ liệu JSON rỗng hoặc sai định dạng." };
    }

    if (parsed.version !== 1 && !parsed.canvas && !parsed.tracks) {
      return {
        success: false,
        error: "Tệp không phải định dạng .istudio hợp lệ (thiếu canvas hoặc version).",
      };
    }

    // Normalizing canvas & elements
    const canvas: CustomCanvasData = {
      title: parsed.canvas?.title || parsed.name || "Imported Animation",
      width: Number(parsed.canvas?.width) || 930,
      height: Number(parsed.canvas?.height) || 280,
      background: parsed.canvas?.background || "#090614",
      backgroundImageUrl: parsed.canvas?.backgroundImageUrl,
      particleSystem: parsed.canvas?.particleSystem,
      elements: Array.isArray(parsed.canvas?.elements)
        ? parsed.canvas.elements
        : Array.isArray(parsed.elements)
        ? parsed.elements
        : [],
    };

    const tracks: Track[] = Array.isArray(parsed.tracks) ? parsed.tracks : [];
    const variables: Record<string, string> =
      parsed.variables && typeof parsed.variables === "object" ? parsed.variables : {};

    const exportSettings = {
      duration: Number(parsed.export?.duration) || Number(parsed.duration) || 2000,
      fps: Number(parsed.export?.fps) || Number(parsed.fps) || 15,
      format: (parsed.export?.format === "webp" || parsed.format === "webp" ? "webp" : "gif") as
        | "gif"
        | "webp",
    };

    const project: IStudioProjectFile = {
      version: 1,
      name: parsed.name || canvas.title || "imported-project",
      createdAt: parsed.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      canvas,
      elements: canvas.elements,
      tracks,
      variables,
      assets: Array.isArray(parsed.assets) ? parsed.assets : [],
      export: exportSettings,
    };

    return { success: true, project };
  } catch (err: any) {
    return {
      success: false,
      error: `Lỗi đọc tệp JSON: ${err?.message || "Cú pháp không hợp lệ"}`,
    };
  }
}

/**
 * Saves current working project to LocalStorage for autosave / quick recovery
 */
export function saveProjectToLocalStorage(project: IStudioProjectFile): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(project));
  } catch (e) {
    console.warn("Could not save project to localStorage:", e);
  }
}

/**
 * Loads last saved project from LocalStorage
 */
export function loadProjectFromLocalStorage(): IStudioProjectFile | null {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!raw) return null;
    const res = parseIStudioFile(raw);
    return res.success && res.project ? res.project : null;
  } catch (e) {
    console.warn("Could not load project from localStorage:", e);
    return null;
  }
}
