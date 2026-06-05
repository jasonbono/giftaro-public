"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

const REACTION_EMOJI = {
  thank: "🙏",
  laugh: "😂",
  love: "❤️",
} as const;

type ReactionType = keyof typeof REACTION_EMOJI;

type Reactor = {
  userId: string;
  reactionType: string;
  name: string;
  image: string | null;
};

export function ReactorsSheet({
  contributionId,
  open,
  onClose,
  currentUserId,
}: {
  contributionId: string;
  open: boolean;
  onClose: () => void;
  currentUserId: string | null;
}) {
  const [data, setData] = useState<{
    forContribution: string | null;
    reactors: Reactor[] | null;
    error: boolean;
  }>({ forContribution: null, reactors: null, error: false });
  const [filter, setFilter] = useState<"all" | ReactionType>("all");

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetch(`/api/contributions/${contributionId}/react`)
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((res) => {
        if (!cancelled) {
          setData({
            forContribution: contributionId,
            reactors: res.reactors as Reactor[],
            error: false,
          });
        }
      })
      .catch(() => {
        if (!cancelled) {
          setData({ forContribution: contributionId, reactors: null, error: true });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [open, contributionId]);

  const isFresh = data.forContribution === contributionId;
  const reactors = isFresh ? data.reactors : null;
  const error = isFresh && data.error;

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const counts: Record<ReactionType, number> = { thank: 0, laugh: 0, love: 0 };
  (reactors || []).forEach((r) => {
    if (r.reactionType in counts) counts[r.reactionType as ReactionType]++;
  });

  const visible = (reactors || []).filter(
    (r) => filter === "all" || r.reactionType === filter
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center"
      onClick={onClose}
    >
      <div
        className="absolute inset-0 bg-black/40"
        style={{ animation: "sheet-fade-in 200ms ease-out" }}
      />
      <div
        className="relative w-full max-w-md overflow-hidden rounded-t-2xl bg-white shadow-2xl dark:bg-zinc-900 sm:rounded-2xl"
        style={{ animation: "sheet-slide-up 240ms cubic-bezier(0.22, 1, 0.36, 1)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
          <h2 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">
            Reactions
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="rounded-full p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        <div className="flex gap-1 overflow-x-auto px-3 py-2">
          <FilterPill
            active={filter === "all"}
            onClick={() => setFilter("all")}
            label={`All ${reactors ? reactors.length : ""}`.trim()}
          />
          {(Object.keys(REACTION_EMOJI) as ReactionType[]).map((type) => (
            <FilterPill
              key={type}
              active={filter === type}
              onClick={() => setFilter(type)}
              label={`${REACTION_EMOJI[type]} ${counts[type] || 0}`}
              dimmed={counts[type] === 0}
            />
          ))}
        </div>

        <div className="max-h-[50vh] overflow-y-auto px-2 pb-3">
          {error ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              Couldn&apos;t load reactions. Try again.
            </p>
          ) : reactors === null ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-400 dark:text-zinc-500">
              Loading…
            </p>
          ) : visible.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">
              No reactions yet.
            </p>
          ) : (
            <ul className="flex flex-col">
              {visible.map((r, i) => (
                <li
                  key={`${r.userId}-${r.reactionType}-${i}`}
                  className="flex items-center gap-3 rounded-lg px-3 py-2"
                >
                  <Avatar name={r.name} image={r.image} />
                  <span className="flex-1 truncate text-sm text-zinc-900 dark:text-zinc-100">
                    {r.userId === currentUserId ? "You" : r.name}
                  </span>
                  <span className="text-base" aria-label={r.reactionType}>
                    {REACTION_EMOJI[r.reactionType as ReactionType] || ""}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  dimmed,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  dimmed?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
        active
          ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
          : dimmed
          ? "text-zinc-400 dark:text-zinc-600"
          : "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
      }`}
    >
      {label}
    </button>
  );
}

function Avatar({ name, image }: { name: string; image: string | null }) {
  if (image) {
    return (
      <div className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full">
        <Image src={image} alt="" fill sizes="32px" className="object-cover" />
      </div>
    );
  }
  const initial = (name || "?").trim().charAt(0).toUpperCase();
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-xs font-semibold text-zinc-700 dark:bg-zinc-700 dark:text-zinc-200">
      {initial}
    </div>
  );
}
