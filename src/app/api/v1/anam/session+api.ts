import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import {
  isAnamSlot,
  mintAnamSession,
  type AnamPersonaConfig,
} from '@/server/anam';

loadEnv({ path: '.env', quiet: true });

type SessionBody = {
  employeeId?: string;
  personaConfig?: AnamPersonaConfig;
  anamSlot?: string;
  clientLabel?: string;
};

function isPersonaConfig(value: unknown): value is AnamPersonaConfig {
  if (!value || typeof value !== 'object') {
    return false;
  }
  const config = value as Record<string, unknown>;
  if (typeof config.personaId === 'string' && config.personaId.length > 0) {
    return true;
  }
  return (
    typeof config.name === 'string' &&
    typeof config.avatarId === 'string' &&
    typeof config.voiceId === 'string' &&
    typeof config.llmId === 'string' &&
    typeof config.systemPrompt === 'string'
  );
}

/**
 * Mint an Anam session token for the signed-in Clerk user.
 * Prefer `{ employeeId }` — server picks personaId + lab slot key.
 * API keys never leave the server.
 */
export async function POST(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as SessionBody;

    const employeeId =
      typeof body.employeeId === 'string' && body.employeeId.length > 0
        ? body.employeeId
        : undefined;

    if (!employeeId && !isPersonaConfig(body.personaConfig)) {
      return Response.json(
        {
          success: false,
          error: 'employeeId or personaConfig is required',
        },
        { status: 400 },
      );
    }

    const anamSlot =
      body.anamSlot && isAnamSlot(body.anamSlot) ? body.anamSlot : undefined;

    const { sessionToken, anamSlot: usedSlot } = await mintAnamSession({
      employeeId,
      personaConfig: body.personaConfig,
      anamSlot,
      clientLabel: body.clientLabel ?? 'nullxes-hub',
    });

    return Response.json({
      success: true,
      data: { sessionToken, anamSlot: usedSlot },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Anam session failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('ANAM_API_KEY') || message.includes('not ready')
          ? 503
          : 500;

    if (__DEV__) {
      console.warn('[api/v1/anam/session]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
