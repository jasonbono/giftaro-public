"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { GiftProgress } from "@/components/gift-progress";

interface GiftCardProps {
  id: string;
  title: string;
  totalContributedCents: number;
  targetAmountCents: number;
  imageUrl: string | null;
  dormant?: boolean;
  contributorCount?: number;
  contributors?: { image_url: string | null; name: string | null }[];
}

export default function GiftCard({
  id,
  title,
  totalContributedCents,
  targetAmountCents,
  imageUrl,
  dormant = false,
  contributorCount = 0,
  contributors = [],
}: GiftCardProps) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [trashing, setTrashing] = useState(false);

  async function handleTrash() {
    if (!confirming) {
      setConfirming(true);
      return;
    }
    setTrashing(true);
    const res = await fetch(`/api/gifts/${id}/trash`, { method: "POST" });
    if (res.ok) {
      router.refresh();
    } else {
      setTrashing(false);
      setConfirming(false);
    }
  }

  return (
    <div className="group relative rounded-xl border border-zinc-200 transition-all duration-150 hover:border-zinc-300 hover:bg-zinc-50 hover:shadow-sm active:scale-[0.995] active:bg-zinc-100 dark:border-zinc-800 dark:hover:border-zinc-700 dark:hover:bg-zinc-900 dark:active:bg-zinc-800">
      <Link href={`/dashboard/gifts/${id}`} className="flex items-center gap-4 p-4">
        {imageUrl && (
          <img
            src={imageUrl}
            alt=""
            className={`h-20 w-20 flex-shrink-0 rounded-lg bg-zinc-100 object-contain dark:bg-zinc-800 ${dormant ? "opacity-60 grayscale" : ""}`}
          />
        )}
        <div className="min-w-0 flex-1">
          <h3 className={`line-clamp-2 pr-8 font-medium ${dormant ? "text-zinc-500 dark:text-zinc-400" : "text-zinc-900 dark:text-zinc-50"}`}>
            {title}
          </h3>
          <div className="mt-3 flex items-start gap-3">
            {dormant ? (
              <span className="flex items-center gap-1.5 text-xs text-zinc-400 dark:text-zinc-500">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                  <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
                </svg>
                Waiting on bank
              </span>
            ) : (
              <div className="min-w-0 flex-1">
                <GiftProgress
                  totalContributedCents={totalContributedCents}
                  targetAmountCents={targetAmountCents}
                  contributorCount={contributorCount}
                  contributors={contributors}
                  variant="compact"
                />
              </div>
            )}
          </div>
        </div>
      </Link>

      <button
        onClick={handleTrash}
        onBlur={() => setConfirming(false)}
        disabled={trashing}
        className="absolute right-3 top-3 rounded-lg p-1.5 text-zinc-400 opacity-0 transition-all hover:bg-red-50 hover:text-red-500 group-hover:opacity-100 dark:hover:bg-red-950 dark:hover:text-red-400"
        title={confirming ? "Tap again to confirm" : "Trash gift"}
      >
        {trashing ? (
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : confirming ? (
          <span className="text-xs font-medium text-red-500">Delete?</span>
        ) : (
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="m14.74 9-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 0 1-2.244 2.077H8.084a2.25 2.25 0 0 1-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 0 0-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 0 1 3.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 0 0-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 0 0-7.5 0" />
          </svg>
        )}
      </button>
    </div>
  );
}
