import { eq, sql } from 'drizzle-orm';

import { createDb } from '../../db';
import { membership, user } from '../../db/schema';

type ClerkIdentityInput = {
  clerkUserId: string;
  email: string;
  fullName?: string | null;
};

/**
 * Resolve Clerk caller against the shared Neon Better Auth `user` row (by email).
 * No writes — does not invent a second users table or duplicate membership.
 * Full Clerk↔Better Auth bridge comes next.
 */
export async function resolveClerkIdentity(input: ClerkIdentityInput) {
  const db = createDb();
  const email = input.email.trim().toLowerCase();

  const [platformUser] = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
    })
    .from(user)
    .where(sql`lower(${user.email}) = ${email}`)
    .limit(1);

  const memberships = platformUser
    ? await db
        .select({
          organizationId: membership.organizationId,
        })
        .from(membership)
        .where(eq(membership.userId, platformUser.id))
    : [];

  return {
    clerkUserId: input.clerkUserId,
    email: input.email,
    fullName: input.fullName ?? platformUser?.name ?? null,
    platformUserId: platformUser?.id ?? null,
    linked: Boolean(platformUser),
    organizationIds: memberships.map((m) => m.organizationId),
  };
}

/** @deprecated use resolveClerkIdentity — no Clerk row writes on shared Neon */
export async function upsertUserFromClerk(input: ClerkIdentityInput) {
  return resolveClerkIdentity(input);
}

export async function getUserByClerkId(_clerkUserId: string) {
  return null;
}
