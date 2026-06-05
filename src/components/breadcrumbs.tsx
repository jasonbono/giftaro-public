import Link from "next/link";

export type BreadcrumbItem = { name: string; href: string };

export function Breadcrumbs({ items }: { items: BreadcrumbItem[] }) {
  if (items.length === 0) return null;
  return (
    <nav aria-label="Breadcrumb" className="text-sm text-zinc-500 dark:text-zinc-400">
      <ol className="flex flex-wrap items-center gap-1.5">
        {items.map((item, i) => {
          const isLast = i === items.length - 1;
          return (
            <li key={item.href} className="flex items-center gap-1.5">
              {isLast ? (
                <span aria-current="page" className="text-zinc-700 dark:text-zinc-200">
                  {item.name}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="hover:text-zinc-800 dark:hover:text-zinc-100"
                >
                  {item.name}
                </Link>
              )}
              {!isLast ? <span aria-hidden="true">/</span> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
