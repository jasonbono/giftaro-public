"use client";

import { useEffect, useState } from "react";

export function BankLinkedBanner({ message, suppress = false }: { message: string; suppress?: boolean }) {
  const [show, setShow] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (suppress) return;
    if (new URLSearchParams(window.location.search).get("linked") !== "1") return;
    setShow(true);
    const t1 = setTimeout(() => setCollapsed(true), 4200);
    const t2 = setTimeout(() => setShow(false), 4800);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [suppress]);

  if (!show) return null;

  return (
    <div
      className="overflow-hidden transition-[max-height,opacity] duration-500 ease-out"
      style={{
        maxHeight: collapsed ? 0 : 120,
        opacity: collapsed ? 0 : 1,
        animation: collapsed ? undefined : "bank-linked-slide-in 400ms ease-out both",
      }}
    >
      <div className="flex items-center gap-3 rounded-2xl bg-gradient-to-br from-emerald-50 via-white to-emerald-50 px-4 py-3 ring-1 ring-emerald-200/70 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-emerald-950/40 dark:ring-emerald-900/60">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-sm">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
            className="h-5 w-5"
            style={{ animation: "bank-linked-pop 450ms ease-out both" }}
          >
            <path
              fillRule="evenodd"
              d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">
          {message}
        </p>
      </div>
    </div>
  );
}
