import Link from "next/link";

export function OrganizerBar({ giftId }: { giftId: string }) {
  return (
    <div className="mb-6 flex items-center justify-between rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
      <div className="flex items-center gap-2">
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-900 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
        </span>
        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
          You&apos;re organizing this gift
        </span>
      </div>
      <Link
        href={`/dashboard/gifts/${giftId}`}
        className="text-sm font-medium text-zinc-900 underline decoration-zinc-300 underline-offset-2 transition-colors hover:decoration-zinc-500 dark:text-zinc-100 dark:decoration-zinc-600 dark:hover:decoration-zinc-400"
      >
        Manage
      </Link>
    </div>
  );
}
