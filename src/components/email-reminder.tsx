"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
] as const;

type Props = {
  source?: string;
  embedded?: boolean;
};

export function EmailReminder({ source = "landing", embedded = false }: Props) {
  const [email, setEmail] = useState("");
  const [month, setMonth] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (loading || done) return;
    setLoading(true);

    const eventMonth = month ? Number.parseInt(month, 10) : null;
    const referrerPath =
      typeof window !== "undefined" ? window.location.pathname : null;

    try {
      await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, source, eventMonth, referrerPath }),
      });
    } catch {
      // swallow; success state is unconditional to avoid leaking signal
    }

    setDone(true);
    setLoading(false);
  }

  const card = (
    <div className="mx-auto w-full max-w-md rounded-3xl border border-zinc-200/80 bg-white/70 p-6 shadow-sm backdrop-blur-sm dark:border-zinc-800/80 dark:bg-zinc-900/40 sm:p-8">
        {done ? (
          <div className="text-center">
            <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
              You&apos;re set.
            </p>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              We&apos;ll email you when it&apos;s time to start the gift.
            </p>
          </div>
        ) : (
          <>
            <h2 className="text-balance text-center text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
              Want a reminder? We&apos;ve got you.
            </h2>
            <p className="mt-2 text-balance text-center text-sm text-zinc-600 dark:text-zinc-400 sm:text-base">
              Tell us when the birthday or occasion is.
            </p>
            <form onSubmit={handleSubmit} className="mt-5 flex flex-col gap-3">
              <Input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                inputMode="email"
              />
              <select
                aria-label="Birthday or occasion month"
                value={month}
                onChange={(e) => setMonth(e.target.value)}
                required
                className="w-full rounded-xl border border-hairline bg-surface-raised px-4 py-3 text-base text-ink-primary outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/20 invalid:text-ink-faint"
              >
                <option value="" disabled>
                  Birthday or occasion month
                </option>
                {MONTHS.map((name, i) => (
                  <option key={name} value={i + 1}>
                    {name}
                  </option>
                ))}
              </select>
              <Button type="submit" shape="block" disabled={loading}>
                {loading ? "Saving…" : "Remind me"}
              </Button>
            </form>
          </>
        )}
    </div>
  );

  if (embedded) return card;
  return <section className="px-6 pb-16">{card}</section>;
}
