import type {
  TalkBrainStreamEvent,
  TalkPipelineMessage,
} from '@/features/talk/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export type StreamTalkBrainParams = {
  getToken: GetToken;
  employeeId: string;
  sessionId?: string;
  turnId?: string;
  channel?: 'chat' | 'voice';
  messages: TalkPipelineMessage[];
  signal?: AbortSignal;
  onEvent?: (event: TalkBrainStreamEvent) => void;
  /** Fired for each content delta (Anam TTS streaming path). */
  onChunk?: (chunk: string) => void | Promise<void>;
};

/**
 * POST Hub /api/v1/talk/brain-stream and consume NDJSON events.
 * Returns the full assistant text.
 */
export async function streamTalkBrain(params: StreamTalkBrainParams): Promise<string> {
  const token = await params.getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/talk/brain-stream'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      Accept: 'application/x-ndjson',
    },
    body: JSON.stringify({
      employeeId: params.employeeId,
      sessionId: params.sessionId,
      turnId: params.turnId,
      channel: params.channel ?? 'voice',
      messages: params.messages,
    }),
    signal: params.signal,
  });

  if (!response.ok) {
    const json = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(json?.error ?? `Brain stream failed (${response.status})`);
  }

  if (!response.body) {
    throw new Error('Brain stream returned empty body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';
  let fullText = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      let event: TalkBrainStreamEvent & { error?: string };
      try {
        event = JSON.parse(trimmed) as TalkBrainStreamEvent & { error?: string };
      } catch {
        continue;
      }

      if (event.error) {
        throw new Error(event.error);
      }

      if (event.type === 'content' && event.content) {
        fullText += event.content;
        await params.onChunk?.(event.content);
      }

      if (event.type) {
        params.onEvent?.(event as TalkBrainStreamEvent);
      }
    }
  }

  if (buffer.trim()) {
    try {
      const event = JSON.parse(buffer.trim()) as TalkBrainStreamEvent & { error?: string };
      if (event.error) throw new Error(event.error);
      if (event.type === 'content' && event.content) {
        fullText += event.content;
        await params.onChunk?.(event.content);
      }
      if (event.type) params.onEvent?.(event as TalkBrainStreamEvent);
    } catch (error) {
      if (error instanceof Error && error.message !== buffer.trim()) throw error;
    }
  }

  if (!fullText.trim()) {
    throw new Error('Brain returned an empty reply');
  }

  return fullText;
}
