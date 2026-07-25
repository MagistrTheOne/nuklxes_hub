import { composeTalkSystemPrompt } from '@/server/brain/compose-talk-prompt';
import { loadEmployeeBrain } from '@/server/brain/load-employee-brain';
import {
  formatBrainModelLabel,
  getBrainFailoverProvider,
  isSupportedBrainProvider,
  resolveBrainApiConfig,
} from '@/server/brain/resolve-brain-api';
import {
  openOpenAiCompatibleStream,
  readBrainError,
  readOpenAiSseContent,
} from '@/server/brain/stream-openai-chat';
import type {
  BrainApiConfig,
  TalkBrainChatMessage,
  TalkBrainStreamEvent,
  TalkPipelineMessage,
} from '@/server/brain/types';

const TALK_HISTORY_MAX = 12;

export type BrainStreamRequest = {
  employeeId: string;
  sessionId?: string;
  turnId?: string;
  channel?: 'chat' | 'voice';
  messages: TalkPipelineMessage[];
};

export class BrainStreamHttpError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function trimTalkHistory<T>(messages: T[]): T[] {
  if (messages.length <= TALK_HISTORY_MAX) return messages;
  return messages.slice(-TALK_HISTORY_MAX);
}

function toChatMessages(messages: TalkPipelineMessage[]): TalkBrainChatMessage[] {
  return trimTalkHistory(messages).map((message) => ({
    role: message.role === 'user' ? 'user' : 'assistant',
    content: message.content.trim(),
  }));
}

function encodeNdjson(event: TalkBrainStreamEvent | { error: string; code?: string }) {
  return `${JSON.stringify(event)}\n`;
}

async function openWithFailover(input: {
  provider: string;
  model: string | null;
  systemPrompt: string;
  messages: TalkBrainChatMessage[];
  temperature: number;
  maxTokens: number;
  signal?: AbortSignal;
}): Promise<{ api: BrainApiConfig; response: Response }> {
  if (!isSupportedBrainProvider(input.provider)) {
    throw new BrainStreamHttpError(
      503,
      `Brain provider "${input.provider}" is not supported in Hub yet`,
    );
  }

  let api = resolveBrainApiConfig({
    provider: input.provider,
    model: input.model,
  });

  let response = await openOpenAiCompatibleStream({
    api,
    systemPrompt: input.systemPrompt,
    messages: input.messages,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    signal: input.signal,
  });

  if (response.ok && response.body) {
    return { api, response };
  }

  const detail = await readBrainError(response);
  const failover = getBrainFailoverProvider(api.provider);
  if (!failover) {
    throw new BrainStreamHttpError(
      502,
      `Brain stream failed (${response.status}): ${detail}`,
    );
  }

  api = resolveBrainApiConfig({
    provider: failover,
    model: failover === input.provider ? input.model : null,
  });

  response = await openOpenAiCompatibleStream({
    api,
    systemPrompt: input.systemPrompt,
    messages: input.messages,
    temperature: input.temperature,
    maxTokens: input.maxTokens,
    signal: input.signal,
  });

  if (!response.ok || !response.body) {
    const fallbackDetail = await readBrainError(response);
    throw new BrainStreamHttpError(
      502,
      `Brain stream failed (${response.status}): ${fallbackDetail}`,
    );
  }

  return { api, response };
}

/**
 * NDJSON ReadableStream of TalkBrainStreamEvent lines.
 * Contract matches dplatform brain-stream (content/meta/perf).
 */
export async function createTalkBrainNdjsonStream(
  input: BrainStreamRequest,
  options?: { signal?: AbortSignal },
): Promise<ReadableStream<Uint8Array>> {
  const employeeId = input.employeeId.trim();
  if (!employeeId) {
    throw new BrainStreamHttpError(400, 'employeeId is required');
  }

  if (!Array.isArray(input.messages) || input.messages.length === 0) {
    throw new BrainStreamHttpError(400, 'messages are required');
  }

  const last = input.messages[input.messages.length - 1];
  if (!last || last.role !== 'user' || !last.content?.trim()) {
    throw new BrainStreamHttpError(400, 'Last message must be from the user');
  }

  const buildStarted = performance.now();
  const employee = await loadEmployeeBrain(employeeId);
  if (!employee) {
    throw new BrainStreamHttpError(404, 'Employee not found');
  }

  const systemPrompt = composeTalkSystemPrompt({
    name: employee.name,
    role: employee.role,
    storedPrompt: employee.systemPrompt,
    brainProvider: employee.brainProvider,
  });

  const chatMessages = toChatMessages(input.messages);
  const maxTokens =
    input.channel === 'voice'
      ? Math.min(employee.maxTokens, 1024)
      : employee.maxTokens;

  const buildMs = Math.round(performance.now() - buildStarted);
  const encoder = new TextEncoder();

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const enqueue = (event: TalkBrainStreamEvent | { error: string; code?: string }) => {
        controller.enqueue(encoder.encode(encodeNdjson(event)));
      };

      enqueue({
        type: 'perf',
        turnId: input.turnId,
        spans: { build: buildMs },
        flags: { cacheHit: false, ragUsed: false, slaDegrade: false },
      });

      try {
        const { api, response } = await openWithFailover({
          provider: employee.brainProvider,
          model: employee.model,
          systemPrompt,
          messages: chatMessages,
          temperature: employee.temperature,
          maxTokens,
          signal: options?.signal,
        });

        enqueue({
          type: 'meta',
          brainProvider: api.provider,
          model: api.model,
          modelLabel: formatBrainModelLabel(api),
        });

        const streamStarted = performance.now();
        let firstToken = false;

        for await (const content of readOpenAiSseContent(response)) {
          if (!firstToken) {
            firstToken = true;
            enqueue({
              type: 'perf',
              spans: { ttfb: Math.round(performance.now() - streamStarted) },
            });
          }
          enqueue({ type: 'content', content });
        }

        controller.close();
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Brain stream failed';
        enqueue({
          error: message,
          code: 'PROVIDER_UNAVAILABLE',
        });
        controller.close();
      }
    },
  });
}
