import type { BrainApiConfig, TalkBrainChatMessage } from '@/server/brain/types';

type OpenAiStreamChunk = {
  choices?: Array<{
    delta?: { content?: string | null };
  }>;
};

export async function openOpenAiCompatibleStream(input: {
  api: BrainApiConfig;
  systemPrompt: string;
  messages: TalkBrainChatMessage[];
  temperature: number;
  maxTokens: number;
  signal?: AbortSignal;
}): Promise<Response> {
  const response = await fetch(`${input.api.baseUrl}/chat/completions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${input.api.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: input.api.model,
      temperature: input.temperature,
      max_tokens: input.maxTokens,
      stream: true,
      messages: [
        { role: 'system', content: input.systemPrompt },
        ...input.messages,
      ],
    }),
    signal: input.signal,
  });

  return response;
}

/** Yield content deltas from an OpenAI-compatible SSE body. */
export async function* readOpenAiSseContent(
  response: Response,
): AsyncGenerator<string> {
  if (!response.body) {
    throw new Error('Brain stream returned empty body');
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith('data:')) continue;

      const payload = trimmed.slice(5).trim();
      if (!payload || payload === '[DONE]') continue;

      try {
        const chunk = JSON.parse(payload) as OpenAiStreamChunk;
        const content = chunk.choices?.[0]?.delta?.content;
        if (content) yield content;
      } catch {
        // skip malformed SSE lines
      }
    }
  }
}

export async function readBrainError(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 500);
  } catch {
    return response.statusText;
  }
}
