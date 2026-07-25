import type { TalkBootstrap } from '@/features/talk/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function requestTalkSession(params: {
  getToken: GetToken;
  employeeId: string;
}): Promise<TalkBootstrap> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/talk/session'), {
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
    data?: TalkBootstrap;
  } | null;

  if (!response.ok || !json?.success || !json.data?.sessionToken) {
    throw new Error(json?.error ?? `Talk session failed (${response.status})`);
  }

  return json.data;
}
