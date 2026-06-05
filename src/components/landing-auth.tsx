"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui";
import { signIn, signUp } from "@/lib/auth-client";

const APPLE_ENABLED = process.env.NEXT_PUBLIC_APPLE_ENABLED === "true";

function safeReturn(v: string | null): string | null {
  if (!v) return null;
  if (!v.startsWith("/")) return null;
  if (v.startsWith("//") || v.startsWith("/\\")) return null;
  return v;
}

export function LandingAuth({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  return (
    <Suspense fallback={<LandingAuthInner variant={variant} />}>
      <LandingAuthInner variant={variant} />
    </Suspense>
  );
}

function LandingAuthInner({ variant = "primary" }: { variant?: "primary" | "secondary" }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const oauthError = searchParams.get("error");
  const initialModeParam = searchParams.get("mode");
  const returnTo = safeReturn(searchParams.get("returnTo"));
  const callbackURL = returnTo ?? "/dashboard";
  const errorCallbackURL = returnTo
    ? `/?returnTo=${encodeURIComponent(returnTo)}`
    : "/";

  const primary = variant === "primary";
  const hasIntent = Boolean(oauthError || initialModeParam === "signup" || returnTo);

  const [googleLoading, setGoogleLoading] = useState(false);
  const [appleLoading, setAppleLoading] = useState(false);
  const [emailOpen, setEmailOpen] = useState(variant === "secondary");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(oauthError ? "Sign-in failed. Please try again." : "");
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(!primary || hasIntent);

  async function handleGoogle() {
    setGoogleLoading(true);
    try {
      await signIn.social({ provider: "google", callbackURL, errorCallbackURL });
    } catch {
      setGoogleLoading(false);
    }
  }

  async function handleApple() {
    setAppleLoading(true);
    try {
      await signIn.social({ provider: "apple", callbackURL, errorCallbackURL });
    } catch {
      setAppleLoading(false);
    }
  }

  async function handleEmailSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const signInResult = await signIn.email({ email, password });
      if (!signInResult.error) {
        router.push(callbackURL);
        return;
      }

      const signUpResult = await signUp.email({
        email,
        password,
        name: email.split("@")[0],
      });
      if (!signUpResult.error) {
        router.push(callbackURL);
        return;
      }

      const msg = signUpResult.error.message ?? "";
      if (/exist|already|registered/i.test(msg)) {
        setError("Wrong password. Try again.");
      } else {
        setError(msg || signInResult.error.message || "Something went wrong");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  if (!expanded) {
    return (
      <div className="w-full max-w-sm">
        <Button
          onClick={() => setExpanded(true)}
          shape="block"
          size="lg"
          style={{ animation: "cta-float 4s ease-in-out infinite" }}
        >
          Get something awesome
        </Button>
      </div>
    );
  }

  const banner =
    oauthError
      ? { text: "Sign-in failed. Please try again.", tone: "error" as const }
      : returnTo
      ? { text: "Sign in to continue.", tone: "info" as const }
      : null;

  return (
    <div
      className="w-full max-w-sm"
      style={primary ? { animation: "fade-in-up 220ms ease-out" } : undefined}
    >
      {primary && (
        <div className="mb-5 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/gift_blue_smile_v4.png"
            alt=""
            className="h-14 w-14"
            style={{
              animation: "gift-rise-and-roll 700ms cubic-bezier(0.22, 1, 0.36, 1) both",
            }}
          />
        </div>
      )}

      {primary && banner && (
        <p
          className={`mb-3 text-center text-sm ${
            banner.tone === "error"
              ? "text-red-500"
              : "text-zinc-500 dark:text-zinc-400"
          }`}
        >
          {banner.text}
        </p>
      )}

      {APPLE_ENABLED && (
        <button
          onClick={handleApple}
          disabled={appleLoading}
          className="mb-3 flex w-full items-center justify-center gap-3 rounded-xl bg-black px-4 py-3.5 text-sm font-medium text-white shadow-sm transition-all duration-150 hover:bg-zinc-800 active:scale-[0.97] active:bg-zinc-700 disabled:pointer-events-none dark:bg-white dark:text-black dark:hover:bg-zinc-100 dark:active:bg-zinc-200"
        >
          {appleLoading ? (
            <svg className="h-5 w-5 animate-spin text-zinc-300" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
              <path d="M16.365 1.43c0 1.14-.42 2.22-1.18 3.02-.82.87-2.1 1.55-3.34 1.45-.15-1.12.4-2.27 1.14-3.03.83-.84 2.22-1.47 3.38-1.44zM20.64 17.42c-.58 1.29-.86 1.87-1.6 3.01-1.03 1.6-2.49 3.58-4.3 3.6-1.6.01-2.02-1.04-4.2-1.03-2.19.01-2.65 1.05-4.25 1.04-1.81-.02-3.18-1.82-4.22-3.42C-.5 16.22-.8 10.9 1.32 8.05c1.5-2.02 3.87-3.21 6.1-3.21 2.27 0 3.7 1.25 5.58 1.25 1.82 0 2.93-1.25 5.56-1.25 1.99 0 4.1 1.08 5.61 2.95-4.93 2.7-4.13 9.77-3.53 9.63z" />
            </svg>
          )}
          {appleLoading ? "Connecting…" : "Continue with Apple"}
        </button>
      )}

      <button
        onClick={handleGoogle}
        disabled={googleLoading}
        className={`flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3.5 text-sm font-medium text-zinc-900 shadow-sm transition-all duration-150 hover:bg-zinc-50 active:scale-[0.97] active:bg-zinc-100 disabled:pointer-events-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800 dark:active:bg-zinc-700 ${
          primary ? "shadow-[0_0_20px_rgba(15,157,88,0.12)]" : ""
        }`}
      >
        {googleLoading ? (
          <svg className="h-5 w-5 animate-spin text-zinc-400" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-5 w-5">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
        )}
        {googleLoading ? "Connecting…" : "Continue with Google"}
      </button>

      <div className="mt-4 text-center">
        {!emailOpen ? (
          <button
            onClick={() => setEmailOpen(true)}
            className="rounded-md px-2 py-1 text-xs font-medium text-zinc-500 underline-offset-4 transition-colors hover:text-zinc-800 hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/30 dark:text-zinc-400 dark:hover:text-zinc-100"
          >
            Continue with email
          </button>
        ) : (
          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-3 text-left">
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoFocus={variant === "primary"}
              autoComplete="email"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition-all duration-150 focus:border-brand focus:shadow-sm focus:shadow-brand/10 focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <input
              type="password"
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="current-password"
              className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-base text-zinc-900 outline-none transition-all duration-150 focus:border-brand focus:shadow-sm focus:shadow-brand/10 focus:ring-2 focus:ring-brand/20 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />

            {error && <p className="text-center text-sm text-red-500">{error}</p>}

            <Button type="submit" shape="block" disabled={loading}>
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Continuing…
                </span>
              ) : (
                "Continue"
              )}
            </Button>

          </form>
        )}
      </div>

      <p className="mt-4 text-center text-xs leading-relaxed text-zinc-500 dark:text-zinc-400">
        By continuing, you agree to our{" "}
        <Link href="/terms" className="underline hover:text-zinc-700 dark:hover:text-zinc-200">
          Terms
        </Link>{" "}
        and{" "}
        <Link href="/privacy" className="underline hover:text-zinc-700 dark:hover:text-zinc-200">
          Privacy Policy
        </Link>
        .
      </p>
    </div>
  );
}
