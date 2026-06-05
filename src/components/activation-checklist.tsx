"use client";

import { useState } from "react";
import { Button, ButtonLink } from "@/components/ui";
import type { OnboardingState } from "@/lib/onboarding-state";

export function ActivationChecklist({ state }: { state: OnboardingState }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-zinc-200/70 dark:bg-zinc-950 dark:ring-zinc-800">
      <ChecklistStep state="done" label="Gift created" />

      <div className="border-t border-zinc-100 dark:border-zinc-900" />

      <div className="bg-gradient-to-br from-emerald-50 via-white to-rose-50 px-5 py-6 dark:from-emerald-950/40 dark:via-zinc-950 dark:to-rose-950/40">
        <MoneyFlow />
        <div className="flex items-start gap-3">
          <StepMarker state="active">2</StepMarker>
          <div className="flex-1 pt-1">
            {state === "under_review" ? (
              <>
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Stripe is reviewing your info
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Usually a few minutes. We&apos;ll update this the moment you&apos;re ready to collect.
                </p>
              </>
            ) : state === "incomplete" ? (
              <>
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Pick up where you left off
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Stripe still needs a bit more from you.
                </p>
              </>
            ) : (
              <>
                <p className="text-base font-semibold text-zinc-900 dark:text-zinc-50">
                  Link your bank
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Two minutes. One time.
                </p>
              </>
            )}
          </div>
        </div>
        {state !== "under_review" && <LinkBankButton state={state} />}
        <PoweredByStripe />
        {state !== "under_review" && <TrustTicker />}
      </div>

      <div className="border-t border-zinc-100 dark:border-zinc-900" />

      <ChecklistStep
        state="locked"
        label="Share the link"
        subtitle="Unlocks once your bank's connected."
      />
    </div>
  );
}

function MoneyFlow() {
  return (
    <div
      className="mb-5 flex items-start justify-between gap-1"
      role="img"
      aria-label="Friends chip in, Stripe sends the money to your bank, then you get paid."
    >
      <FlowNode icon={<PeopleIcon />} label="Friends chip in" />
      <FlowArrow />
      <FlowNode icon={<ShieldIcon />} label="Stripe sends" />
      <FlowArrow />
      <FlowNode icon={<BankIcon />} label="You get paid" highlight />
    </div>
  );
}

function FlowNode({
  icon,
  label,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  highlight?: boolean;
}) {
  const circle = highlight
    ? "bg-brand text-white shadow-brand-glow"
    : "bg-white text-zinc-500 ring-1 ring-zinc-200 dark:bg-zinc-900 dark:text-zinc-400 dark:ring-zinc-800";
  const text = highlight
    ? "text-zinc-900 dark:text-zinc-100"
    : "text-zinc-600 dark:text-zinc-400";
  return (
    <div className="flex w-[76px] shrink-0 flex-col items-center gap-2 text-center">
      <div className={`flex h-12 w-12 items-center justify-center rounded-full ${circle}`}>
        {icon}
      </div>
      <p className={`text-[11px] font-medium leading-tight ${text}`}>{label}</p>
    </div>
  );
}

function FlowArrow() {
  return (
    <div
      className="relative mt-[22px] h-px flex-1 self-start bg-zinc-300 dark:bg-zinc-700"
      aria-hidden
    >
      <span
        className="absolute -top-[2.5px] h-1.5 w-1.5 rounded-full bg-brand"
        style={{ animation: "flow-dot 2.6s ease-in-out infinite" }}
      />
      <span
        className="absolute -top-[3px] right-[-1px] block h-0 w-0"
        style={{
          borderTop: "3px solid transparent",
          borderBottom: "3px solid transparent",
          borderLeft: "4px solid currentColor",
          color: "rgb(212 212 216)",
        }}
      />
    </div>
  );
}

function PeopleIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM1.49 15.326a.78.78 0 0 1-.358-.442 3 3 0 0 1 4.308-3.517 6.484 6.484 0 0 0-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 0 1-2.07-.654ZM16.44 15.98a4.97 4.97 0 0 0 2.07-.654.78.78 0 0 0 .357-.442 3 3 0 0 0-4.308-3.517 6.484 6.484 0 0 1 1.907 3.96 2.32 2.32 0 0 1-.026.654ZM18 8a2 2 0 1 1-4 0 2 2 0 0 1 4 0ZM5.304 16.19a.844.844 0 0 1-.277-.71 5 5 0 0 1 9.947 0 .843.843 0 0 1-.277.71A6.975 6.975 0 0 1 10 18a6.974 6.974 0 0 1-4.696-1.81Z" />
    </svg>
  );
}

function ShieldIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path fillRule="evenodd" d="M10 1.944A11.954 11.954 0 0 1 2.166 5C2.056 5.649 2 6.319 2 7c0 5.225 3.34 9.67 8 11.317C14.66 16.67 18 12.225 18 7c0-.682-.057-1.35-.166-2.001A11.954 11.954 0 0 1 10 1.944Zm3.707 6.763a1 1 0 0 0-1.414-1.414L9 10.586 7.707 9.293a1 1 0 0 0-1.414 1.414l2 2a1 1 0 0 0 1.414 0l4-4Z" clipRule="evenodd" />
    </svg>
  );
}

function BankIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
      <path d="M9.25 1.625a1.5 1.5 0 0 1 1.5 0l7.5 4.333a.75.75 0 0 1-.375 1.4H2.125a.75.75 0 0 1-.375-1.4l7.5-4.333Z" />
      <path d="M3.5 8.858h2v6.017h-.25a.75.75 0 0 0 0 1.5h13.5a.75.75 0 0 0 0-1.5h-.25V8.858h-2v6.017h-1.5V8.858h-2v6.017h-2V8.858h-2v6.017H6V8.858H3.5Z" />
    </svg>
  );
}

function LinkBankButton({ state }: { state: OnboardingState }) {
  const [loading, setLoading] = useState(false);
  if (state === "incomplete") {
    return (
      <ButtonLink
        href="/api/stripe/connect/refresh"
        shape="block"
        className="mt-4"
        style={{ animation: "cta-gift-press 4s ease-in-out infinite" }}
      >
        Resume setup
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
          <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
        </svg>
      </ButtonLink>
    );
  }
  async function handleConnect() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/connect", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setLoading(false);
      }
    } catch {
      setLoading(false);
    }
  }
  return (
    <Button
      onClick={handleConnect}
      disabled={loading}
      shape="block"
      className="mt-4"
      style={{ animation: "cta-gift-press 4s ease-in-out infinite" }}
    >
      {loading ? "Opening…" : (
        <>
          Link your bank
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M3 10a.75.75 0 0 1 .75-.75h10.638L10.23 5.29a.75.75 0 1 1 1.04-1.08l5.5 5.25a.75.75 0 0 1 0 1.08l-5.5 5.25a.75.75 0 1 1-1.04-1.08l4.158-3.96H3.75A.75.75 0 0 1 3 10Z" clipRule="evenodd" />
          </svg>
        </>
      )}
    </Button>
  );
}

function PoweredByStripe() {
  return (
    <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-500">
      <span>Powered by</span>
      <span
        className="font-semibold tracking-tight"
        style={{ color: "#635BFF", letterSpacing: "-0.02em", fontSize: "15px" }}
      >
        Stripe
      </span>
    </p>
  );
}

function TickerContent({ ariaHidden }: { ariaHidden?: boolean }) {
  const brands: { src: string; label: string }[] = [
    { src: "/brand/uber.svg", label: "Uber" },
    { src: "/brand/doordash.svg", label: "DoorDash" },
    { src: "/brand/shopify.svg", label: "Shopify" },
  ];
  return (
    <span
      className="flex shrink-0 items-center gap-3 pr-3 text-xs text-zinc-500 dark:text-zinc-500"
      aria-hidden={ariaHidden}
    >
      <span>256-bit encrypted</span>
      <span aria-hidden="true">·</span>
      <span>FDIC-insured bank partner</span>
      <span aria-hidden="true">·</span>
      <span>Trusted by</span>
      <span className="flex items-center gap-1.5">
        {brands.map((b) => (
          <span
            key={b.label}
            role={ariaHidden ? undefined : "img"}
            aria-label={ariaHidden ? undefined : b.label}
            title={b.label}
            className="inline-block h-5 w-5 bg-zinc-500 dark:bg-zinc-500"
            style={{
              maskImage: `url(${b.src})`,
              WebkitMaskImage: `url(${b.src})`,
              maskSize: "contain",
              WebkitMaskSize: "contain",
              maskRepeat: "no-repeat",
              WebkitMaskRepeat: "no-repeat",
              maskPosition: "center",
              WebkitMaskPosition: "center",
            }}
          />
        ))}
      </span>
      <span aria-hidden="true">·</span>
    </span>
  );
}

function TrustTicker() {
  return (
    <div
      className="mt-2 overflow-hidden"
      style={{
        maskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
        WebkitMaskImage: "linear-gradient(to right, transparent, black 12%, black 88%, transparent)",
      }}
    >
      <div
        className="flex w-max whitespace-nowrap"
        style={{ animation: "trust-scroll 7s linear infinite" }}
      >
        <TickerContent />
        <TickerContent ariaHidden />
      </div>
    </div>
  );
}

function ChecklistStep({
  state,
  label,
  subtitle,
}: {
  state: "done" | "locked";
  label: string;
  subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 px-5 py-4">
      <StepMarker state={state}>
        {state === "done" ? (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
            <path fillRule="evenodd" d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z" clipRule="evenodd" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
            <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
          </svg>
        )}
      </StepMarker>
      <div className="flex-1">
        <p className={`text-sm font-medium ${state === "done" ? "text-zinc-500 dark:text-zinc-500" : "text-zinc-400 dark:text-zinc-500"}`}>
          {label}
        </p>
        {subtitle && (
          <p className="mt-0.5 text-xs text-zinc-400 dark:text-zinc-600">
            {subtitle}
          </p>
        )}
      </div>
    </div>
  );
}

function StepMarker({
  state,
  children,
}: {
  state: "done" | "active" | "locked";
  children: React.ReactNode;
}) {
  const styles: Record<typeof state, string> = {
    done: "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-400",
    active: "bg-brand text-white shadow-brand-glow",
    locked: "bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-600",
  };
  const size = state === "active" ? "h-9 w-9 text-sm font-semibold" : "h-7 w-7 text-xs font-semibold";
  return (
    <div className={`flex shrink-0 items-center justify-center rounded-full ${size} ${styles[state]}`}>
      {children}
    </div>
  );
}
