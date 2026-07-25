import type { ChatSessionCredentials } from '@/features/chat/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function requestChatSession(params: {
  getToken: GetToken;
  employeeId: string;
  userName?: string | null;
}): Promise<ChatSessionCredentials> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/chat/session'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeId: params.employeeId,
      userName: params.userName ?? undefined,
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: ChatSessionCredentials;
  } | null;

  if (!response.ok || !json?.success || !json.data?.token) {
    throw new Error(json?.error ?? `Chat session failed (${response.status})`);
  }

  return json.data;
}
