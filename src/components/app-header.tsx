import { GiftaroLogo } from "@/components/giftaro-logo";
import { ReactNode } from "react";

export function AppHeader({
  logoHref,
  children,
  inlineNav = false,
}: {
  logoHref?: string;
  children?: ReactNode;
  inlineNav?: boolean;
}) {
  const layoutClass = inlineNav
    ? "flex flex-row items-center justify-between gap-3"
    : "flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-3";
  return (
    <header className={`${layoutClass} border-b border-zinc-200/70 px-4 py-3 dark:border-zinc-800 sm:px-6 sm:py-4`}>
      <GiftaroLogo href={logoHref} />
      {children && (
        <div className="flex flex-wrap items-center justify-end gap-2">
          {children}
        </div>
      )}
    </header>
  );
}
