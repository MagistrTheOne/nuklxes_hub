import { config as loadEnv } from 'dotenv';

import { getReadyFallbackEmployee } from '@/features/workforce/data/employees';
import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import {
  ELEVENLABS_VOICE_MODEL_ID,
  synthesizeElevenLabsPcm,
} from '@/server/elevenlabs';
import { getPlatformEmployee } from '@/server/platform-employees';

loadEnv({ path: '.env', quiet: true });

type Body = {
  employeeId?: string;
  voiceId?: string;
  text?: string;
};

const MAX_TEXT_LENGTH = 2000;

async function resolveVoiceId(employeeId: string): Promise<string | null> {
  if (process.env.DATABASE_URL?.trim()) {
    try {
      const employee = await getPlatformEmployee(employeeId);
      if (employee?.voiceId) return employee.voiceId;
    } catch {
      // fallback below
    }
  }

  return getReadyFallbackEmployee(employeeId)?.voiceId ?? null;
}

/**
 * ElevenLabs PCM (16 kHz s16le) for Anam mouth — key stays server-side.
 */
export async function POST(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as Body;

    const text = typeof body.text === 'string' ? body.text.trim() : '';
    const employeeId =
      typeof body.employeeId === 'string' ? body.employeeId.trim() : '';
    let voiceId = typeof body.voiceId === 'string' ? body.voiceId.trim() : '';

    if (!text) {
      return Response.json({ success: false, error: 'text is required' }, { status: 400 });
    }

    if (text.length > MAX_TEXT_LENGTH) {
      return Response.json(
        { success: false, error: `text must be ≤ ${MAX_TEXT_LENGTH} characters` },
        { status: 400 },
      );
    }

    if (!voiceId) {
      if (!employeeId) {
        return Response.json(
          { success: false, error: 'voiceId or employeeId is required' },
          { status: 400 },
        );
      }
      voiceId = (await resolveVoiceId(employeeId)) ?? '';
    }

    if (!voiceId) {
      return Response.json(
        { success: false, error: 'No ElevenLabs voiceId for employee' },
        { status: 404 },
      );
    }

    const result = await synthesizeElevenLabsPcm({
      voiceId,
      text,
      modelId: ELEVENLABS_VOICE_MODEL_ID,
    });

    return Response.json({
      success: true,
      data: {
        pcmBase64: result.audioBase64,
        sampleRate: result.sampleRate,
        contentType: result.contentType,
        voiceId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ElevenLabs PCM failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('ELEVENLABS_API_KEY')
          ? 503
          : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/elevenlabs/pcm]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
