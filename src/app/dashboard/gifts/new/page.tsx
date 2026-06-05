"use client";

import { AppHeader } from "@/components/app-header";
import { GiftForm } from "../gift-form";

export default function NewGiftPage() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-lg flex-col gap-6 px-6 py-8">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Start a gift
        </h1>
        <GiftForm mode="create" />
      </main>
    </div>
  );
}
