"use client";

import { useState } from "react";

const GRADIENTS = [
  "from-violet-500 to-purple-600",
  "from-rose-400 to-pink-500",
  "from-amber-400 to-orange-500",
  "from-emerald-400 to-teal-500",
  "from-sky-400 to-blue-500",
  "from-fuchsia-400 to-pink-500",
];

function getGradient(title: string): string {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export function GiftImage({
  src,
  alt,
  title,
  className = "h-52 w-full",
  zoom = 1,
  offsetX = 0,
  offsetY = 0,
}: {
  src: string | null;
  alt?: string;
  title: string;
  className?: string;
  zoom?: number;
  offsetX?: number;
  offsetY?: number;
}) {
  const [broken, setBroken] = useState(false);

  if (!src || broken) {
    const gradient = getGradient(title);
    return (
      <div
        className={`${className} flex items-center justify-center bg-gradient-to-br ${gradient} p-6`}
      >
        <p className="line-clamp-3 text-center text-lg font-bold text-white/90 drop-shadow-sm">
          {title}
        </p>
      </div>
    );
  }

  const hasTransform = zoom !== 1 || offsetX !== 0 || offsetY !== 0;

  return (
    <div className={`${className} overflow-hidden rounded-xl bg-white/80 dark:bg-zinc-900/80`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={alt || ""}
        className="h-full w-full object-contain opacity-90"
        style={hasTransform ? {
          transform: `translate(${offsetX}%, ${offsetY}%) scale(${zoom})`,
        } : undefined}
        onError={() => setBroken(true)}
      />
    </div>
  );
}
