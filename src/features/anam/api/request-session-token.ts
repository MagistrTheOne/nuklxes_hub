import type { AnamPersonaConfig, AnamSessionTokenResponse } from '@/features/anam/types';
import type { AnamSlot } from '@/features/workforce/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function requestAnamSessionToken(params: {
  getToken: GetToken;
  employeeId?: string;
  personaConfig?: AnamPersonaConfig;
  anamSlot?: AnamSlot;
  clientLabel?: string;
}): Promise<AnamSessionTokenResponse> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  if (!params.employeeId && !params.personaConfig) {
    throw new Error('employeeId or personaConfig is required');
  }

  const response = await fetch(resolveApiUrl('/api/v1/anam/session'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeId: params.employeeId,
      personaConfig: params.personaConfig,
      anamSlot: params.anamSlot,
      clientLabel: params.clientLabel ?? 'nullxes-hub',
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: { sessionToken?: string; anamSlot?: string };
  } | null;

  if (!response.ok || !json?.success || !json.data?.sessionToken) {
    throw new Error(json?.error ?? `Anam session request failed (${response.status})`);
  }

  return {
    sessionToken: json.data.sessionToken,
    anamSlot: json.data.anamSlot,
  };
}
