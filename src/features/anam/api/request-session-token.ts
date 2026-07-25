import type { AnamPersonaConfig, AnamSessionTokenResponse } from '@/features/anam/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function requestAnamSessionToken(params: {
  getToken: GetToken;
  personaConfig: AnamPersonaConfig;
  clientLabel?: string;
}): Promise<AnamSessionTokenResponse> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/anam/session'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      personaConfig: params.personaConfig,
      clientLabel: params.clientLabel ?? 'nullxes-hub',
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: { sessionToken?: string };
  } | null;

  if (!response.ok || !json?.success || !json.data?.sessionToken) {
    throw new Error(json?.error ?? `Anam session request failed (${response.status})`);
  }

  return { sessionToken: json.data.sessionToken };
}
