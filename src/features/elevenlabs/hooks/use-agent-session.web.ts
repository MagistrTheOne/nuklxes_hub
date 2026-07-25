import { useAuth } from '@clerk/expo';
import {
  useConversationControls,
  useConversationMode,
  useConversationStatus,
} from '@elevenlabs/react';
import { useCallback, useState } from 'react';

import { requestElevenLabsConversationToken } from '@/features/elevenlabs/api/request-conversation-token';
import type { AgentSessionStatus } from '@/features/elevenlabs/hooks/use-agent-session';

export function useAgentSession(options?: { voiceId?: string | null }) {
  const { getToken } = useAuth();
  const { startSession, endSession } = useConversationControls();
  const { status: sdkStatus } = useConversationStatus();
  const { mode } = useConversationMode();
  const [phase, setPhase] = useState<'idle' | 'minting' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  const status: AgentSessionStatus =
    phase === 'minting'
      ? 'minting'
      : phase === 'error' || sdkStatus === 'error'
        ? 'error'
        : sdkStatus === 'connecting'
          ? 'connecting'
          : sdkStatus === 'connected'
            ? 'connected'
            : 'idle';

  const stop = useCallback(async () => {
    try {
      endSession();
    } catch {
      // ignore
    } finally {
      setPhase('idle');
    }
  }, [endSession]);

  const start = useCallback(async () => {
    setError(null);
    setPhase('minting');

    try {
      if (typeof navigator !== 'undefined' && navigator.mediaDevices?.getUserMedia) {
        await navigator.mediaDevices.getUserMedia({ audio: true });
      }

      const { conversationToken } = await requestElevenLabsConversationToken({ getToken });

      startSession({
        conversationToken,
        connectionType: 'webrtc',
        overrides: options?.voiceId
          ? {
              tts: { voiceId: options.voiceId },
            }
          : undefined,
        onError: (message) => {
          setError(typeof message === 'string' ? message : 'Agent session error');
          setPhase('error');
        },
        onDisconnect: () => {
          setPhase('idle');
        },
        onConnect: () => {
          setPhase('idle');
        },
      });

      setPhase('idle');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start agent session';
      setError(message);
      setPhase('error');
    }
  }, [getToken, options?.voiceId, startSession]);

  return {
    status,
    error,
    mode: mode === 'speaking' || mode === 'listening' ? mode : null,
    start,
    stop,
    isWeb: true,
  };
}
