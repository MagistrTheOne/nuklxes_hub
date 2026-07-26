import { useAuth } from '@clerk/expo';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { requestAnamSessionToken } from '@/features/anam/api/request-session-token';
import type { AnamBridgeHandle, BridgeToRnMessage } from '@/features/anam/bridge/protocol';
import type { AnamStreamClient } from '@/features/anam/client/types';
import { ANAM_VIDEO_ELEMENT_ID } from '@/features/anam/constants';
import type { AnamPersonaConfig, PersonaSessionStatus } from '@/features/anam/types';
import {
  attachTalkVoicePipeline,
  type TalkPipelineState,
  type TalkVoiceMode,
} from '@/features/talk';
import { attachNativeTalkPipeline } from '@/features/talk/lib/attach-native-talk-pipeline';
import { DEFAULT_EMPLOYEE_ID } from '@/features/workforce/data/employees';
import type { AnamSlot } from '@/features/workforce/types';

export type UsePersonaSessionOptions = {
  employeeId?: string;
  personaConfig?: AnamPersonaConfig;
  anamSlot?: AnamSlot;
  sessionToken?: string;
  talkSessionId?: string;
  voiceMode?: TalkVoiceMode;
  voiceId?: string | null;
  enableTalkPipeline?: boolean;
  /** Start with mic muted (web). User unmutes via setMicEnabled. Default true. */
  startMicMuted?: boolean;
};

function friendlyAnamError(raw: string) {
  const lower = raw.toLowerCase();
  if (lower.includes('concurrency')) {
    return 'Avatar slot busy (plan limit). Stop other sessions and try again.';
  }
  return raw;
}

export function usePersonaSession(options: UsePersonaSessionOptions = {}) {
  const employeeId = options.employeeId ?? DEFAULT_EMPLOYEE_ID;
  const { getToken } = useAuth();
  const clientRef = useRef<AnamStreamClient | null>(null);
  const bridgeRef = useRef<AnamBridgeHandle | null>(null);
  const detachPipelineRef = useRef<(() => void) | null>(null);
  const nativePipelineRef = useRef<ReturnType<typeof attachNativeTalkPipeline> | null>(null);
  const [status, setStatus] = useState<PersonaSessionStatus>('idle');
  const [pipelineState, setPipelineState] = useState<TalkPipelineState>('idle');
  const [error, setError] = useState<string | null>(null);
  const [micEnabled, setMicEnabledState] = useState(false);
  const isWeb = Platform.OS === 'web';

  const stop = useCallback(async () => {
    detachPipelineRef.current?.();
    detachPipelineRef.current = null;
    nativePipelineRef.current?.dispose();
    nativePipelineRef.current = null;

    try {
      if (isWeb) {
        await clientRef.current?.stopStreaming?.();
      } else {
        bridgeRef.current?.stop();
      }
    } catch {
      // ignore teardown errors
    } finally {
      clientRef.current = null;
      setPipelineState('idle');
      setMicEnabledState(false);
      setError(null);
      setStatus('idle');
    }
  }, [isWeb]);

  const mintToken = useCallback(async () => {
    let sessionToken = options.sessionToken?.trim() || '';
    if (!sessionToken) {
      const minted = await requestAnamSessionToken({
        getToken,
        employeeId: options.personaConfig ? undefined : employeeId,
        personaConfig: options.personaConfig,
        anamSlot: options.anamSlot,
      });
      sessionToken = minted.sessionToken;
    }
    return sessionToken;
  }, [
    employeeId,
    getToken,
    options.anamSlot,
    options.personaConfig,
    options.sessionToken,
  ]);

  const setMicEnabled = useCallback(
    (enabled: boolean) => {
      const client = clientRef.current;
      if (!client || status !== 'connected') {
        setMicEnabledState(enabled);
        return;
      }

      try {
        if (enabled) {
          client.unmuteInputAudio?.();
        } else {
          client.muteInputAudio?.();
        }
        setMicEnabledState(enabled);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Could not toggle microphone';
        setError(message);
      }
    },
    [status],
  );

  const start = useCallback(async () => {
    setError(null);
    setStatus('minting');

    try {
      await stop();
      const sessionToken = await mintToken();
      setStatus('connecting');

      if (isWeb) {
        const { createAnamStreamClient } = await import(
          '@/features/anam/client/create-anam-client'
        );
        const client = createAnamStreamClient(sessionToken);
        clientRef.current = client;

        const preferMuted = options.startMicMuted !== false;
        if (preferMuted) {
          try {
            client.muteInputAudio?.();
          } catch {
            // mute before stream is best-effort
          }
        }

        await client.streamToVideoElement(ANAM_VIDEO_ELEMENT_ID);

        if (preferMuted) {
          try {
            client.muteInputAudio?.();
          } catch {
            // keep trying after stream attaches
          }
          setMicEnabledState(false);
        } else {
          try {
            client.unmuteInputAudio?.();
          } catch {
            // default SDK path leaves mic open
          }
          setMicEnabledState(true);
        }

        if (options.enableTalkPipeline !== false) {
          detachPipelineRef.current = attachTalkVoicePipeline({
            anamClient: client,
            getToken,
            employeeId,
            sessionId: options.talkSessionId,
            voiceMode: options.voiceMode ?? 'elevenlabs',
            voiceId: options.voiceId,
            setPipelineState,
            onError: (message) => setError(friendlyAnamError(message)),
          });
        }

        setStatus('connected');
        return;
      }

      if (!bridgeRef.current) {
        throw new Error('Anam WebView bridge is not ready');
      }

      if (options.enableTalkPipeline !== false) {
        nativePipelineRef.current = attachNativeTalkPipeline({
          bridge: bridgeRef.current,
          getToken,
          employeeId,
          sessionId: options.talkSessionId,
          voiceMode: options.voiceMode ?? 'elevenlabs',
          voiceId: options.voiceId,
          setPipelineState,
          onError: (message) => setError(friendlyAnamError(message)),
        });
      }

      setMicEnabledState(true);
      bridgeRef.current.start(sessionToken);
      // status → connected comes from bridge message
    } catch (err) {
      const message = friendlyAnamError(
        err instanceof Error ? err.message : 'Failed to start persona session',
      );
      setError(message);
      setStatus('error');
      clientRef.current = null;
      detachPipelineRef.current = null;
      nativePipelineRef.current?.dispose();
      nativePipelineRef.current = null;
      setMicEnabledState(false);
      if (__DEV__) {
        console.warn('[anam] start failed', err);
      }
    }
  }, [
    employeeId,
    getToken,
    isWeb,
    mintToken,
    options.enableTalkPipeline,
    options.startMicMuted,
    options.talkSessionId,
    options.voiceId,
    options.voiceMode,
    stop,
  ]);

  const sendText = useCallback(
    (content: string) => {
      const text = content.trim();
      if (!text) return false;

      try {
        if (isWeb) {
          if (!clientRef.current?.sendUserMessage) return false;
          clientRef.current.sendUserMessage(text);
          return true;
        }

        if (!bridgeRef.current) return false;
        bridgeRef.current.sendText(text);
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to send message';
        setError(message);
        return false;
      }
    },
    [isWeb],
  );

  const onBridgeMessage = useCallback((message: BridgeToRnMessage) => {
    if (message.type === 'status') {
      if (message.status === 'connected') setStatus('connected');
      else if (message.status === 'connecting') setStatus('connecting');
      else if (message.status === 'idle') setStatus('idle');
      else if (message.status === 'error') {
        setStatus('error');
        setError(friendlyAnamError(message.error ?? 'Anam bridge error'));
      }
      return;
    }

    if (message.type === 'error') {
      setError(friendlyAnamError(message.error));
      return;
    }

    if (message.type === 'userMessage') {
      const history = (message.history ?? []).map((item) => ({
        role: String(item.role).toLowerCase() === 'user' ? ('user' as const) : ('persona' as const),
        content: item.content,
      }));
      nativePipelineRef.current?.handleUserMessage(message.content, history);
    }
  }, []);

  useEffect(() => {
    return () => {
      detachPipelineRef.current?.();
      detachPipelineRef.current = null;
      nativePipelineRef.current?.dispose();
      nativePipelineRef.current = null;
      void clientRef.current?.stopStreaming?.();
      clientRef.current = null;
      bridgeRef.current?.stop();
    };
  }, []);

  return {
    status,
    pipelineState,
    error,
    micEnabled,
    setMicEnabled,
    start,
    stop,
    sendText,
    isWeb,
    /** True when native WebView bridge path is used (Android/iOS). */
    isNativeBridge: !isWeb,
    employeeId,
    bridgeRef,
    onBridgeMessage,
  };
}
