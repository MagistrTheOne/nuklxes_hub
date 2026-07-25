import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { createElevenLabsConversationToken } from '@/server/elevenlabs';

loadEnv({ path: '.env', quiet: true });

type ConversationBody = {
  agentId?: string;
};

/**
 * Mint ElevenAgents WebRTC conversation token.
 * API key never leaves the server.
 */
export async function POST(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as ConversationBody;
    const agentId = typeof body.agentId === 'string' ? body.agentId.trim() : undefined;

    const result = await createElevenLabsConversationToken(agentId);

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ElevenLabs conversation failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('ELEVENLABS_')
          ? 503
          : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/elevenlabs/conversation]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
