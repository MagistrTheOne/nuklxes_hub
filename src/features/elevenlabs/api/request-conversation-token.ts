type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export type ConversationTokenResponse = {
  conversationToken: string;
  agentId: string;
};

export async function requestElevenLabsConversationToken(params: {
  getToken: GetToken;
  agentId?: string;
}): Promise<ConversationTokenResponse> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/elevenlabs/conversation'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      agentId: params.agentId,
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: ConversationTokenResponse;
  } | null;

  if (!response.ok || !json?.success || !json.data?.conversationToken) {
    throw new Error(json?.error ?? `Conversation token failed (${response.status})`);
  }

  return json.data;
}
