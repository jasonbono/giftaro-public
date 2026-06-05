import { AppHeader } from "@/components/app-header";

export default function Loading() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="h-28 rounded-2xl bg-gradient-to-b from-brand/50 to-emerald-600/90 ring-1 ring-emerald-400/30 dark:from-brand/50 dark:to-emerald-700/90 dark:ring-emerald-500/20" />
        <div className="h-7 w-32 animate-pulse rounded-md bg-zinc-200 dark:bg-zinc-800" />
        <div className="flex animate-pulse flex-col gap-4">
          <div className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
          <div className="h-32 rounded-2xl bg-zinc-100 dark:bg-zinc-900" />
        </div>
      </main>
    </div>
  );
}
