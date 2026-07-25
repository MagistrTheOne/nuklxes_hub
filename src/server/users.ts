import { eq } from 'drizzle-orm';

import { createDb } from '../../db';
import { users } from '../../db/schema';

type UpsertUserInput = {
  clerkUserId: string;
  email: string;
  fullName?: string | null;
};

export async function upsertUserFromClerk(input: UpsertUserInput) {
  const db = createDb();
  const now = new Date();

  const [user] = await db
    .insert(users)
    .values({
      clerkUserId: input.clerkUserId,
      email: input.email,
      fullName: input.fullName ?? null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: users.clerkUserId,
      set: {
        email: input.email,
        fullName: input.fullName ?? null,
        updatedAt: now,
      },
    })
    .returning();

  return user;
}

export async function getUserByClerkId(clerkUserId: string) {
  const db = createDb();
  const [user] = await db.select().from(users).where(eq(users.clerkUserId, clerkUserId)).limit(1);
  return user ?? null;
}
