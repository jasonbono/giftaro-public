"use client";

import { useState } from "react";
import { GiftImage } from "@/components/gift-image";
import { ImageCropEditor } from "@/components/image-crop-editor";
import { Button } from "@/components/ui";

export function InlineCropEditor({
  giftId,
  src,
  alt,
  title,
  initialZoom,
  initialOffsetX,
  initialOffsetY,
}: {
  giftId: string;
  src: string;
  alt: string;
  title: string;
  initialZoom: number;
  initialOffsetX: number;
  initialOffsetY: number;
}) {
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [zoom, setZoom] = useState(initialZoom);
  const [offsetX, setOffsetX] = useState(initialOffsetX);
  const [offsetY, setOffsetY] = useState(initialOffsetY);
  const [savedZoom, setSavedZoom] = useState(initialZoom);
  const [savedOffsetX, setSavedOffsetX] = useState(initialOffsetX);
  const [savedOffsetY, setSavedOffsetY] = useState(initialOffsetY);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch(`/api/gifts/${giftId}/crop`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image_zoom: zoom,
          image_offset_x: offsetX,
          image_offset_y: offsetY,
        }),
      });
      if (res.ok) {
        setSavedZoom(zoom);
        setSavedOffsetX(offsetX);
        setSavedOffsetY(offsetY);
        setEditing(false);
      }
    } finally {
      setSaving(false);
    }
  }

  function handleCancel() {
    setZoom(savedZoom);
    setOffsetX(savedOffsetX);
    setOffsetY(savedOffsetY);
    setEditing(false);
  }

  if (!editing) {
    return (
      <div
        className="group relative cursor-pointer overflow-hidden rounded-xl"
        onClick={() => setEditing(true)}
      >
        <GiftImage
          src={src}
          alt={alt}
          title={title}
          zoom={savedZoom}
          offsetX={savedOffsetX}
          offsetY={savedOffsetY}
        />
        <div className="absolute inset-0 flex items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20">
          <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-zinc-700 opacity-0 shadow-sm transition-opacity group-hover:opacity-100">
            Adjust photo
          </span>
        </div>
      </div>
    );
  }

  return (
    <div>
      <ImageCropEditor
        src={src}
        zoom={zoom}
        offsetX={offsetX}
        offsetY={offsetY}
        onChange={(v) => {
          setZoom(v.zoom);
          setOffsetX(v.offsetX);
          setOffsetY(v.offsetY);
        }}
      />
      <div className="mt-2 flex items-center justify-end gap-2">
        <button
          onClick={handleCancel}
          className="rounded-full px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:text-zinc-700"
        >
          Cancel
        </button>
        <Button onClick={handleSave} disabled={saving} size="sm">
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </div>
  );
}
