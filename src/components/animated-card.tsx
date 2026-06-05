"use client";

import { useState, useCallback } from "react";
import { useInView } from "./use-in-view";
import { CARD_COLORS, CARD_ROTATIONS } from "./card-style";
import Link from "next/link";
import Image from "next/image";
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
  reactions: Record<string, number>;
  userReactions: string[];
};

export function AnimatedCard({
  contribution,
  index,
  delayIndex,
  highlighted,
  isLoggedIn,
  currentUserId,
  returnTo,
}: {
  contribution: Contribution;
  index: number;
  delayIndex: number;
  highlighted?: boolean;
  isLoggedIn: boolean;
  currentUserId?: string | null;
  returnTo?: string;
}) {
  const { ref, inView } = useInView<HTMLDivElement>();
  const [noteExpanded, setNoteExpanded] = useState(false);
  const [reactions, setReactions] = useState(contribution.reactions);
  const [myReactions, setMyReactions] = useState<string[]>(contribution.userReactions);
  const [showSignIn, setShowSignIn] = useState(false);
  const [busy, setBusy] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const rotation = CARD_ROTATIONS[index % CARD_ROTATIONS.length];
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const delay = Math.min(delayIndex * 50, 600);

  const totalReactions = Object.values(reactions).reduce((a, b) => a + b, 0);

  const signUpHref = returnTo
    ? `/?returnTo=${encodeURIComponent(returnTo)}&mode=signup`
    : "/?mode=signup";

  const handleCardClick = useCallback(() => {
    if (contribution.contributor_note) setNoteExpanded((v) => !v);
    setShowSignIn(false);
  }, [contribution.contributor_note]);

  const handleReact = useCallback(
    async (type: ReactionType, e: React.MouseEvent) => {
      e.stopPropagation();

      if (!isLoggedIn) {
        setShowSignIn((v) => !v);
        return;
      }

      if (busy) return;
      setBusy(true);

      const wasActive = myReactions.includes(type);
      setMyReactions((prev) =>
        wasActive ? prev.filter((r) => r !== type) : [...prev, type]
      );
      setReactions((prev) => ({
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
        setReactions((prev) => ({
          ...prev,
          [type]: (prev[type] || 0) + (wasActive ? 1 : -1),
        }));
      } finally {
        setBusy(false);
      }
    },
    [isLoggedIn, busy, myReactions, contribution.id]
  );

  return (
    <div
      ref={ref}
      className={`${color} rounded-xl border p-4 shadow-soft transition-transform active:scale-[0.97] ${highlighted ? "ring-2 ring-green-300/60 dark:ring-green-500/40" : ""}`}
      style={{
        ["--card-rotation" as string]: `${rotation}deg`,
        transform: inView ? `rotate(${rotation}deg)` : undefined,
        opacity: inView ? 1 : 0,
        animation: inView
          ? highlighted
            ? `card-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both, card-sway 3s ease-in-out 800ms infinite`
            : `card-in 400ms cubic-bezier(0.34, 1.56, 0.64, 1) ${delay}ms both`
          : "none",
        boxShadow: highlighted ? "0 0 16px 4px rgba(74, 222, 128, 0.2)" : undefined,
        // Highlighted cards run card-sway forever. willChange forces GPU
        // layer promotion so the rotate() animation never triggers a paint
        // of the card's shadow/border/content during scroll.
        willChange: highlighted ? "transform" : undefined,
      }}
      onClick={handleCardClick}
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
      <p className={`text-sm font-medium text-zinc-800 dark:text-zinc-200 ${!contribution.contributor_name ? "italic" : ""}`}>
        {contribution.contributor_name || "Anonymous"}
      </p>
      {contribution.contributor_note && (
        <p
          className={`mt-1 text-xs text-zinc-600 transition-all duration-200 dark:text-zinc-400 ${
            noteExpanded ? "" : "line-clamp-2"
          }`}
        >
          &ldquo;{contribution.contributor_note}&rdquo;
        </p>
      )}

      <div className="mt-3 flex flex-wrap gap-1.5">
        {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => {
          const active = myReactions.includes(type);
          const count = reactions[type] || 0;
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
          className="mt-1.5 text-[11px] font-medium text-zinc-500 underline-offset-2 hover:text-zinc-700 hover:underline dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          See who reacted
        </button>
      )}

      {showSignIn && !isLoggedIn && (
        <div className="mt-2 rounded-lg bg-white/80 px-3 py-2 text-center">
          <p className="text-xs text-zinc-600">
            <Link
              href={signUpHref}
              className="font-medium text-zinc-900 underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              Sign in or sign up
            </Link>
            {" "}to react — takes 5 seconds
          </p>
        </div>
      )}

      <ReactorsSheet
        contributionId={contribution.id}
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        currentUserId={currentUserId ?? null}
      />
    </div>
  );
}
