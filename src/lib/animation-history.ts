import type { CustomCanvasData, CustomElement } from "./types";
import type { Track, Keyframe, KeyframeProperty } from "./timeline-interpolator";

export interface EditorSnapshotState {
  canvas: CustomCanvasData;
  tracks: Track[];
  variables: Record<string, string>;
  duration: number;
  fps: number;
  format: "gif" | "webp";
  selectedId?: string;
  selectedKeyframeId?: string | null;
}

export type AnimationCommand =
  | {
      type: "MOVE_ELEMENT";
      description: string;
      elementId: string;
      from: { x: number; y: number };
      to: { x: number; y: number };
      fromKf?: { id: string; time: number; x: number; y: number };
      toKf?: { id: string; time: number; x: number; y: number };
    }
  | {
      type: "RESIZE_ELEMENT";
      description: string;
      elementId: string;
      from: { width: number; height: number };
      to: { width: number; height: number };
      fromKf?: { id: string; time: number; width: number; height: number };
      toKf?: { id: string; time: number; width: number; height: number };
    }
  | {
      type: "UPDATE_ELEMENT";
      description: string;
      elementId: string;
      from: Partial<CustomElement>;
      to: Partial<CustomElement>;
    }
  | {
      type: "ADD_ELEMENT";
      description: string;
      element: CustomElement;
      track?: Track;
      index?: number;
    }
  | {
      type: "DELETE_ELEMENT";
      description: string;
      element: CustomElement;
      track?: Track;
      index: number;
    }
  | {
      type: "REORDER_ELEMENTS";
      description: string;
      fromIndex: number;
      toIndex: number;
    }
  | {
      type: "MOVE_KEYFRAME";
      description: string;
      elementId: string;
      keyframeId: string;
      fromTime: number;
      toTime: number;
    }
  | {
      type: "UPDATE_KEYFRAME";
      description: string;
      elementId: string;
      keyframeId: string;
      property: KeyframeProperty | "easing";
      fromValue: any;
      toValue: any;
    }
  | {
      type: "ADD_KEYFRAME";
      description: string;
      elementId: string;
      keyframe: Keyframe;
    }
  | {
      type: "DELETE_KEYFRAME";
      description: string;
      elementId: string;
      keyframe: Keyframe;
      index: number;
    }
  | {
      type: "UPDATE_CANVAS";
      description: string;
      from: Partial<CustomCanvasData>;
      to: Partial<CustomCanvasData>;
    }
  | {
      type: "UPDATE_SETTINGS";
      description: string;
      from: { duration?: number; fps?: number; format?: "gif" | "webp" };
      to: { duration?: number; fps?: number; format?: "gif" | "webp" };
    }
  | {
      type: "UPDATE_VARIABLES";
      description: string;
      from: Record<string, string>;
      to: Record<string, string>;
    }
  | {
      type: "BATCH";
      description: string;
      commands: AnimationCommand[];
    };

/**
 * Apply or Undo an individual command onto the editor state cleanly without snapshotting everything.
 */
export function executeCommand(
  state: EditorSnapshotState,
  cmd: AnimationCommand,
  isUndo: boolean
): EditorSnapshotState {
  switch (cmd.type) {
    case "MOVE_ELEMENT": {
      const pos = isUndo ? cmd.from : cmd.to;
      const kfPos = isUndo ? cmd.fromKf : cmd.toKf;

      const nextElements = state.canvas.elements.map((el) =>
        el.id === cmd.elementId ? { ...el, x: pos.x, y: pos.y } : el
      );

      let nextTracks = state.tracks;
      if (kfPos) {
        nextTracks = state.tracks.map((t) => {
          if (t.elementId !== cmd.elementId) return t;
          return {
            ...t,
            keyframes: t.keyframes.map((k) =>
              k.id === kfPos.id ? { ...k, x: kfPos.x, y: kfPos.y } : k
            ),
          };
        });
      }

      return {
        ...state,
        canvas: { ...state.canvas, elements: nextElements },
        tracks: nextTracks,
        selectedId: cmd.elementId,
      };
    }

    case "RESIZE_ELEMENT": {
      const size = isUndo ? cmd.from : cmd.to;
      const kfSize = isUndo ? cmd.fromKf : cmd.toKf;

      const nextElements = state.canvas.elements.map((el) =>
        el.id === cmd.elementId ? { ...el, width: size.width, height: size.height } : el
      );

      let nextTracks = state.tracks;
      if (kfSize) {
        nextTracks = state.tracks.map((t) => {
          if (t.elementId !== cmd.elementId) return t;
          return {
            ...t,
            keyframes: t.keyframes.map((k) =>
              k.id === kfSize.id ? { ...k, width: kfSize.width, height: kfSize.height } : k
            ),
          };
        });
      }

      return {
        ...state,
        canvas: { ...state.canvas, elements: nextElements },
        tracks: nextTracks,
        selectedId: cmd.elementId,
      };
    }

    case "UPDATE_ELEMENT": {
      const patch = isUndo ? cmd.from : cmd.to;
      const nextElements = state.canvas.elements.map((el) =>
        el.id === cmd.elementId ? { ...el, ...patch } : el
      );
      return {
        ...state,
        canvas: { ...state.canvas, elements: nextElements },
        selectedId: cmd.elementId,
      };
    }

    case "ADD_ELEMENT": {
      if (isUndo) {
        // Reverse of ADD is remove
        const nextElements = state.canvas.elements.filter((el) => el.id !== cmd.element.id);
        const nextTracks = state.tracks.filter((t) => t.elementId !== cmd.element.id);
        return {
          ...state,
          canvas: { ...state.canvas, elements: nextElements },
          tracks: nextTracks,
          selectedId: nextElements[nextElements.length - 1]?.id || "",
        };
      } else {
        // Forward ADD
        const nextElements = [...state.canvas.elements];
        if (typeof cmd.index === "number" && cmd.index >= 0 && cmd.index <= nextElements.length) {
          nextElements.splice(cmd.index, 0, cmd.element);
        } else {
          nextElements.push(cmd.element);
        }
        const nextTracks = [...state.tracks];
        if (cmd.track && !nextTracks.some((t) => t.elementId === cmd.element.id)) {
          nextTracks.push(cmd.track);
        }
        return {
          ...state,
          canvas: { ...state.canvas, elements: nextElements },
          tracks: nextTracks,
          selectedId: cmd.element.id,
        };
      }
    }

    case "DELETE_ELEMENT": {
      if (isUndo) {
        // Reverse of DELETE is restore
        const nextElements = [...state.canvas.elements];
        const idx = Math.min(cmd.index, nextElements.length);
        nextElements.splice(idx, 0, cmd.element);

        const nextTracks = [...state.tracks];
        if (cmd.track && !nextTracks.some((t) => t.elementId === cmd.element.id)) {
          nextTracks.push(cmd.track);
        }
        return {
          ...state,
          canvas: { ...state.canvas, elements: nextElements },
          tracks: nextTracks,
          selectedId: cmd.element.id,
        };
      } else {
        // Forward DELETE
        const nextElements = state.canvas.elements.filter((el) => el.id !== cmd.element.id);
        const nextTracks = state.tracks.filter((t) => t.elementId !== cmd.element.id);
        return {
          ...state,
          canvas: { ...state.canvas, elements: nextElements },
          tracks: nextTracks,
          selectedId: nextElements[0]?.id || "",
        };
      }
    }

    case "REORDER_ELEMENTS": {
      const from = isUndo ? cmd.toIndex : cmd.fromIndex;
      const to = isUndo ? cmd.fromIndex : cmd.toIndex;
      if (from === to || from < 0 || to < 0) return state;

      const nextElements = [...state.canvas.elements];
      const [removed] = nextElements.splice(from, 1);
      if (!removed) return state;
      nextElements.splice(to, 0, removed);
      const updated = nextElements.map((el, i) => ({ ...el, zIndex: i }));

      return {
        ...state,
        canvas: { ...state.canvas, elements: updated },
      };
    }

    case "MOVE_KEYFRAME": {
      const targetTime = isUndo ? cmd.fromTime : cmd.toTime;
      const nextTracks = state.tracks.map((t) => {
        if (t.elementId !== cmd.elementId) return t;
        return {
          ...t,
          keyframes: t.keyframes
            .map((k) =>
              (k.id || `${cmd.elementId}-${k.time}`) === cmd.keyframeId
                ? { ...k, time: targetTime }
                : k
            )
            .sort((a, b) => a.time - b.time),
        };
      });
      return {
        ...state,
        tracks: nextTracks,
        selectedId: cmd.elementId,
        selectedKeyframeId: cmd.keyframeId,
      };
    }

    case "UPDATE_KEYFRAME": {
      const val = isUndo ? cmd.fromValue : cmd.toValue;
      const nextTracks = state.tracks.map((t) => {
        if (t.elementId !== cmd.elementId) return t;
        return {
          ...t,
          keyframes: t.keyframes.map((k) =>
            (k.id || `${cmd.elementId}-${k.time}`) === cmd.keyframeId
              ? { ...k, [cmd.property]: val }
              : k
          ),
        };
      });
      return {
        ...state,
        tracks: nextTracks,
        selectedId: cmd.elementId,
        selectedKeyframeId: cmd.keyframeId,
      };
    }

    case "ADD_KEYFRAME": {
      if (isUndo) {
        // Reverse of ADD_KEYFRAME is delete
        const nextTracks = state.tracks.map((t) => {
          if (t.elementId !== cmd.elementId) return t;
          return {
            ...t,
            keyframes: t.keyframes.filter(
              (k) => (k.id || `${cmd.elementId}-${k.time}`) !== (cmd.keyframe.id || `${cmd.elementId}-${cmd.keyframe.time}`)
            ),
          };
        });
        return {
          ...state,
          tracks: nextTracks,
          selectedId: cmd.elementId,
          selectedKeyframeId: null,
        };
      } else {
        // Forward ADD_KEYFRAME
        const nextTracks = state.tracks.map((t) => {
          if (t.elementId !== cmd.elementId) return t;
          return {
            ...t,
            keyframes: [...t.keyframes, cmd.keyframe].sort((a, b) => a.time - b.time),
          };
        });
        return {
          ...state,
          tracks: nextTracks,
          selectedId: cmd.elementId,
          selectedKeyframeId: cmd.keyframe.id || null,
        };
      }
    }

    case "DELETE_KEYFRAME": {
      if (isUndo) {
        // Reverse of DELETE_KEYFRAME is restore
        const nextTracks = state.tracks.map((t) => {
          if (t.elementId !== cmd.elementId) return t;
          const nextKf = [...t.keyframes];
          const insertIdx = Math.min(cmd.index, nextKf.length);
          nextKf.splice(insertIdx, 0, cmd.keyframe);
          nextKf.sort((a, b) => a.time - b.time);
          return { ...t, keyframes: nextKf };
        });
        return {
          ...state,
          tracks: nextTracks,
          selectedId: cmd.elementId,
          selectedKeyframeId: cmd.keyframe.id || null,
        };
      } else {
        // Forward DELETE_KEYFRAME
        const nextTracks = state.tracks.map((t) => {
          if (t.elementId !== cmd.elementId) return t;
          return {
            ...t,
            keyframes: t.keyframes.filter(
              (k) => (k.id || `${cmd.elementId}-${k.time}`) !== (cmd.keyframe.id || `${cmd.elementId}-${cmd.keyframe.time}`)
            ),
          };
        });
        return {
          ...state,
          tracks: nextTracks,
          selectedId: cmd.elementId,
          selectedKeyframeId: null,
        };
      }
    }

    case "UPDATE_CANVAS": {
      const patch = isUndo ? cmd.from : cmd.to;
      return {
        ...state,
        canvas: { ...state.canvas, ...patch },
      };
    }

    case "UPDATE_SETTINGS": {
      const patch = isUndo ? cmd.from : cmd.to;
      return {
        ...state,
        duration: patch.duration ?? state.duration,
        fps: patch.fps ?? state.fps,
        format: patch.format ?? state.format,
      };
    }

    case "UPDATE_VARIABLES": {
      const patch = isUndo ? cmd.from : cmd.to;
      return {
        ...state,
        variables: patch,
      };
    }

    case "BATCH": {
      let cur = state;
      const list = isUndo ? [...cmd.commands].reverse() : cmd.commands;
      for (const subCmd of list) {
        cur = executeCommand(cur, subCmd, isUndo);
      }
      return cur;
    }

    default:
      return state;
  }
}
