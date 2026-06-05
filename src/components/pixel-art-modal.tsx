"use client";

import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { PixelCanvas, PALETTE, type PixelCanvasRef, type Tool } from "./pixel-canvas";
import { Button } from "./ui";

const TOOLS: { id: Tool; label: string; icon: React.ReactNode }[] = [
  {
    id: "pencil",
    label: "Draw",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z" />
      </svg>
    ),
  },
  {
    id: "eraser",
    label: "Erase",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m7 21-4.3-4.3c-1-1-1-2.5 0-3.4l9.6-9.6c1-1 2.5-1 3.4 0l5.6 5.6c1 1 1 2.5 0 3.4L13 21" />
        <path d="M22 21H7" />
        <path d="m5 11 9 9" />
      </svg>
    ),
  },
  {
    id: "fill",
    label: "Fill",
    icon: (
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="m19 11-8-8-8.6 8.6a2 2 0 0 0 0 2.8l5.2 5.2c.8.8 2 .8 2.8 0L19 11Z" />
        <path d="m5 2 5 5" />
        <path d="M2 13h15" />
        <path d="M22 20a2 2 0 1 1-4 0c0-1.6 1.7-2.4 2-4 .3 1.6 2 2.4 2 4Z" />
      </svg>
    ),
  },
];

export function PixelArtModal({
  open,
  onClose,
  onSave,
  saving,
}: {
  open: boolean;
  onClose: () => void;
  onSave: (dataUrl: string) => Promise<void>;
  saving?: boolean;
}) {
  const canvasRef = useRef<PixelCanvasRef>(null);
  const [tool, setTool] = useState<Tool>("pencil");
  const [colorIndex, setColorIndex] = useState(1);
  const [mirror, setMirror] = useState(false);
  const [error, setError] = useState("");

  function handleDone() {
    if (!canvasRef.current) return;
    setError("");
    const dataUrl = canvasRef.current.exportPNG();
    onSave(dataUrl).catch(() => setError("Save failed. Try again."));
  }

  function handleCancel() {
    if (canvasRef.current && !canvasRef.current.isEmpty()) {
      if (!confirm("Discard your drawing?")) return;
    }
    onClose();
  }

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-[200] flex flex-col bg-white dark:bg-zinc-950">
      {/* Header — matches AppHeader layout */}
      <header className="flex items-center justify-between border-b border-zinc-100 px-6 py-4 dark:border-zinc-800">
        <div className="flex shrink-0 items-center gap-2">
          <Image src="/gift_blue_smile_v4.png" alt="" width={40} height={40} style={{ transform: "translateY(-12%)" }} />
          <span className="font-pixel text-lg font-bold">
            <span className="text-zinc-900 dark:text-zinc-50">Gift</span>
            <span style={{ color: "#DB4437" }}>a</span>
            <span style={{ color: "#0F9D58" }}>r</span>
            <span style={{ color: "#4285F4" }}>o</span>
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="text-sm font-medium text-zinc-500 transition-colors active:text-zinc-900 dark:text-zinc-400 dark:active:text-zinc-50"
          >
            Cancel
          </button>
          <Button onClick={handleDone} disabled={saving} size="sm">
            {saving ? "Saving..." : "Done"}
          </Button>
        </div>
      </header>

      {/* Canvas */}
      <div className="flex flex-1 items-center justify-center px-6">
        <PixelCanvas ref={canvasRef} tool={tool} colorIndex={colorIndex} mirror={mirror} />
      </div>

      {/* Error */}
      {error && (
        <p className="px-6 text-center text-sm text-red-500">{error}</p>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-4 px-6 pb-[max(env(safe-area-inset-bottom),16px)] pt-4">
        {/* Color palette */}
        <div className="flex items-center justify-center gap-1.5">
          {PALETTE.map((color, i) => {
            const paletteIdx = i + 1; // 1-based to match canvas storage
            return (
              <button
                key={color}
                type="button"
                onClick={() => {
                  setColorIndex(paletteIdx);
                  if (tool === "eraser") setTool("pencil");
                }}
                className={`h-7 w-7 rounded-full border-2 transition-all ${
                  colorIndex === paletteIdx && tool !== "eraser"
                    ? "scale-110 border-zinc-900 ring-2 ring-zinc-900/20 dark:border-zinc-50 dark:ring-zinc-50/20"
                    : "border-zinc-200 dark:border-zinc-700"
                }`}
                style={{ backgroundColor: color }}
              />
            );
          })}
        </div>

        {/* Tools */}
        <div className="flex items-center justify-center gap-1">
          {TOOLS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTool(t.id)}
              className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                tool === t.id
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}

          <div className="mx-1 h-6 w-px bg-zinc-200 dark:bg-zinc-700" />

          {/* Mirror */}
          <button
            type="button"
            onClick={() => setMirror((m) => !m)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
              mirror
                ? "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400"
                : "text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 3v18" />
              <path d="m7 8-4 4 4 4" />
              <path d="m17 8 4 4-4 4" />
            </svg>
          </button>

          {/* Undo */}
          <button
            type="button"
            onClick={() => canvasRef.current?.undo()}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 7v6h6" />
              <path d="M21 17a9 9 0 0 0-9-9 9 9 0 0 0-6 2.3L3 13" />
            </svg>
          </button>

          {/* Clear */}
          <button
            type="button"
            onClick={() => {
              if (canvasRef.current && !canvasRef.current.isEmpty()) {
                canvasRef.current.clear();
              }
            }}
            className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18" />
              <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
              <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
            </svg>
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
