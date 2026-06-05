import { auth } from "./auth";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

export async function getSession() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return session;
}

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireAuth(): Promise<{ userId: string } | NextResponse> {
  const session = await getSession();
  const userId = session?.user?.id;
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return { userId };
}
