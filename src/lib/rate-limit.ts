import { NextResponse } from "next/server";

const windowMs = 60_000;

// Best-effort: in-memory state resets on serverless cold starts and isn't
// shared across instances. Pair with durable guards (e.g. per-gift upload
// caps) for limits that must survive cold starts. Move to Upstash Redis
// (@upstash/ratelimit) if abuse is observed at scale.
const buckets = new Map<string, { count: number; resetAt: number }>();

const cleanup = setInterval(() => {
  const now = Date.now();
  for (const key of [...buckets.keys()]) {
    const bucket = buckets.get(key);
    if (bucket && bucket.resetAt <= now) buckets.delete(key);
  }
}, 60_000);
if (typeof cleanup.unref === "function") cleanup.unref();

export function rateLimit(key: string, max: number): NextResponse | null {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return null;
  }

  bucket.count++;
  if (bucket.count > max) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(Math.ceil((bucket.resetAt - now) / 1000)) } }
    );
  }

  return null;
}

export function getClientIp(request: Request): string {
  // On Vercel, x-vercel-forwarded-for / x-real-ip are set by the edge and
  // cannot be spoofed by the client. x-forwarded-for is client-appendable,
  // but Vercel appends the real client IP at the *end* — so take the last
  // entry, not the first.
  const vercel = request.headers.get("x-vercel-forwarded-for");
  if (vercel) return vercel.split(",")[0].trim();
  const real = request.headers.get("x-real-ip");
  if (real) return real.trim();
  const xff = request.headers.get("x-forwarded-for");
  if (xff) {
    const parts = xff.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) return parts[parts.length - 1];
  }
  return "unknown";
}
