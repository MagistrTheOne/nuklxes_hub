import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { upsertUserFromClerk } from '@/server/users';

// Expo server bundles may not inherit shell env; load .env for DATABASE_URL / JWKS.
loadEnv({ path: '.env', quiet: true });

type MeBody = {
  email?: string;
  fullName?: string | null;
};

export async function POST(request: Request) {
  try {
    const payload = await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as MeBody;

    if (!body.email) {
      return Response.json({ success: false, error: 'email is required' }, { status: 400 });
    }

    const user = await upsertUserFromClerk({
      clerkUserId: payload.sub,
      email: body.email,
      fullName: body.fullName ?? null,
    });

    return Response.json({
      success: true,
      data: user,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Bearer') || message.includes('token') ? 401 : 500;

    if (__DEV__) {
      console.warn('[api/v1/me]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
