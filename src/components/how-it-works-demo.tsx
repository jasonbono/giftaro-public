"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import confetti from "canvas-confetti";
import { useInView } from "./use-in-view";

const GOAL = 250;
const CONTRIBUTORS = 8;

function useBarProgress(inView: boolean) {
  const [state, setState] = useState({ count: 0, amount: 0 });
  useEffect(() => {
    if (!inView) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      setState({ count: CONTRIBUTORS, amount: GOAL });
      return;
    }
    let raf = 0;
    const tick = () => {
      const bar = document.querySelector<HTMLElement>(".demo-progress");
      const track = bar?.parentElement;
      if (bar && track && track.offsetWidth > 0) {
        const pct = bar.offsetWidth / track.offsetWidth;
        const amount = Math.round(pct * GOAL);
        const count =
          pct >= 0.995
            ? CONTRIBUTORS
            : Math.floor(pct * CONTRIBUTORS);
        setState((s) =>
          s.count === count && s.amount === amount ? s : { count, amount },
        );
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [inView]);
  return state;
}

export function HowItWorksDemo() {
  const { ref, inView } = useInView<HTMLDivElement>();
  const { count, amount } = useBarProgress(inView);

  return (
    <section
      ref={ref}
      className="px-6 pb-16"
      data-play={inView ? "play" : "idle"}
    >
      <h2 className="mb-6 text-center text-xl font-semibold text-zinc-800 dark:text-zinc-200">
        How it happens.
      </h2>

      <LabelStrip />

      <div className="mx-auto mt-6 max-w-sm sm:max-w-md">
        <Link
          href="/sign-up"
          aria-label="Start a gift like this"
          className="demo-card group relative block overflow-hidden rounded-2xl border border-zinc-200/70 bg-white shadow-sm transition-shadow duration-300 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900/80"
        >
          <DemoCardBody count={count} amount={amount} />
        </Link>
      </div>
    </section>
  );
}

function LabelStrip() {
  return (
    <div className="mx-auto grid max-w-md grid-cols-4 gap-2 px-2 text-center">
      <LabelItem num="1" lineA="Name your" lineB="gift" index={1} />
      <LabelItem num="2" lineA="Share the" lineB="link" index={2} />
      <LabelItem num="3" lineA="Everyone" lineB="chips in" index={3} />
      <LabelItem num="4" lineA="Get something" lineB="awesome" index={4} />
    </div>
  );
}

function LabelItem({
  num,
  lineA,
  lineB,
  index,
}: {
  num: string;
  lineA: string;
  lineB: string;
  index: 1 | 2 | 3 | 4;
}) {
  return (
    <div className="flex flex-col items-center gap-2">
      <span
        className={`hiw-num hiw-num-${index} inline-flex h-7 w-7 items-center justify-center rounded-full text-[12px] font-semibold tabular-nums`}
      >
        {num}
      </span>
      <span className={`hiw-text hiw-text-${index} text-[10.5px] font-medium leading-[1.2]`}>
        {lineA}
        <br />
        {lineB}
      </span>
    </div>
  );
}

function DemoCardBody({ count, amount }: { count: number; amount: number }) {
  const funded = count >= CONTRIBUTORS;
  return (
    <>
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/examples/balance-bike-only.jpg"
          alt="A balance bike"
          className="demo-bike h-full w-full object-cover"
        />
        <div className="demo-reveal absolute left-3 top-3 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-zinc-700 shadow-sm backdrop-blur dark:bg-zinc-900/90 dark:text-zinc-200">
          Theo&apos;s 3rd
        </div>
        <div className="demo-funded-badge absolute inset-x-3 bottom-3 flex items-center justify-center gap-1.5 rounded-full bg-amber-400/95 px-3 py-1.5 text-[12px] font-semibold text-amber-950 shadow-lg backdrop-blur">
          <span aria-hidden>🎉</span>
          Theo&apos;s getting the bike
        </div>
      </div>

      <div className="flex flex-col p-4">
        <div className="demo-reveal text-[15px] font-semibold text-zinc-900 dark:text-zinc-50">
          His first bike
        </div>
        <div className="demo-reveal mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">by Lena</div>

        <div className="mt-3">
          <div className="demo-reveal flex items-baseline justify-between text-[11px]">
            <span
              className={`font-semibold tabular-nums ${funded ? "text-amber-500" : "text-zinc-900 dark:text-zinc-100"}`}
            >
              {count} chipped in{funded ? " · Fully funded" : ""}
            </span>
            <span
              className={`tabular-nums ${funded ? "text-amber-500" : "text-zinc-400"}`}
            >
              ${amount.toLocaleString()} of ${GOAL.toLocaleString()}
            </span>
          </div>

          <div className="mt-2 h-2.5 overflow-hidden rounded-full bg-zinc-100 ring-1 ring-inset ring-zinc-200/70 dark:bg-zinc-800 dark:ring-zinc-700/50">
            <div className="demo-progress relative h-full rounded-full">
              <div className="demo-progress-shimmer absolute inset-0 rounded-full" />
            </div>
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-1.5">
          <Chip index={1} initials="MG" color="bg-rose-300 text-rose-900" name="Mom" amount="$75" />
          <Chip index={2} initials="UJ" color="bg-sky-300 text-sky-900" name="Uncle J" amount="$50" />
          <Chip
            index={3}
            initials="GR"
            color="bg-violet-300 text-violet-900"
            name="Grandma"
            amount="$100"
            note="Proud of you, kid ❤️"
          />
        </div>
      </div>

      <DemoConfetti />
    </>
  );
}

const CONFETTI_COLORS = ["#f472b6", "#facc15", "#34d399", "#60a5fa", "#c084fc"];

// Real canvas-confetti (same library/colors as the funded gift page),
// rendered into a canvas scoped to the card so it stays contained. A
// hidden beacon shares the demo's paused/gated animation clock; its
// animationiteration fires exactly on the funded beat of every loop,
// staying in sync through scroll-out/in pauses.
function DemoConfetti() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fireRef = useRef<ReturnType<typeof confetti.create> | null>(null);

  useEffect(() => {
    if (!canvasRef.current) return;
    const instance = confetti.create(canvasRef.current, {
      resize: true,
      useWorker: true,
    });
    fireRef.current = instance;
    return () => {
      instance.reset();
      fireRef.current = null;
    };
  }, []);

  const burst = () => {
    const fire = fireRef.current;
    if (!fire) return;
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }
    const end = Date.now() + 800;
    const frame = () => {
      fire({
        particleCount: 3,
        angle: 60,
        spread: 55,
        startVelocity: 26,
        scalar: 0.7,
        origin: { x: 0, y: 0.7 },
        colors: CONFETTI_COLORS,
      });
      fire({
        particleCount: 3,
        angle: 120,
        spread: 55,
        startVelocity: 26,
        scalar: 0.7,
        origin: { x: 1, y: 0.7 },
        colors: CONFETTI_COLORS,
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        aria-hidden
        className="pointer-events-none absolute inset-0 h-full w-full"
      />
      <span
        aria-hidden
        className="demo-confetti-beacon pointer-events-none absolute"
        onAnimationIteration={burst}
      />
    </>
  );
}

function Chip({
  index,
  initials,
  color,
  name,
  amount,
  note,
}: {
  index: 1 | 2 | 3;
  initials: string;
  color: string;
  name: string;
  amount: string;
  note?: string;
}) {
  return (
    <div
      className={`demo-chip demo-chip-${index} flex items-center gap-2 ${note ? "rounded-2xl px-2 py-1.5" : "rounded-full px-2 py-1"} bg-zinc-50 ring-1 ring-zinc-200/70 dark:bg-zinc-800/60 dark:ring-zinc-700/50`}
    >
      <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[9px] font-bold ${color}`}>
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="text-[12px] font-medium text-zinc-700 dark:text-zinc-300">{name}</span>
          <span className="tabular-nums text-[12px] font-semibold text-zinc-900 dark:text-zinc-100">{amount}</span>
        </div>
        {note && (
          <p className="truncate text-[11px] italic text-zinc-500 dark:text-zinc-400">{note}</p>
        )}
      </div>
    </div>
  );
}
