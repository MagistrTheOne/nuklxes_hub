import type { ElevenLabsTtsResponse } from '@/features/elevenlabs/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function requestElevenLabsTts(params: {
  getToken: GetToken;
  voiceId: string;
  text: string;
}): Promise<ElevenLabsTtsResponse> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/elevenlabs/tts'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      voiceId: params.voiceId,
      text: params.text,
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: ElevenLabsTtsResponse;
  } | null;

  if (!response.ok || !json?.success || !json.data?.audioBase64) {
    throw new Error(json?.error ?? `TTS request failed (${response.status})`);
  }

  return json.data;
}
