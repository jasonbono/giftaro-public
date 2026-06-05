"use client";

import { signOut } from "@/lib/auth-client";
import Link from "next/link";
import { useState } from "react";

export function UserMenu({ userName, userEmail }: { userName: string; userEmail?: string | null }) {
  const [open, setOpen] = useState(false);

  const itemClass =
    "block w-full rounded-lg px-3 py-2 text-left text-sm text-zinc-700 transition-colors hover:bg-zinc-100 focus-visible:bg-zinc-100 focus-visible:outline-none dark:text-zinc-300 dark:hover:bg-zinc-800 dark:focus-visible:bg-zinc-800";

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-sm font-semibold text-white shadow-sm transition-all duration-150 hover:brightness-110 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-950"
      >
        {userName.charAt(0).toUpperCase()}
      </button>
      {open && (
        <div className="absolute right-0 top-10 z-50 w-64 rounded-xl border border-zinc-200 bg-white/95 p-1 shadow-xl shadow-zinc-900/5 backdrop-blur-sm dark:border-zinc-700 dark:bg-zinc-900/95 dark:shadow-black/40">
          {userEmail && (
            <div className="border-b border-zinc-200/70 px-3 py-2 dark:border-zinc-800">
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                Signed in as
              </p>
              <p className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-50">
                {userEmail}
              </p>
            </div>
          )}
          <Link href="/dashboard/settings" className={itemClass} onClick={() => setOpen(false)}>
            Settings
          </Link>
          <button
            onClick={async () => {
              await signOut({
                fetchOptions: {
                  onSuccess: () => { window.location.href = "/"; },
                },
              });
            }}
            className={itemClass}
          >
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
