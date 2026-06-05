"use client";

import { useState } from "react";
import { AnimatedCard } from "@/components/animated-card";
import { InViewProvider } from "@/components/in-view-observer";
import { Button } from "@/components/ui";

type Contribution = {
  id: string;
  contributor_name: string | null;
  contributor_note: string | null;
  contributor_image_url: string | null;
  reactions: Record<string, number>;
  userReactions: string[];
};

const INITIAL_VISIBLE = 6;

export function CardWall({
  contributions,
  highlightFirst,
  isLoggedIn,
  currentUserId,
  returnTo,
}: {
  contributions: Contribution[];
  highlightFirst?: boolean;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  returnTo?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const total = contributions.length;

  if (total === 0) return null;

  const needsReveal = total > 8;
  const visibleCards = needsReveal
    ? contributions.slice(0, INITIAL_VISIBLE)
    : contributions;

  return (
    <InViewProvider>
      <div className="mt-8">
        {total >= 4 && (
          <p className={`mb-3 text-center ${
            total >= 13
              ? "text-base font-semibold text-zinc-800 dark:text-zinc-200"
              : "text-sm text-zinc-500 dark:text-zinc-400"
          }`}>
            {total} {total === 1 ? "friend" : "friends"} chipped in
          </p>
        )}

        <div className="grid grid-cols-2 gap-3">
          {visibleCards.map((c, i) => (
            <AnimatedCard
              key={c.id}
              contribution={c}
              index={i}
              delayIndex={i}
              highlighted={highlightFirst && i === 0}
              isLoggedIn={isLoggedIn}
              currentUserId={currentUserId}
              returnTo={returnTo}
            />
          ))}
        </div>

        {needsReveal && !expanded && (
          <div className="mt-4 flex justify-center">
            <Button
              onClick={() => setExpanded(true)}
              style={{ animation: "pill-pulse 2s ease-in-out infinite" }}
            >
              Show all {total} cards
            </Button>
          </div>
        )}

        {needsReveal && expanded && (
          <div className="mt-3 grid grid-cols-2 gap-3">
            {contributions.slice(INITIAL_VISIBLE).map((c, i) => (
              <AnimatedCard
                key={c.id}
                contribution={c}
                index={i + INITIAL_VISIBLE}
                delayIndex={i}
                isLoggedIn={isLoggedIn}
                currentUserId={currentUserId}
                returnTo={returnTo}
              />
            ))}
          </div>
        )}
      </div>
    </InViewProvider>
  );
}
