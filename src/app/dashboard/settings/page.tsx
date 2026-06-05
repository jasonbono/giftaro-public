import { getSession } from "@/lib/auth-session";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { UserMenu } from "@/components/user-menu";
import { DeleteAccountCard } from "./delete-account-card";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/?returnTo=/dashboard/settings");

  const email = session.user.email || "";
  const name = session.user.name || "User";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      <AppHeader inlineNav>
        <UserMenu userName={name} userEmail={email} />
      </AppHeader>

      <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-6 px-6 py-8">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="text-sm text-zinc-500 transition-colors hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            &larr; Dashboard
          </Link>
        </div>

        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Settings
        </h1>

        <section className="rounded-2xl border border-zinc-200/70 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Account
          </h2>
          <dl className="mt-3 flex flex-col gap-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Name</dt>
              <dd className="truncate text-zinc-900 dark:text-zinc-50">{name}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-zinc-500 dark:text-zinc-400">Email</dt>
              <dd className="truncate text-zinc-900 dark:text-zinc-50">{email}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-2xl border border-rose-200/70 bg-rose-50/40 p-5 dark:border-rose-900/60 dark:bg-rose-950/30">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-rose-700 dark:text-rose-300">
            Danger zone
          </h2>
          <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
            Deleting your account removes your profile, your gifts, and all
            contributions to them. This cannot be undone.
          </p>
          <div className="mt-4">
            <DeleteAccountCard email={email} />
          </div>
        </section>
      </main>
    </div>
  );
}
