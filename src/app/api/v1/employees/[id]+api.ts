import { config as loadEnv } from 'dotenv';

import { getFallbackEmployee } from '@/features/workforce/data/employees';
import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { getPlatformEmployee } from '@/server/platform-employees';

loadEnv({ path: '.env', quiet: true });

type RouteContext = {
  params: Promise<{ id: string }> | { id: string };
};

export async function GET(request: Request, context: RouteContext) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const params = await Promise.resolve(context.params);
    const id = params.id;

    if (!id) {
      return Response.json({ success: false, error: 'id is required' }, { status: 400 });
    }

    if (process.env.PLATFORM_DATABASE_URL?.trim()) {
      try {
        const employee = await getPlatformEmployee(id);
        if (employee) {
          return Response.json({
            success: true,
            data: employee,
            meta: { source: 'platform' },
          });
        }
      } catch (error) {
        if (__DEV__) {
          console.warn('[api/v1/employees/:id] platform failed', error);
        }
      }
    }

    const fallback = getFallbackEmployee(id);
    if (!fallback) {
      return Response.json({ success: false, error: 'Employee not found' }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: fallback,
      meta: { source: 'fallback' },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unauthorized';
    const status = message.includes('Bearer') || message.includes('token') ? 401 : 500;
    return Response.json({ success: false, error: message }, { status });
  }
}
