import Link from "next/link";

export function GiftaroLogo({ href = "/dashboard" }: { href?: string }) {
  return (
    <Link
      href={href}
      className="flex shrink-0 origin-left items-center gap-2 transition-transform duration-75 active:scale-[0.97] active:opacity-80"
    >
      {/* Brand wordmark/logo genericized in this public snapshot. */}
      <span className="font-pixel text-lg font-bold text-zinc-900 dark:text-zinc-50">
        Giftaro
      </span>
    </Link>
  );
}
