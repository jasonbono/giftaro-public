"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReopenGiftButton({ giftId }: { giftId: string }) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleReopen() {
    if (!window.confirm("Reopen this gift? It will start accepting contributions again.")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/gifts/${giftId}/reopen`, { method: "POST" });
      if (res.ok) {
        router.refresh();
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleReopen}
      disabled={loading}
      className="rounded-lg border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-500 transition-colors hover:bg-zinc-50 hover:text-zinc-700 disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-zinc-300"
    >
      {loading ? "Reopening..." : "Reopen"}
    </button>
  );
}
