import { db } from "./drizzle";
import { users } from "./drizzle-schema";

export async function ensureUser(userId: string, name: string, email: string | null) {
  await db.insert(users).values({ id: userId, name, email }).onConflictDoUpdate({
    target: users.id,
    set: { name, email },
  });
  return userId;
}
