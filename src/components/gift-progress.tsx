"use client";

import { useEffect, useState } from "react";
import { calcProgress } from "@/lib/progress";

interface GiftProgressProps {
  totalContributedCents: number;
  targetAmountCents: number;
  contributorCount?: number;
  contributors?: { image_url: string | null; name: string | null }[];
  variant?: "compact" | "full";
}

function getGradient(progress: number): string {
  if (progress >= 100)
    return "linear-gradient(90deg, #6366F1, #A855F7, #EC4899, #F97316, #FBBF24, #EAB308)";
  if (progress >= 70)
    return "linear-gradient(90deg, #6366F1, #A855F7, #EC4899, #F97316)";
  if (progress >= 30)
    return "linear-gradient(90deg, #4285F4, #6366F1, #A855F7, #EC4899)";
  return "linear-gradient(90deg, #4285F4, #818CF8)";
}

function getPeopleText(count: number): string | null {
  if (count >= 2) return `${count} chipped in`;
  if (count === 1) return "1 chipped in";
  return "0 chipped in";
}

function getMilestoneText(progress: number): string | null {
  if (progress >= 100) return "Fully funded";
  if (progress >= 70) return "Almost there";
  if (progress >= 50) return "Halfway there";
  return null;
}

export function GiftProgress({
  totalContributedCents,
  targetAmountCents,
  contributorCount = 0,
  contributors = [],
  variant = "full",
}: GiftProgressProps) {
  const progress = calcProgress(totalContributedCents, targetAmountCents);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setWidth(progress), 50);
    return () => clearTimeout(t);
  }, [progress]);

  const raised = `$${(totalContributedCents / 100).toFixed(0)}`;
  const goal = `$${(targetAmountCents / 100).toFixed(0)}`;
  const compact = variant === "compact";
  const funded = progress >= 100;
  const peopleText = getPeopleText(contributorCount);
  const milestone = getMilestoneText(progress);
  const hasPeople = peopleText !== null || milestone !== null;
  const avatarSize = compact ? "h-6 w-6" : "h-7 w-7";

  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-sm">
        {hasPeople ? (
          <>
            <span
              className={`font-semibold ${funded ? "text-amber-500" : "text-zinc-900 dark:text-zinc-50"}`}
            >
              {peopleText}
              {milestone && (
                <span className={funded ? "" : " font-normal text-zinc-400"}>
                  {peopleText ? " · " : ""}{milestone}
                </span>
              )}
            </span>
            {!compact && (
              <span className="tabular-nums text-xs text-zinc-400">
                {raised} of {goal}
              </span>
            )}
          </>
        ) : (
          <span
            className={`font-semibold ${funded ? "text-amber-500" : "text-zinc-900 dark:text-zinc-50"}`}
          >
            {raised}{" "}
            <span className="font-normal text-zinc-400">of {goal}</span>
          </span>
        )}
      </div>

      {contributors.length > 0 && (
        <div className="mt-2 flex items-center">
          <div className="flex -space-x-2">
            {contributors.slice(0, 4).map((c, i) => (
              <div
                key={i}
                className={`${avatarSize} overflow-hidden rounded-full border-2 border-white bg-zinc-100 dark:border-zinc-900 dark:bg-zinc-800`}
              >
                {c.image_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={c.image_url}
                    alt=""
                    className={`h-full w-full ${c.image_url.startsWith("/stock/") ? "object-contain" : "object-cover"}`}
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-[10px] font-bold text-zinc-400">
                    {(c.name || "?")[0].toUpperCase()}
                  </div>
                )}
              </div>
            ))}
          </div>
          {Math.max(contributorCount, contributors.length) > 4 && (
            <span className="ml-1.5 text-xs font-medium text-zinc-400">
              +{Math.max(contributorCount, contributors.length) - 4}
            </span>
          )}
        </div>
      )}

      <div
        className={`relative ${contributors.length > 0 || hasPeople ? "mt-2" : "mt-1.5"} ${compact ? "h-2" : "h-3"} overflow-hidden rounded-full bg-zinc-100 ring-1 ring-inset ring-zinc-200/70 dark:bg-zinc-800 dark:ring-zinc-700/50`}
      >
        <div
          className={`relative h-full rounded-full transition-all duration-700 ease-out ${funded ? "progress-shimmer" : ""}`}
          style={{
            width: `${width}%`,
            background: width > 0 ? getGradient(progress) : "transparent",
          }}
        >
          {!funded && width > 0 && (
            <div className="absolute -right-1 top-0 h-full w-6 animate-pulse rounded-full bg-white/20 blur-sm" />
          )}
        </div>
      </div>
    </div>
  );
}
