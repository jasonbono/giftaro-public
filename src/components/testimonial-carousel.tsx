"use client";

import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef } from "react";

export interface TestimonialExample {
  occasion: string;
  title: string;
  image: string;
  raised: number;
  goal: number;
  contributors: number;
  quote: string;
  organizer: string;
}

const AVATAR_PALETTE = [
  "bg-rose-300 text-rose-900",
  "bg-amber-300 text-amber-900",
  "bg-emerald-300 text-emerald-900",
  "bg-sky-300 text-sky-900",
  "bg-violet-300 text-violet-900",
  "bg-orange-300 text-orange-900",
  "bg-teal-300 text-teal-900",
  "bg-fuchsia-300 text-fuchsia-900",
];

function hashString(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function progressGradient(pct: number): string {
  if (pct >= 100)
    return "linear-gradient(90deg, #6366F1, #A855F7, #EC4899, #F97316, #FBBF24, #EAB308)";
  if (pct >= 70)
    return "linear-gradient(90deg, #6366F1, #A855F7, #EC4899, #F97316)";
  if (pct >= 30)
    return "linear-gradient(90deg, #4285F4, #6366F1, #A855F7, #EC4899)";
  return "linear-gradient(90deg, #4285F4, #818CF8)";
}

function fakeContributorInitials(seed: string, count: number): string[] {
  const pool = "ABCDEFGHJKLMNPRSTW";
  const out: string[] = [];
  const h = hashString(seed);
  for (let i = 0; i < count; i++) {
    out.push(pool[(h + i * 7) % pool.length]);
  }
  return out;
}

function Card({ ex, clone = false }: { ex: TestimonialExample; clone?: boolean }) {
  const pct = Math.min(100, Math.round((ex.raised / ex.goal) * 100));
  const initials = fakeContributorInitials(ex.organizer, Math.min(4, ex.contributors));
  const more = ex.contributors > 4 ? ex.contributors - 4 : 0;
  const seedHash = hashString(ex.organizer);

  return (
    <Link
      href="/sign-up"
      aria-hidden={clone || undefined}
      tabIndex={clone ? -1 : undefined}
      className="group relative flex shrink-0 basis-[78%] flex-col overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:border-zinc-300 hover:shadow-md active:scale-[0.98] sm:basis-[46%] md:basis-[31%] lg:basis-[23.5%] dark:border-zinc-800 dark:bg-zinc-900/80 dark:hover:border-zinc-700"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={ex.image}
          alt={ex.title}
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200">
          {ex.occasion}
        </div>
      </div>

      <div className="flex flex-1 flex-col p-4">
        <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
          {ex.title}
        </div>
        <div className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">
          by {ex.organizer}
        </div>

        <div className="mt-3">
          <div className="flex items-baseline justify-between text-[11px]">
            <span className="font-semibold text-zinc-900 dark:text-zinc-100">
              {ex.contributors} chipped in
            </span>
            <span className="tabular-nums text-zinc-400">
              ${ex.raised.toLocaleString()} of ${ex.goal.toLocaleString()}
            </span>
          </div>
          <div className="mt-1.5 flex items-center">
            <div className="flex -space-x-1.5">
              {initials.map((ch, i) => (
                <div
                  key={i}
                  className={`flex h-5 w-5 items-center justify-center rounded-full border border-white text-[9px] font-bold dark:border-zinc-900 ${AVATAR_PALETTE[(seedHash + i) % AVATAR_PALETTE.length]}`}
                >
                  {ch}
                </div>
              ))}
            </div>
            {more > 0 && (
              <span className="ml-1.5 text-[10px] font-medium text-zinc-400">
                +{more}
              </span>
            )}
          </div>
          <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
            <div
              className={`h-full rounded-full ${pct >= 100 ? "progress-shimmer" : ""}`}
              style={{ width: `${pct}%`, background: progressGradient(pct) }}
            />
          </div>
        </div>

        <p className="mt-3 text-[13px] leading-snug text-zinc-700 dark:text-zinc-300">
          &ldquo;{ex.quote}&rdquo;
        </p>
      </div>
    </Link>
  );
}

function ArrowButton({
  direction,
  onClick,
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Previous" : "Next"}
      className={`absolute top-1/2 z-20 hidden h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-zinc-200 bg-white opacity-100 shadow-md transition-[box-shadow,background-color] duration-150 hover:bg-zinc-50 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 md:flex dark:border-zinc-700 dark:bg-zinc-900 dark:hover:bg-zinc-800 [@media(pointer:coarse)]:!hidden ${
        direction === "left" ? "left-2" : "right-2"
      }`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 20 20"
        fill="currentColor"
        className={`h-4 w-4 text-zinc-700 dark:text-zinc-200 ${direction === "left" ? "" : "rotate-180"}`}
      >
        <path
          fillRule="evenodd"
          d="M12.79 5.23a.75.75 0 0 1 0 1.06L9.06 10l3.73 3.71a.75.75 0 1 1-1.06 1.06l-4.25-4.24a.75.75 0 0 1 0-1.06l4.25-4.24a.75.75 0 0 1 1.06 0Z"
          clipRule="evenodd"
        />
      </svg>
    </button>
  );
}

export function TestimonialCarousel({
  examples,
}: {
  examples: TestimonialExample[];
}) {
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const copyWidthRef = useRef(0);
  const jumpingRef = useRef(false);
  const idleTimerRef = useRef<number | null>(null);
  const n = examples.length;

  // Five copies with the middle at index 2. Wrapping only happens once
  // scroll has settled, so extra slack keeps a hard fling from hitting
  // an edge before we can reposition.
  const copies = [0, 1, 2, 3, 4];
  const MIDDLE = 2;

  const measureCopyWidth = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || n === 0) return 0;
    const first = el.children[0] as HTMLElement | undefined;
    const nextCopy = el.children[n] as HTMLElement | undefined;
    if (!first || !nextCopy) return 0;
    return nextCopy.offsetLeft - first.offsetLeft;
  }, [n]);

  const releaseJumpGuard = useCallback(() => {
    // Two frames: the self-induced scroll event fires on the next frame,
    // we clear the guard on the frame after so the re-entry is ignored.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        jumpingRef.current = false;
      });
    });
  }, []);

  useLayoutEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const w = measureCopyWidth();
    copyWidthRef.current = w;
    jumpingRef.current = true;
    el.scrollLeft = MIDDLE * w;
    releaseJumpGuard();
  }, [measureCopyWidth, releaseJumpGuard]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(() => {
      copyWidthRef.current = measureCopyWidth();
    });
    ro.observe(el);
    for (let i = 0; i < el.children.length; i++) {
      ro.observe(el.children[i]);
    }
    return () => ro.disconnect();
  }, [measureCopyWidth]);

  // Wrap only once scroll has been idle for a beat. Reacting on every
  // scroll event fought iOS momentum and scroll-snap, producing a
  // back-and-forth "buzz" near the copy boundaries.
  const onScroll = useCallback(() => {
    const el = scrollerRef.current;
    if (!el || jumpingRef.current) return;
    if (idleTimerRef.current !== null) {
      window.clearTimeout(idleTimerRef.current);
    }
    idleTimerRef.current = window.setTimeout(() => {
      idleTimerRef.current = null;
      const oneCopy = copyWidthRef.current;
      if (oneCopy <= 0) return;
      let sl = el.scrollLeft;
      const min = MIDDLE * oneCopy;
      const max = min + oneCopy;
      if (sl >= max || sl < min) {
        while (sl >= max) sl -= oneCopy;
        while (sl < min) sl += oneCopy;
        jumpingRef.current = true;
        el.scrollLeft = Math.round(sl);
        releaseJumpGuard();
      }
    }, 120);
  }, [releaseJumpGuard]);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      el.removeEventListener("scroll", onScroll);
      if (idleTimerRef.current !== null) {
        window.clearTimeout(idleTimerRef.current);
        idleTimerRef.current = null;
      }
    };
  }, [onScroll]);

  const scrollBy = (dir: "left" | "right") => {
    const el = scrollerRef.current;
    if (!el || jumpingRef.current) return;
    const dx = el.clientWidth * 0.8 * (dir === "left" ? -1 : 1);
    el.scrollBy({ left: dx, behavior: "smooth" });
  };

  return (
    <div className="relative w-full">
      <ArrowButton direction="left" onClick={() => scrollBy("left")} />
      <ArrowButton direction="right" onClick={() => scrollBy("right")} />

      {/* Edge fades — always shown since the carousel loops */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-[#fafafa] to-transparent dark:from-zinc-950"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-[#fafafa] to-transparent dark:from-zinc-950"
      />

      <div
        ref={scrollerRef}
        className="flex gap-4 overflow-x-auto overscroll-x-contain px-6 pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {copies.flatMap((copyIndex) =>
          examples.map((ex, i) => (
            <Card
              key={`${copyIndex}-${i}`}
              ex={ex}
              clone={copyIndex !== MIDDLE}
            />
          ))
        )}
      </div>
    </div>
  );
}
