"use client";

import { useState } from "react";
import { Button, Input } from "@/components/ui";

export function DeleteAccountCard({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canConfirm = typed.trim().toLowerCase() === email.trim().toLowerCase() && !busy;

  async function onDelete() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/user", { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        setError(body.error || "Something went wrong. Please try again.");
        setBusy(false);
        return;
      }
      window.location.href = "/?deleted=1";
    } catch {
      setError("Network error. Please try again.");
      setBusy(false);
    }
  }

  function close() {
    if (busy) return;
    setOpen(false);
    setTyped("");
    setError(null);
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,background-color] duration-150 hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 focus-visible:ring-offset-2"
      >
        Delete account
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-account-title"
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900"
            onClick={(e) => e.stopPropagation()}
          >
            <h2
              id="delete-account-title"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-50"
            >
              Delete your account?
            </h2>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              This permanently removes your profile, your gifts, and every
              contribution to them. Gone is gone.
            </p>
            <p className="mt-4 text-sm text-zinc-700 dark:text-zinc-300">
              Type your email <span className="font-semibold text-zinc-900 dark:text-zinc-50">{email}</span> to confirm:
            </p>
            <Input
              type="email"
              autoComplete="off"
              autoCapitalize="off"
              autoCorrect="off"
              spellCheck={false}
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              placeholder={email}
              className="mt-2"
              disabled={busy}
            />

            {error && (
              <p className="mt-3 rounded-lg bg-rose-50 px-3 py-2 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {error}
              </p>
            )}

            <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" shape="pill" onClick={close} disabled={busy}>
                Cancel
              </Button>
              <button
                type="button"
                onClick={onDelete}
                disabled={!canConfirm}
                className="inline-flex items-center justify-center gap-2 rounded-full bg-rose-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition-[transform,background-color] duration-150 hover:bg-rose-700 active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-400/40 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
              >
                {busy ? "Deleting…" : "Delete account"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
