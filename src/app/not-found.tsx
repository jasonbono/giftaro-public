import { AppHeader } from "@/components/app-header";
import { ButtonLink } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader logoHref="/" />
      <main className="flex flex-1 flex-col items-center justify-center gap-4 px-6">
        <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-50">
          404
        </h1>
        <p className="text-zinc-500 dark:text-zinc-400">
          This page doesn&apos;t exist.
        </p>
        <ButtonLink href="/" className="mt-2">
          Go home
        </ButtonLink>
      </main>
    </div>
  );
}
