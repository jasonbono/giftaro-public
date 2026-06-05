"use client";

import { useSyncExternalStore } from "react";
import { useShare } from "@/hooks/use-share";
import { Button, ButtonLink } from "@/components/ui";

const subscribe = () => () => {};

export function ShareGiftCta({
  giftTitle,
  variant = "hero",
}: {
  giftTitle: string;
  variant?: "hero" | "compact";
}) {
  const giftUrl = useSyncExternalStore(subscribe, () => window.location.href.split("?")[0], () => "");
  const { share, copied } = useShare({
    url: giftUrl,
    text: `We're getting ${giftTitle} — chip into the pool!`,
  });

  if (variant === "compact") {
    return (
      <div className="mt-8 pt-6 text-center">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Know another friend who&apos;d love to chip in?
        </p>
        <Button onClick={share} className="mt-2">
          {copied ? "Link copied!" : "Share this gift"}
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-brand/20 bg-brand/5 p-6 text-center">
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        Know a friend who&apos;d love to chip in?
      </p>
      <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
        Share this gift — everyone can chip in.
      </p>
      <Button onClick={share} className="mt-4">
        {copied ? "Link copied!" : "Share this gift"}
      </Button>
    </div>
  );
}

type CtaContext = "general" | "just-contributed" | "gift-wrapped";

function ctaCopy(context: CtaContext, organizerFirstName?: string): {
  heading: string;
  body?: string;
  signsLead?: string;
  signs?: string[];
} {
  if (context === "just-contributed") {
    const subject = organizerFirstName || "They";
    return {
      heading: `${subject} just elevated their life with Giftaro.`,
      signsLead: "Signs you should too:",
      signs: [
        "A house of gifts you feel too guilty to part with.",
        "A forced wishlist because the real thing feels too much to ask.",
        "Ten small gifts that could\u2019ve been one thing you\u2019d actually love.",
      ],
    };
  }
  if (context === "gift-wrapped") {
    return {
      heading: "One great gift. Your turn.",
    };
  }
  return {
    heading: "Your turn for one great gift.",
    body: "Start one in 60 seconds. Share the link. Make their year.",
  };
}

function SignsBlock({ signsLead, signs }: { signsLead?: string; signs?: string[] }) {
  if (!signs || signs.length === 0) return null;
  return (
    <div className="mt-3 text-left">
      {signsLead && (
        <p className="text-sm text-zinc-600 dark:text-zinc-300">{signsLead}</p>
      )}
      <ul className="mt-1 list-disc space-y-1 pl-5 text-sm text-zinc-500 dark:text-zinc-400">
        {signs.map((s, i) => <li key={i}>{s}</li>)}
      </ul>
    </div>
  );
}

export function SignUpCta({ context = "general", organizerFirstName }: { context?: CtaContext; organizerFirstName?: string } = {}) {
  const { heading, body, signsLead, signs } = ctaCopy(context, organizerFirstName);
  return (
    <div className="rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        {heading}
      </p>
      {body && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {body}
        </p>
      )}
      <SignsBlock signsLead={signsLead} signs={signs} />
      <ButtonLink
        href="/?mode=signup&returnTo=/dashboard/gifts/new"
        className="mt-4"
      >
        Create your own gift
      </ButtonLink>
    </div>
  );
}

export function LoggedInCta({ context = "general", organizerFirstName }: { context?: CtaContext; organizerFirstName?: string } = {}) {
  const { heading, body, signsLead, signs } = ctaCopy(context, organizerFirstName);
  return (
    <div className="rounded-xl border border-zinc-200 p-6 text-center dark:border-zinc-800">
      <p className="text-base font-medium text-zinc-900 dark:text-zinc-50">
        {heading}
      </p>
      {body && (
        <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
          {body}
        </p>
      )}
      <SignsBlock signsLead={signsLead} signs={signs} />
      <ButtonLink href="/dashboard/gifts/new" className="mt-4">
        Create your own gift
      </ButtonLink>
    </div>
  );
}

export function ShareGiftaroCta() {
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "");
  const { share, copied } = useShare({
    url: origin,
    title: "Giftaro — group gifts made easy",
    text: "Let friends chip in on any gift. No app needed.",
  });

  return (
    <div className="border-t border-zinc-100 pt-5 text-center dark:border-zinc-800">
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        Know someone who&apos;d love this?
      </p>
      <button
        onClick={share}
        className="mt-2 text-sm font-medium text-brand underline-offset-2 hover:underline"
      >
        {copied ? "Link copied!" : "Send Giftaro to a friend"}
      </button>
    </div>
  );
}

export function LoggedInFooterCta() {
  const origin = useSyncExternalStore(subscribe, () => window.location.origin, () => "");
  const { share, copied } = useShare({
    url: origin,
    title: "Giftaro — group gifts made easy",
    text: "Let friends chip in on any gift. No app needed.",
  });

  return (
    <div className="mt-8 border-t border-zinc-100 pt-6 text-center dark:border-zinc-800">
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Got someone you&apos;d love to surprise?
      </p>
      <Button onClick={share} className="mt-2">
        {copied ? "Link copied!" : "Share Giftaro"}
      </Button>
    </div>
  );
}
