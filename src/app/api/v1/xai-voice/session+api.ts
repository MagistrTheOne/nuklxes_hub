import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import {
  ADELINE_KALEN_EMPLOYEE_ID,
  createAdelineVoiceSession,
} from '@/server/xai-voice';

loadEnv({ path: '.env', quiet: true });

type Body = {
  employeeId?: string;
};

/**
 * Mint short-lived xAI Realtime client secret for Adeline Grok Voice.
 * Separate from Anam Talk. Auth: Clerk.
 */
export async function POST(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as Body;
    const employeeId =
      typeof body.employeeId === 'string' && body.employeeId.trim()
        ? body.employeeId.trim()
        : ADELINE_KALEN_EMPLOYEE_ID;

    const data = await createAdelineVoiceSession(employeeId);
    return Response.json({ success: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'xAI voice session failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('XAI_API_KEY')
          ? 503
          : message.includes('Adeline')
            ? 400
            : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/xai-voice/session]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
