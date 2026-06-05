import { getSession } from "@/lib/auth-session";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AppHeader } from "@/components/app-header";
import { LandingAuth } from "@/components/landing-auth";
import { HowItWorksDemo } from "@/components/how-it-works-demo";
import { EmailReminder } from "@/components/email-reminder";
import {
  TestimonialCarousel,
  type TestimonialExample,
} from "@/components/testimonial-carousel";

const EXAMPLES: TestimonialExample[] = [
  {
    occasion: "Christmas, for both kids",
    title: "A family dog",
    image: "/examples/dog.jpg",
    raised: 1200,
    goal: 1200,
    contributors: 12,
    quote: "Instead of ten things each.",
    organizer: "Mark",
  },
  {
    occasion: "Daughter's 7th",
    title: "A piano to learn on",
    image: "/examples/piano.jpg",
    raised: 575,
    goal: 700,
    contributors: 11,
    quote: "Grandparents, aunts, godparents. One link.",
    organizer: "Claire",
  },
  {
    occasion: "Teen's 15th",
    title: "The real camera",
    image: "/examples/camera.jpg",
    raised: 210,
    goal: 210,
    contributors: 10,
    quote: "She said her phone wasn't enough.",
    organizer: "Dave",
  },
  {
    occasion: "Arjun's 10th",
    title: "The mountain bike he's been asking for",
    image: "/examples/bike.jpg",
    raised: 370,
    goal: 370,
    contributors: 9,
    quote: "He's asked for it two years running.",
    organizer: "Priya",
  },
  {
    occasion: "Theo's 3rd",
    title: "His first bike",
    image: "/examples/balance-bike.jpg",
    raised: 250,
    goal: 250,
    contributors: 8,
    quote: "Tiny human, real wheels.",
    organizer: "Lena",
  },
  {
    occasion: "Owen's 8th",
    title: "The big Lego set",
    image: "/examples/legos.jpg",
    raised: 260,
    goal: 260,
    contributors: 9,
    quote: "A whole rainy weekend in one box.",
    organizer: "Hannah",
  },
  {
    occasion: "Christmas, combined",
    title: "A trip together",
    image: "/examples/trip.jpg",
    raised: 2000,
    goal: 2000,
    contributors: 14,
    quote: "Our Christmas to each other.",
    organizer: "Sam & Nora",
  },
  {
    occasion: "Dad's 60th",
    title: "Dad's pinball machine",
    image: "/examples/pinball.jpg",
    raised: 2800,
    goal: 3400,
    contributors: 13,
    quote: "The basement is done.",
    organizer: "Ethan",
  },
];

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string; deleted?: string }>;
}) {
  // Fast path for logged-out visitors (the dominant first-click audience):
  // skip the Better Auth DB round-trip entirely when no session cookie is
  // present. Cookies can still be invalid/expired, so when one IS present
  // we fall through to a full getSession() to decide on the redirect.
  const cookieStore = await cookies();
  const hasSessionCookie =
    cookieStore.has("better-auth.session_token") ||
    cookieStore.has("__Secure-better-auth.session_token");

  if (hasSessionCookie) {
    const session = await getSession();
    if (session?.user?.id) {
      const { returnTo } = await searchParams;
      const safeTo =
        returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/\\")
          ? returnTo
          : null;
      redirect(safeTo ?? "/dashboard");
    }
  }

  const { deleted } = await searchParams;
  const showDeleted = deleted === "1";

  return (
    <div className="flex min-h-[100dvh] flex-col">
      {showDeleted && (
        <div className="bg-emerald-600 px-4 py-3 text-center text-sm font-medium text-white">
          Your account has been deleted.
        </div>
      )}
      <AppHeader logoHref="/" inlineNav>
        <Link
          href="/why"
          className="inline-flex items-center rounded-full border border-zinc-200/80 bg-white/60 px-3.5 py-1.5 text-xs font-medium text-zinc-700 shadow-sm backdrop-blur-sm transition hover:border-zinc-300 hover:bg-white/90 hover:text-zinc-900 hover:shadow dark:border-zinc-700/70 dark:bg-zinc-900/50 dark:text-zinc-300 dark:hover:border-zinc-600 dark:hover:bg-zinc-900/80 dark:hover:text-zinc-100"
        >
          Why Giftaro?
        </Link>
      </AppHeader>

      <section className="flex flex-col items-center px-6 pt-10 pb-12 text-center sm:pt-16 sm:pb-16">
        <p className="mb-3 max-w-md text-balance text-base font-medium text-zinc-500 dark:text-zinc-400 sm:text-lg">
          Skip the pile of stuff.
        </p>
        <h1 className="max-w-2xl text-balance text-3xl font-bold leading-[1.15] text-zinc-900 dark:text-zinc-50 sm:text-5xl">
          Get one great gift.
        </h1>
        <p className="mt-5 mb-8 max-w-md text-base text-zinc-600 dark:text-zinc-400 sm:text-lg">
          <span className="inline-block whitespace-nowrap">Name your gift.</span>{" "}
          <span className="inline-block whitespace-nowrap">Share the link.</span>{" "}
          <span className="inline-block whitespace-nowrap bg-gradient-to-r from-[#6366F1] via-[#A855F7] via-[#EC4899] to-[#F97316] bg-clip-text text-transparent">
            Everyone chips in.
          </span>
        </p>
        <LandingAuth variant="primary" />
      </section>

      <section className="pb-16">
        <h2 className="mb-6 px-6 text-center text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          The gifts they actually wanted.
        </h2>
        <TestimonialCarousel examples={EXAMPLES} />
      </section>

      <HowItWorksDemo />

      <EmailReminder source="landing" />

      <section className="flex flex-col items-center px-6 pb-20 text-center">
        <p className="text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          Skip the pile of stuff.
        </p>
        <p className="mb-6 text-xl font-semibold text-zinc-800 dark:text-zinc-200">
          Get something awesome.
        </p>
        <LandingAuth variant="secondary" />
      </section>
    </div>
  );
}
