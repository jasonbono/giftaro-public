"use client";

import Link from "next/link";

const CARD_COLORS = [
  "bg-rose-100 border-white/80",
  "bg-sky-100 border-white/80",
  "bg-amber-100 border-white/80",
  "bg-violet-100 border-white/80",
  "bg-fuchsia-100 border-white/80",
  "bg-orange-100 border-white/80",
];

const ROTATIONS = [-1.5, 1, -0.5, 1.5, 0, -1];

type ContributionCardProps = {
  giftId: string;
  giftTitle: string;
  amountCents: number;
  contributorNote: string | null;
  contributorImageUrl: string | null;
  index: number;
};

export function ContributionCard({
  giftId,
  giftTitle,
  amountCents,
  contributorNote,
  contributorImageUrl,
  index,
}: ContributionCardProps) {
  const color = CARD_COLORS[index % CARD_COLORS.length];
  const rotation = ROTATIONS[index % ROTATIONS.length];

  return (
    <Link href={`/gift/${giftId}`}>
      <div
        className={`${color} rounded-xl border p-4 shadow-md transition-all active:scale-[0.97] hover:shadow-lg`}
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        {contributorImageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={contributorImageUrl}
            alt=""
            className="mb-3 h-20 w-full rounded-lg object-cover"
          />
        )}
        <div className="flex items-start justify-between gap-2">
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 line-clamp-1">
            {giftTitle}
          </p>
          <span className="shrink-0 rounded-full border border-white/40 bg-white/60 px-2 py-0.5 text-xs font-bold text-zinc-700 shadow-sm dark:border-white/10 dark:bg-black/20 dark:text-zinc-300">
            ${(amountCents / 100).toFixed(0)}
          </span>
        </div>
        {contributorNote && (
          <p className="mt-1.5 text-xs text-zinc-600 line-clamp-2 dark:text-zinc-400">
            &ldquo;{contributorNote}&rdquo;
          </p>
        )}
      </div>
    </Link>
  );
}
