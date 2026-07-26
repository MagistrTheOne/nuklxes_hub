import type { ClerkJwtPayload } from '@/server/clerk-jwt';
import { resolveClerkIdentity } from '@/server/users';

export type StreamChatActor = {
  actorUserId: string;
  actorName: string;
  clerkUserId: string;
  platformUserId: string | null;
  linked: boolean;
  /** Ids that may own a Talk channel for this person (legacy Clerk + Neon). */
  ownerIds: string[];
};

/**
 * Same actor resolution for chat session mint + bot inject.
 * Prefer Neon platform user id when email matches, so mobile shares web channels.
 */
export async function resolveStreamChatActor(input: {
  payload: ClerkJwtPayload;
  email?: string | null;
  userName?: string | null;
}): Promise<StreamChatActor> {
  const clerkUserId = input.payload.sub;
  const email =
    (typeof input.email === 'string' && input.email.trim()) ||
    (typeof input.payload.email === 'string' ? input.payload.email.trim() : '');

  let actorUserId = clerkUserId;
  let actorName =
    (typeof input.userName === 'string' && input.userName.trim()) ||
    email ||
    'NULLXES user';
  let platformUserId: string | null = null;
  let linked = false;

  if (email && process.env.DATABASE_URL?.trim()) {
    try {
      const identity = await resolveClerkIdentity({
        clerkUserId,
        email,
        fullName: typeof input.userName === 'string' ? input.userName : null,
      });
      linked = identity.linked;
      platformUserId = identity.platformUserId;
      if (identity.platformUserId) {
        actorUserId = identity.platformUserId;
      }
      if (identity.fullName) {
        actorName = identity.fullName;
      }
    } catch {
      // fall back to Clerk sub
    }
  }

  const ownerIds = [clerkUserId, actorUserId, platformUserId]
    .filter((id): id is string => typeof id === 'string' && id.length > 0)
    .filter((id, index, all) => all.indexOf(id) === index);

  return {
    actorUserId,
    actorName,
    clerkUserId,
    platformUserId,
    linked,
    ownerIds,
  };
}
