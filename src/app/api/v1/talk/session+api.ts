import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { bootstrapTalkSession } from '@/server/talk-session';

loadEnv({ path: '.env', quiet: true });

type Body = {
  employeeId?: string;
};

/**
 * Start Talk: Anam sessionToken + voiceMode from platform DB.
 * Does NOT mint ElevenLabs Conversational Agent tokens.
 */
export async function POST(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as Body;
    const employeeId = typeof body.employeeId === 'string' ? body.employeeId.trim() : '';

    if (!employeeId) {
      return Response.json({ success: false, error: 'employeeId is required' }, { status: 400 });
    }

    const data = await bootstrapTalkSession(employeeId);

    return Response.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Talk session failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('not ready') || message.includes('ANAM_API_KEY')
          ? 503
          : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/talk/session]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
