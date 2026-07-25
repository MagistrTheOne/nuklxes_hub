import { requestTalkPcm } from '@/features/elevenlabs/api/request-talk-pcm';
import type { AnamBridgeHandle } from '@/features/anam/bridge/protocol';
import { streamTalkBrain } from '@/features/talk/api/stream-talk-brain';
import type { TalkPipelineState, TalkVoiceMode } from '@/features/talk';
import type { TalkPipelineMessage } from '@/features/talk/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

/**
 * Native Talk path: WebView STT/text → Hub brain → EL PCM / Anam speak via bridge.
 */
export function attachNativeTalkPipeline(input: {
  bridge: AnamBridgeHandle;
  getToken: GetToken;
  employeeId: string;
  sessionId?: string;
  voiceMode: TalkVoiceMode;
  voiceId?: string | null;
  setPipelineState: (state: TalkPipelineState) => void;
  onError?: (message: string) => void;
}): {
  handleUserMessage: (content: string, history?: TalkPipelineMessage[]) => void;
  dispose: () => void;
} {
  let processing = false;
  let activeAbort: AbortController | null = null;

  const handleUserMessage = (content: string, history?: TalkPipelineMessage[]) => {
    const text = content.trim();
    if (!text || processing) return;

    processing = true;
    input.setPipelineState('thinking');
    const brainAbort = new AbortController();
    activeAbort = brainAbort;
    const turnId = `native_${Date.now().toString(36)}`;

    const messages: TalkPipelineMessage[] =
      history && history.length > 0
        ? history
        : [{ role: 'user', content: text }];

    void (async () => {
      try {
        const reply = await streamTalkBrain({
          getToken: input.getToken,
          employeeId: input.employeeId,
          sessionId: input.sessionId,
          turnId,
          channel: 'voice',
          messages,
          signal: brainAbort.signal,
        });

        input.setPipelineState('speaking');

        if (input.voiceMode === 'elevenlabs') {
          try {
            const pcm = await requestTalkPcm({
              getToken: input.getToken,
              employeeId: input.employeeId,
              text: reply,
              voiceId: input.voiceId,
            });
            input.bridge.playPcm(pcm.pcmBase64);
          } catch {
            input.bridge.speak(reply, turnId);
          }
        } else {
          input.bridge.speak(reply, turnId);
        }

        input.setPipelineState('idle');
      } catch (error) {
        if (brainAbort.signal.aborted) {
          input.setPipelineState('idle');
          return;
        }
        const message =
          error instanceof Error ? error.message : 'Native talk pipeline failed';
        input.onError?.(message);
        input.setPipelineState('idle');
      } finally {
        if (activeAbort === brainAbort) activeAbort = null;
        processing = false;
      }
    })();
  };

  return {
    handleUserMessage,
    dispose: () => {
      activeAbort?.abort();
      activeAbort = null;
      processing = false;
    },
  };
}
