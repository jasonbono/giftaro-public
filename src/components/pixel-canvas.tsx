"use client";

import { useRef, useState, useCallback, useEffect, useImperativeHandle, type Ref } from "react";

const GRID_SIZE = 32;
const EXPORT_SCALE = 16; // 32 * 16 = 512px export

export const PALETTE = [
  "#000000", // black
  "#FFFFFF", // white
  "#FF3B30", // red
  "#FF9500", // orange
  "#FFCC00", // yellow
  "#34C759", // green
  "#007AFF", // blue
  "#AF52DE", // purple
  "#FF2D55", // pink
  "#8B4513", // brown
];

export type Tool = "pencil" | "eraser" | "fill";

export type PixelCanvasRef = {
  exportPNG: () => string;
  undo: () => void;
  clear: () => void;
  isEmpty: () => boolean;
};

function bresenhamLine(x0: number, y0: number, x1: number, y1: number): [number, number][] {
  const points: [number, number][] = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;

  while (true) {
    points.push([x0, y0]);
    if (x0 === x1 && y0 === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x0 += sx; }
    if (e2 < dx) { err += dx; y0 += sy; }
  }
  return points;
}

function floodFill(pixels: Uint8Array, col: number, row: number, newColor: number) {
  const target = pixels[row * GRID_SIZE + col];
  if (target === newColor) return;

  const queue: [number, number][] = [[col, row]];
  const visited = new Set<number>();

  while (queue.length > 0) {
    const [c, r] = queue.pop()!;
    const idx = r * GRID_SIZE + c;
    if (visited.has(idx)) continue;
    if (c < 0 || c >= GRID_SIZE || r < 0 || r >= GRID_SIZE) continue;
    if (pixels[idx] !== target) continue;

    visited.add(idx);
    pixels[idx] = newColor;
    queue.push([c - 1, r], [c + 1, r], [c, r - 1], [c, r + 1]);
  }
}

export function PixelCanvas({
  ref,
  tool,
  colorIndex,
  mirror,
}: {
  ref?: Ref<PixelCanvasRef>;
  tool: Tool;
  colorIndex: number;
  mirror?: boolean;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pixelsRef = useRef(new Uint8Array(GRID_SIZE * GRID_SIZE) as Uint8Array<ArrayBuffer>);
  const historyRef = useRef<Uint8Array<ArrayBuffer>[]>([]);
  const isDrawingRef = useRef(false);
  const lastCellRef = useRef<{ col: number; row: number } | null>(null);
  const [, forceRender] = useState(0);

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const pixels = pixelsRef.current;
    ctx.clearRect(0, 0, GRID_SIZE, GRID_SIZE);

    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        const val = pixels[r * GRID_SIZE + c];
        if (val > 0) {
          ctx.fillStyle = PALETTE[val - 1];
          ctx.fillRect(c, r, 1, 1);
        }
      }
    }
  }, []);

  useEffect(() => { redraw(); }, [redraw]);

  const pushHistory = useCallback(() => {
    const copy = new Uint8Array(pixelsRef.current) as Uint8Array<ArrayBuffer>;
    historyRef.current.push(copy);
    if (historyRef.current.length > 50) historyRef.current.shift();
  }, []);

  const getCell = useCallback((e: React.PointerEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const col = Math.floor(((e.clientX - rect.left) / rect.width) * GRID_SIZE);
    const row = Math.floor(((e.clientY - rect.top) / rect.height) * GRID_SIZE);
    if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) return null;
    return { col, row };
  }, []);

  const drawCell = useCallback((ctx: CanvasRenderingContext2D, col: number, row: number, val: number) => {
    if (val > 0) {
      ctx.fillStyle = PALETTE[val - 1];
      ctx.fillRect(col, row, 1, 1);
    } else {
      ctx.clearRect(col, row, 1, 1);
    }
  }, []);

  const applyTool = useCallback((col: number, row: number, currentTool: Tool, ci: number, skipDraw?: boolean) => {
    const pixels = pixelsRef.current;
    const idx = row * GRID_SIZE + col;
    const mCol = GRID_SIZE - 1 - col;
    const mIdx = row * GRID_SIZE + mCol;

    if (currentTool === "pencil") {
      pixels[idx] = ci;
      if (mirror) pixels[mIdx] = ci;
    } else if (currentTool === "eraser") {
      pixels[idx] = 0;
      if (mirror) pixels[mIdx] = 0;
    } else if (currentTool === "fill") {
      floodFill(pixels, col, row, ci);
      redraw();
      return;
    }

    if (!skipDraw) {
      const ctx = canvasRef.current?.getContext("2d");
      if (ctx) {
        drawCell(ctx, col, row, pixels[idx]);
        if (mirror) drawCell(ctx, mCol, row, pixels[mIdx]);
      }
    }
  }, [redraw, drawCell, mirror]);

  const strokeTo = useCallback((cell: { col: number; row: number }, activeTool: Tool, ci: number) => {
    const last = lastCellRef.current;
    if (last) {
      const points = bresenhamLine(last.col, last.row, cell.col, cell.row);
      const ctx = canvasRef.current?.getContext("2d");
      const pixels = pixelsRef.current;
      for (let i = 1; i < points.length; i++) {
        const [c, r] = points[i];
        applyTool(c, r, activeTool, ci, true);
        if (ctx) {
          drawCell(ctx, c, r, pixels[r * GRID_SIZE + c]);
          if (mirror) {
            const mc = GRID_SIZE - 1 - c;
            drawCell(ctx, mc, r, pixels[r * GRID_SIZE + mc]);
          }
        }
      }
    } else {
      applyTool(cell.col, cell.row, activeTool, ci);
    }
    lastCellRef.current = cell;
  }, [applyTool, drawCell, mirror]);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDrawingRef.current = true;
    pushHistory();

    const cell = getCell(e);
    if (cell) {
      lastCellRef.current = cell;
      applyTool(cell.col, cell.row, tool, colorIndex);
      forceRender((n) => n + 1);
    }
  }, [tool, colorIndex, getCell, applyTool, pushHistory]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!isDrawingRef.current) return;

    const activeTool = tool === "fill" ? "pencil" : tool;

    const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [];
    if (coalesced.length > 1) {
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      for (const ce of coalesced) {
        const col = Math.floor(((ce.clientX - rect.left) / rect.width) * GRID_SIZE);
        const row = Math.floor(((ce.clientY - rect.top) / rect.height) * GRID_SIZE);
        if (col < 0 || col >= GRID_SIZE || row < 0 || row >= GRID_SIZE) continue;
        const last = lastCellRef.current;
        if (last && last.col === col && last.row === row) continue;
        strokeTo({ col, row }, activeTool, colorIndex);
      }
    } else {
      const cell = getCell(e);
      if (!cell) return;
      const last = lastCellRef.current;
      if (last && last.col === cell.col && last.row === cell.row) return;
      strokeTo(cell, activeTool, colorIndex);
    }
  }, [tool, colorIndex, getCell, strokeTo]);

  const handlePointerUp = useCallback(() => {
    isDrawingRef.current = false;
    lastCellRef.current = null;
  }, []);

  useImperativeHandle(ref, () => ({
    exportPNG() {
      const size = GRID_SIZE * EXPORT_SCALE;
      const offscreen = document.createElement("canvas");
      offscreen.width = size;
      offscreen.height = size;
      const ctx = offscreen.getContext("2d")!;

      const pixels = pixelsRef.current;
      for (let r = 0; r < GRID_SIZE; r++) {
        for (let c = 0; c < GRID_SIZE; c++) {
          const val = pixels[r * GRID_SIZE + c];
          if (val > 0) {
            ctx.fillStyle = PALETTE[val - 1];
            ctx.fillRect(c * EXPORT_SCALE, r * EXPORT_SCALE, EXPORT_SCALE, EXPORT_SCALE);
          }
        }
      }

      return offscreen.toDataURL("image/png");
    },
    undo() {
      const prev = historyRef.current.pop();
      if (prev) {
        pixelsRef.current = prev;
        redraw();
        forceRender((n) => n + 1);
      }
    },
    clear() {
      pushHistory();
      pixelsRef.current.fill(0);
      redraw();
      forceRender((n) => n + 1);
    },
    isEmpty() {
      return pixelsRef.current.every((v) => v === 0);
    },
  }), [redraw, pushHistory]);

  return (
    <div className="relative aspect-square w-full max-w-[360px]">
      {/* Grid background — percentage-based so lines align exactly with canvas cells */}
      <div
        className="absolute inset-0 rounded-xl bg-zinc-100 dark:bg-zinc-800"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.08) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.08) 1px, transparent 1px)
          `,
          backgroundSize: `${100 / GRID_SIZE}% ${100 / GRID_SIZE}%`,
        }}
      />
      {mirror && (
        <div
          className="pointer-events-none absolute top-0 bottom-0 left-1/2 z-10 w-px -translate-x-[0.5px]"
          style={{ background: "rgba(99,102,241,0.35)" }}
        />
      )}
      <canvas
        ref={canvasRef}
        width={GRID_SIZE}
        height={GRID_SIZE}
        className="relative h-full w-full rounded-xl"
        style={{ touchAction: "none", imageRendering: "pixelated" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      />
    </div>
  );
}
