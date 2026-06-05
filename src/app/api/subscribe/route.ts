import { NextResponse } from "next/server";
import { db } from "@/lib/drizzle";
import { emailSubscribers } from "@/lib/drizzle-schema";
import { getClientIp, rateLimit } from "@/lib/rate-limit";
import { getSession } from "@/lib/auth-session";
import { sendSubscribeConfirmationEmail } from "@/lib/email";
import { BASE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SOURCE_RE = /^[a-z0-9:_-]{1,64}$/i;

// The user picks only a month for the event. Resolve it to the next future
// occurrence of that month so we store a concrete year. The reminder job
// subtracts its own lead time at send — this is the event date, not the
// send date.
function resolveEventYear(month: number, now: Date): number {
  const currentMonth = now.getUTCMonth() + 1;
  const currentYear = now.getUTCFullYear();
  return month >= currentMonth ? currentYear : currentYear + 1;
}

export async function POST(request: Request) {
  const ip = getClientIp(request);
  const limited = rateLimit(`subscribe:${ip}`, 10);
  if (limited) return limited;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: true });
  }

  const raw = body as {
    email?: unknown;
    source?: unknown;
    eventMonth?: unknown;
    referrerPath?: unknown;
  };

  const email =
    typeof raw.email === "string" ? raw.email.trim().toLowerCase() : "";
  const source = typeof raw.source === "string" ? raw.source.trim() : "";

  if (!EMAIL_RE.test(email) || email.length > 254) {
    return NextResponse.json({ ok: true });
  }
  if (!SOURCE_RE.test(source)) {
    return NextResponse.json({ ok: true });
  }

  let eventMonth: number | null = null;
  let eventYear: number | null = null;
  if (typeof raw.eventMonth === "number" && Number.isInteger(raw.eventMonth)) {
    if (raw.eventMonth >= 1 && raw.eventMonth <= 12) {
      eventMonth = raw.eventMonth;
      eventYear = resolveEventYear(eventMonth, new Date());
    }
  }

  const referrerPath =
    typeof raw.referrerPath === "string" && raw.referrerPath.startsWith("/")
      ? raw.referrerPath.slice(0, 512)
      : null;

  const session = await getSession();
  const userId = session?.user?.id ?? null;

  try {
    const inserted = await db
      .insert(emailSubscribers)
      .values({ email, source, userId, eventMonth, eventYear, referrerPath })
      .onConflictDoNothing({
        target: [
          emailSubscribers.email,
          emailSubscribers.source,
          emailSubscribers.eventYear,
          emailSubscribers.eventMonth,
        ],
      })
      .returning({ id: emailSubscribers.id });

    if (inserted.length > 0) {
      try {
        await sendSubscribeConfirmationEmail({ email, baseUrl: BASE_URL });
      } catch (err) {
        console.error("Subscribe confirmation email failed:", err);
      }
    }
  } catch (err) {
    console.error("Subscribe insert failed:", err);
  }

  return NextResponse.json({ ok: true });
}
