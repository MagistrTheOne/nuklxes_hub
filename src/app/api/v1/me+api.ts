import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { resolveClerkIdentity } from '@/server/users';

// Expo server bundles may not inherit shell env; load .env for DATABASE_URL / JWKS.
loadEnv({ path: '.env', quiet: true });

type MeBody = {
  email?: string;
  fullName?: string | null;
};

/**
 * Clerk JWT → resolve against shared Neon Better Auth `user` (read-only by email).
 * Does not write a second users table. Full auth bridge TBD.
 */
export async function POST(request: Request) {
  try {
    const payload = await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as MeBody;

    if (!body.email) {
      return Response.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    const identity = await resolveClerkIdentity({
      clerkUserId: payload.sub,
      email: body.email,
      fullName: body.fullName ?? null,
    });

    return Response.json({
      success: true,
      data: identity,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Bearer') || message.includes('token') ? 401 : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/me]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
