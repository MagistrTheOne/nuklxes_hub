import type { ElevenLabsVoice } from '@/features/elevenlabs/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function fetchElevenLabsVoices(getToken: GetToken): Promise<ElevenLabsVoice[]> {
  const token = await getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/elevenlabs/voices'), {
    headers: { Authorization: `Bearer ${token}` },
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: { voices?: ElevenLabsVoice[] };
  } | null;

  if (!response.ok || !json?.success || !Array.isArray(json.data?.voices)) {
    throw new Error(json?.error ?? `Voices request failed (${response.status})`);
  }

  return json.data.voices;
}
