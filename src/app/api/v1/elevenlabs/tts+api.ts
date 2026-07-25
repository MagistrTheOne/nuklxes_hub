import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import {
  ELEVENLABS_VOICE_MODEL_ID,
  synthesizeElevenLabsSpeech,
} from '@/server/elevenlabs';

loadEnv({ path: '.env', quiet: true });

type TtsBody = {
  voiceId?: string;
  text?: string;
};

const MAX_TEXT_LENGTH = 500;

/**
 * Synthesize speech with ElevenLabs eleven_v3.
 * Returns base64 audio — key never leaves the server.
 */
export async function POST(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as TtsBody;

    const voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : '';
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!voiceId || !text) {
      return Response.json(
        { success: false, error: 'voiceId and text are required' },
        { status: 400 },
      );
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return Response.json(
        { success: false, error: `text must be ≤ ${MAX_TEXT_LENGTH} characters` },
        { status: 400 },
      );
    }

    const result = await synthesizeElevenLabsSpeech({
      voiceId,
      text,
      modelId: ELEVENLABS_VOICE_MODEL_ID,
    });

    return Response.json({
      success: true,
      data: result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ElevenLabs TTS failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('ELEVENLABS_API_KEY')
          ? 503
          : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/elevenlabs/tts]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
