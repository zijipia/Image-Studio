import React, { useEffect, useRef } from "react";
import type { ParticleConfig } from "../lib/particle-system";
import { computeParticles, drawParticlesToCanvas } from "../lib/particle-system";

interface ParticleCanvasProps {
  config: ParticleConfig;
  width: number;
  height: number;
  /** Explicit time in milliseconds. If omitted or playing=true, runs continuous real-time clock */
  timeMs?: number;
  playing?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

export function ParticleCanvas({
  config,
  width,
  height,
  timeMs,
  playing = false,
  className = "",
  style = {},
}: ParticleCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = typeof window !== "undefined" ? Math.min(window.devicePixelRatio || 1, 2) : 1;
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);

    let isSubscribed = true;

    const renderFrame = (now: number) => {
      if (!isSubscribed) return;

      const currentMs = timeMs !== undefined && !playing ? timeMs : now - startTimeRef.current;
      const particles = computeParticles(config, currentMs, { width, height });

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawParticlesToCanvas(ctx, particles, dpr);

      if (playing || timeMs === undefined) {
        animFrameRef.current = requestAnimationFrame(renderFrame);
      }
    };

    if (playing || timeMs === undefined) {
      startTimeRef.current = performance.now() - (timeMs || 0);
      animFrameRef.current = requestAnimationFrame(renderFrame);
    } else {
      renderFrame(performance.now());
    }

    return () => {
      isSubscribed = false;
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [config, width, height, timeMs, playing]);

  return (
    <canvas
      ref={canvasRef}
      className={`pointer-events-none absolute inset-0 ${className}`}
      style={{
        width: `${width}px`,
        height: `${height}px`,
        ...style,
      }}
    />
  );
}
