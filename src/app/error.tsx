"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { Button } from "@/components/ui";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[giftaro:app-error]", {
      digest: error.digest,
      message: error.message,
      stack: error.stack,
    });
  }, [error]);

  return (
    <div className="flex min-h-screen flex-col">
      <AppHeader logoHref="/" />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          Something went wrong
        </h1>
        <p className="max-w-xs text-zinc-500 dark:text-zinc-400">
          Sorry about that — give it another shot, or head home and try again.
        </p>
        {error.digest && (
          <p className="text-xs text-zinc-400">Ref: {error.digest}</p>
        )}
        <div className="mt-2 flex flex-col items-center gap-2">
          <Button onClick={() => reset()}>Try again</Button>
          <Link
            href="/"
            className="text-sm text-zinc-500 hover:underline dark:text-zinc-400"
          >
            Go home
          </Link>
        </div>
      </main>
    </div>
  );
}
