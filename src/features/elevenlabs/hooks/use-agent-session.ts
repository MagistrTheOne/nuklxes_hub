import { useCallback, useState } from 'react';
import { Platform } from 'react-native';

export type AgentSessionStatus =
  | 'idle'
  | 'minting'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'unsupported';

/**
 * Native stub — ElevenAgents WebRTC needs @elevenlabs/react-native + Dev Client.
 */
export function useAgentSession(_options?: { voiceId?: string | null }) {
  const [status] = useState<AgentSessionStatus>(
    Platform.OS === 'web' ? 'idle' : 'unsupported',
  );

  const start = useCallback(async () => {
    // no-op on native; web implementation is in use-agent-session.web.ts
  }, []);

  const stop = useCallback(async () => {
    // no-op
  }, []);

  return {
    status,
    error: Platform.OS === 'web' ? null : 'Live agent runs on web for now. Native Dev Client next.',
    mode: null as 'speaking' | 'listening' | null,
    start,
    stop,
    isWeb: Platform.OS === 'web',
  };
}
