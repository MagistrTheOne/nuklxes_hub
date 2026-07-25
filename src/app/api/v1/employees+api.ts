import { config as loadEnv } from 'dotenv';

import { FALLBACK_EMPLOYEES } from '@/features/workforce/data/employees';
import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { listPlatformEmployees } from '@/server/platform-employees';

loadEnv({ path: '.env', quiet: true });

/**
 * List NULLXES digital employees (platform Neon).
 * Falls back to embedded snapshot if DATABASE_URL is unavailable.
 */
export async function GET(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));

    if (!process.env.DATABASE_URL?.trim()) {
      return Response.json({
        success: true,
        data: FALLBACK_EMPLOYEES,
        meta: { source: 'fallback' },
      });
    }

    try {
      const employees = await listPlatformEmployees();
      return Response.json({
        success: true,
        data: employees,
        meta: { source: 'neon' },
      });
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[api/v1/employees] neon failed, fallback', error);
      }
      return Response.json({
        success: true,
        data: FALLBACK_EMPLOYEES,
        meta: { source: 'fallback' },
      });
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Bearer') || message.includes('token') ? 401 : 500;
    return Response.json({ success: false, error: message }, { status });
  }
}
