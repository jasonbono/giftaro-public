"use client";

import { useRef, useCallback } from "react";

type CropValues = { zoom: number; offsetX: number; offsetY: number };

export function ImageCropEditor({
  src,
  zoom,
  offsetX,
  offsetY,
  onChange,
}: {
  src: string;
  zoom: number;
  offsetX: number;
  offsetY: number;
  onChange: (values: CropValues) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startOffsetX: number; startOffsetY: number } | null>(null);

  const clamp = useCallback((val: number, z: number) => {
    const max = (z - 1) * 50;
    return Math.max(-max, Math.min(max, val));
  }, []);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    if (zoom <= 1) return;
    e.preventDefault();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, startOffsetX: offsetX, startOffsetY: offsetY };
  }, [zoom, offsetX, offsetY]);

  const handlePointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragRef.current || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const dx = ((e.clientX - dragRef.current.startX) / rect.width) * 100;
    const dy = ((e.clientY - dragRef.current.startY) / rect.height) * 100;
    onChange({
      zoom,
      offsetX: clamp(dragRef.current.startOffsetX + dx, zoom),
      offsetY: clamp(dragRef.current.startOffsetY + dy, zoom),
    });
  }, [zoom, onChange, clamp]);

  const handlePointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  return (
    <div className="flex flex-col gap-3">
      <div
        ref={containerRef}
        className="h-52 w-full cursor-grab overflow-hidden rounded-xl bg-zinc-100 active:cursor-grabbing dark:bg-zinc-900"
        style={{ touchAction: "none" }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt=""
          className="pointer-events-none h-full w-full object-contain"
          style={{
            transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
          }}
          draggable={false}
        />
      </div>
      <div className="flex items-center gap-3 px-1">
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
          <path d="M8 11h6" />
        </svg>
        <input
          type="range"
          min="1"
          max="3"
          step="0.01"
          value={zoom}
          onChange={(e) => {
            const newZoom = parseFloat(e.target.value);
            onChange({
              zoom: newZoom,
              offsetX: clamp(offsetX, newZoom),
              offsetY: clamp(offsetY, newZoom),
            });
          }}
          className="h-1 w-full cursor-pointer appearance-none rounded-full bg-zinc-200 accent-zinc-900 dark:bg-zinc-700 dark:accent-zinc-50"
        />
        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 text-zinc-400">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.3-4.3" />
          <path d="M8 11h6" />
          <path d="M11 8v6" />
        </svg>
      </div>
    </div>
  );
}
