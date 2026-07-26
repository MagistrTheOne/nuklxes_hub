type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function requestChatBotMessage(params: {
  getToken: GetToken;
  employeeId: string;
  channelId: string;
  text: string;
  email?: string | null;
  userName?: string | null;
}): Promise<string> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/chat/bot-message'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeId: params.employeeId,
      channelId: params.channelId,
      text: params.text,
      email: params.email ?? undefined,
      userName: params.userName ?? undefined,
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: { messageId?: string };
  } | null;

  if (!response.ok || !json?.success || !json.data?.messageId) {
    throw new Error(json?.error ?? `Bot message failed (${response.status})`);
  }

  return json.data.messageId;
}
