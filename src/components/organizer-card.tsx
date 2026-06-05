"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { useInView } from "./use-in-view";
import { CARD_COLORS, CARD_ROTATIONS } from "./card-style";
import { ReactorsSheet } from "./reactors-sheet";

const REACTION_EMOJI = {
  thank: "🙏",
  laugh: "😂",
  love: "❤️",
} as const;

type ReactionType = keyof typeof REACTION_EMOJI;

type Contribution = {
  id: string;
  contributor_name: string | null;
  contributor_note: string | null;
  contributor_image_url: string | null;
  amount_cents: number;
  reactions: Record<string, number>;
  userReactions: string[];
};

export function OrganizerCard({
  contribution,
  index,
  flipped: controlledFlip,
  currentUserId,
}: {
  contribution: Contribution;
  index: number;
  flipped?: boolean;
  currentUserId: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [localFlip, setLocalFlip] = useState(false);
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [reactionCounts, setReactionCounts] = useState(contribution.reactions);
  const [myReactions, setMyReactions] = useState<string[]>(contribution.userReactions);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const isFlipped = controlledFlip ?? localFlip;

  const rotation = CARD_ROTATIONS[index % CARD_ROTATIONS.length];
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const delay = Math.min(index * 50, 600);

  const totalReactions = Object.values(reactionCounts).reduce((a, b) => a + b, 0);

  const handleTap = useCallback(() => {
    if (controlledFlip === undefined) {
      if (!localFlip && contribution.contributor_note) setNoteExpanded(false);
      setLocalFlip((v) => !v);
    }
  }, [controlledFlip, localFlip, contribution.contributor_note]);

  const handleNoteClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    setNoteExpanded((v) => !v);
  }, []);

  const handleReact = useCallback(
    async (type: ReactionType, e: React.MouseEvent) => {
      e.stopPropagation();
      if (busy) return;
      setBusy(true);

      const wasActive = myReactions.includes(type);
      setMyReactions((prev) =>
        wasActive ? prev.filter((r) => r !== type) : [...prev, type]
      );
      setReactionCounts((prev) => ({
        ...prev,
        [type]: (prev[type] || 0) + (wasActive ? -1 : 1),
      }));

      try {
        const res = await fetch(`/api/contributions/${contribution.id}/react`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type }),
        });
        if (!res.ok) throw new Error();
      } catch {
        setMyReactions((prev) =>
          wasActive ? [...prev, type] : prev.filter((r) => r !== type)
        );
        setReactionCounts((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + (wasActive ? 1 : -1),
        }));
      } finally {
        setBusy(false);
      }
    },
    [busy, myReactions, contribution.id]
  );

  const amount = `$${(contribution.amount_cents / 100).toFixed(0)}`;

  return (
    <div
      ref={ref}
      style={{
        perspective: "600px",
        opacity: inView ? 1 : 0,
        animation: inView
          ? `card-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`
          : "none",
      }}
    >
      <div
        className="relative transition-transform duration-400 ease-[cubic-bezier(0.34,1.56,0.64,1)]"
        style={{
          transformStyle: "preserve-3d",
          transform: isFlipped
            ? `rotate(${rotation}deg) rotateY(180deg)`
            : `rotate(${rotation}deg)`,
        }}
        onClick={handleTap}
      >
        {/* Front */}
        <div
          className={`${color} rounded-xl border p-4 shadow-soft active:scale-[0.97]`}
          style={{
            backfaceVisibility: "hidden",
            // Fallback for renderers that ignore backface-visibility (notably
            // Playwright's headless WebKit in the app tour): swap visibility at
            // the midpoint of the 400ms flip so the wrong face is never visible.
            visibility: isFlipped ? "hidden" : "visible",
            transition: "visibility 0s linear 200ms",
          }}
        >
          {contribution.contributor_image_url && (
            <div className="relative mb-2 h-20 w-full overflow-hidden rounded-lg">
              <Image
                src={contribution.contributor_image_url}
                alt=""
                fill
                sizes="(max-width: 768px) 45vw, 200px"
                className={
                  contribution.contributor_image_url.startsWith("/stock/")
                    ? "object-contain"
                    : "object-cover"
                }
              />
            </div>
          )}
          <p className={`text-sm font-medium text-zinc-800 ${!contribution.contributor_name ? "italic" : ""}`}>
            {contribution.contributor_name || "Anonymous"}
          </p>
          {contribution.contributor_note && (
            <p
              className={`mt-1 text-xs text-zinc-600 transition-all duration-200 ${
                noteExpanded ? "" : "line-clamp-2"
              }`}
              onClick={handleNoteClick}
            >
              &ldquo;{contribution.contributor_note}&rdquo;
            </p>
          )}

          <div className="mt-3 flex flex-wrap gap-1.5">
            {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => {
              const active = myReactions.includes(type);
              const count = reactionCounts[type] || 0;
              return (
                <button
                  key={type}
                  onClick={(e) => handleReact(type, e)}
                  disabled={busy}
                  aria-pressed={active}
                  aria-label={`React with ${type}`}
                  className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-sm transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 ${
                    active
                      ? "bg-white shadow-sm ring-1 ring-zinc-300"
                      : "bg-white/60 hover:bg-white/80"
                  }`}
                >
                  <span>{REACTION_EMOJI[type]}</span>
                  {count > 0 && (
                    <span className={`text-xs ${active ? "text-zinc-700" : "text-zinc-500"}`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {totalReactions > 0 && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                setSheetOpen(true);
              }}
              className="mt-1.5 text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline"
            >
              See who reacted
            </button>
          )}

          <div className="mt-2 flex items-center gap-1 text-xs text-zinc-400">
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2Z" />
              <path d="M12 6v6l4 2" />
            </svg>
            tap to reveal
          </div>
        </div>

        {/* Back */}
        <div
          className={`${color} absolute inset-0 flex flex-col items-center justify-center rounded-xl border p-4 shadow-soft active:scale-[0.97]`}
          style={{
            backfaceVisibility: "hidden",
            transform: "rotateY(180deg)",
            visibility: isFlipped ? "visible" : "hidden",
            transition: "visibility 0s linear 200ms",
          }}
        >
          <span className="text-3xl font-bold text-zinc-800">{amount}</span>
          <p className={`mt-1 text-sm text-zinc-500 ${!contribution.contributor_name ? "italic" : ""}`}>
            {contribution.contributor_name || "Anonymous"}
          </p>
        </div>
      </div>

      <ReactorsSheet
        contributionId={contribution.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        currentUserId={currentUserId}
      />
    </div>
  );
}
