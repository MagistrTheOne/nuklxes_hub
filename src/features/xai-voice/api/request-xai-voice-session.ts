import type { XaiVoiceSession } from '@/features/xai-voice/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function requestXaiVoiceSession(params: {
  getToken: GetToken;
  employeeId?: string;
}): Promise<XaiVoiceSession> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/xai-voice/session'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ employeeId: params.employeeId }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: XaiVoiceSession;
  } | null;

  if (!response.ok || !json?.success || !json.data?.clientSecret) {
    throw new Error(json?.error ?? `xAI voice session failed (${response.status})`);
  }

  return json.data;
}
