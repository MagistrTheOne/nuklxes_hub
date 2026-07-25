import type { AnamTalkClient } from '@/features/anam/client/types';
import { streamTalkBrain } from '@/features/talk/api/stream-talk-brain';
import { requestTalkPcm } from '@/features/elevenlabs/api/request-talk-pcm';
import { playTalkVoiceReply } from '@/features/talk/lib/play-talk-voice-reply';
import type { TalkPipelineMessage, TalkVoiceMode } from '@/features/talk/types';

export type TalkPipelineState = 'idle' | 'thinking' | 'speaking';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

type HistoryMessage = {
  role?: string;
  content?: string;
};

const USER_MESSAGE_DEBOUNCE_MS = 100;
const USER_MESSAGE_DEBOUNCE_SHORT_MS = 50;
const SHORT_USER_MESSAGE_MAX_LENGTH = 20;
const MIN_USER_MESSAGE_LENGTH = 2;
/** Matches @anam-ai/js-sdk AnamEvent / MessageRole string values. */
const MESSAGE_HISTORY_UPDATED = 'MESSAGE_HISTORY_UPDATED';
const TALK_STREAM_INTERRUPTED = 'TALK_STREAM_INTERRUPTED';
const USER_ROLE = 'user';

function resolveDebounceMs(content: string): number {
  const trimmed = content.trim();
  if (trimmed.length > 0 && trimmed.length < SHORT_USER_MESSAGE_MAX_LENGTH) {
    return USER_MESSAGE_DEBOUNCE_SHORT_MS;
  }
  return USER_MESSAGE_DEBOUNCE_MS;
}

function isSubstantiveUserMessage(text: string): boolean {
  const trimmed = text.trim();
  if (trimmed.length < MIN_USER_MESSAGE_LENGTH) return false;
  return /[\p{L}\p{N}]/u.test(trimmed);
}

function toPipelineMessages(history: HistoryMessage[]): TalkPipelineMessage[] {
  return history
    .filter((message) => typeof message.content === 'string' && message.content.trim())
    .map((message) => ({
      role: String(message.role).toLowerCase() === USER_ROLE ? 'user' : 'persona',
      content: message.content!.trim(),
    }));
}

/**
 * Anam STT / text → Hub brain-stream → EL PCM (or Anam TTS) → mouth.
 * Web-only; detach on stop.
 */
export function attachTalkVoicePipeline(input: {
  anamClient: AnamTalkClient;
  getToken: GetToken;
  employeeId: string;
  sessionId?: string;
  voiceMode: TalkVoiceMode;
  voiceId?: string | null;
  setPipelineState: (state: TalkPipelineState) => void;
  onError?: (message: string) => void;
}): () => void {
  let processing = false;
  let debounceTimer: ReturnType<typeof setTimeout> | null = null;
  let pendingHistory: HistoryMessage[] | null = null;
  let activeBrainAbort: AbortController | null = null;
  let lastAssistantReply = '';

  const processUserMessage = (history: HistoryMessage[]) => {
    if (processing) return;

    const last = history[history.length - 1];
    const content = last?.content?.trim() ?? '';
    if (!isSubstantiveUserMessage(content)) return;

    if (
      lastAssistantReply &&
      content.localeCompare(lastAssistantReply, undefined, { sensitivity: 'accent' }) === 0
    ) {
      return;
    }

    processing = true;
    input.setPipelineState('thinking');

    const brainAbort = new AbortController();
    activeBrainAbort = brainAbort;
    const turnId = `turn_${Date.now().toString(36)}`;
    const messages = toPipelineMessages(history);

    void (async () => {
      try {
        let replyText: string;

        if (input.voiceMode === 'elevenlabs') {
          replyText = await streamTalkBrain({
            getToken: input.getToken,
            employeeId: input.employeeId,
            sessionId: input.sessionId,
            turnId,
            channel: 'voice',
            messages,
            signal: brainAbort.signal,
          });

          input.setPipelineState('speaking');

          let pcmBase64: string | null = null;
          try {
            const pcm = await requestTalkPcm({
              getToken: input.getToken,
              employeeId: input.employeeId,
              text: replyText,
              voiceId: input.voiceId,
            });
            pcmBase64 = pcm.pcmBase64;
          } catch {
            pcmBase64 = null;
          }

          await playTalkVoiceReply({
            anamClient: input.anamClient,
            replyText,
            voiceMode: 'elevenlabs',
            pcmBase64,
            correlationId: turnId,
          });
        } else {
          const createStream = input.anamClient.createTalkMessageStream;
          if (!createStream) {
            throw new Error('Anam talk stream unavailable');
          }

          const talkStream = createStream(turnId);
          replyText = await streamTalkBrain({
            getToken: input.getToken,
            employeeId: input.employeeId,
            sessionId: input.sessionId,
            turnId,
            channel: 'voice',
            messages,
            signal: brainAbort.signal,
            onChunk: async (chunk) => {
              if (chunk.trim()) input.setPipelineState('speaking');
              if (talkStream.isActive()) {
                await talkStream.streamMessageChunk(chunk, false);
              }
            },
          });

          if (talkStream.isActive()) {
            await talkStream.endMessage();
          }
        }

        lastAssistantReply = replyText.trim();
        input.setPipelineState('idle');
      } catch (error) {
        if (brainAbort.signal.aborted) {
          input.setPipelineState('idle');
          return;
        }

        const message =
          error instanceof Error ? error.message : 'Talk pipeline failed';
        input.onError?.(message);

        const fallback =
          'Something went wrong while generating a response. Please try again.';
        input.setPipelineState('speaking');
        try {
          await playTalkVoiceReply({
            anamClient: input.anamClient,
            replyText: fallback,
            voiceMode: 'anam',
            correlationId: turnId,
          });
        } catch {
          // ignore speak fallback errors
        }
        input.setPipelineState('idle');
      } finally {
        if (activeBrainAbort === brainAbort) activeBrainAbort = null;
        processing = false;
      }
    })();
  };

  const handleMessageHistory = (...args: unknown[]) => {
    const messageHistory = (args[0] as HistoryMessage[] | undefined) ?? [];
    if (processing || messageHistory.length === 0) return;

    const lastMessage = messageHistory[messageHistory.length - 1];
    if (String(lastMessage?.role).toLowerCase() !== USER_ROLE) return;

    pendingHistory = messageHistory;

    if (debounceTimer) clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      debounceTimer = null;
      if (!pendingHistory) return;
      processUserMessage(pendingHistory);
      pendingHistory = null;
    }, resolveDebounceMs(lastMessage?.content ?? ''));
  };

  const onInterrupted = () => {
    activeBrainAbort?.abort();
    activeBrainAbort = null;
    processing = false;
    input.setPipelineState('idle');
  };

  input.anamClient.addListener?.(MESSAGE_HISTORY_UPDATED, handleMessageHistory);
  input.anamClient.addListener?.(TALK_STREAM_INTERRUPTED, onInterrupted);

  return () => {
    if (debounceTimer) clearTimeout(debounceTimer);
    activeBrainAbort?.abort();
    input.anamClient.removeListener?.(MESSAGE_HISTORY_UPDATED, handleMessageHistory);
    input.anamClient.removeListener?.(TALK_STREAM_INTERRUPTED, onInterrupted);
  };
}
