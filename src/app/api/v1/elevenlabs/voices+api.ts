import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { listElevenLabsVoices } from '@/server/elevenlabs';

loadEnv({ path: '.env', quiet: true });

/** List ElevenLabs voices for the signed-in user. API key stays server-side. */
export async function GET(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const voices = await listElevenLabsVoices();

    return Response.json({
      success: true,
      data: { voices },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ElevenLabs voices failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('ELEVENLABS_API_KEY')
          ? 503
          : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/elevenlabs/voices]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
