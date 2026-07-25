type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export type TalkPcmResult = {
  pcmBase64: string;
  sampleRate: number;
  voiceId: string;
};

export async function requestTalkPcm(params: {
  getToken: GetToken;
  employeeId: string;
  text: string;
  voiceId?: string | null;
}): Promise<TalkPcmResult> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/elevenlabs/pcm'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      employeeId: params.employeeId,
      voiceId: params.voiceId ?? undefined,
      text: params.text,
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: TalkPcmResult;
  } | null;

  if (!response.ok || !json?.success || !json.data?.pcmBase64) {
    throw new Error(json?.error ?? `PCM synthesis failed (${response.status})`);
  }

  return json.data;
}
