import { useAuth } from '@clerk/expo';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { requestAnamSessionToken } from '@/features/anam/api/request-session-token';
import type { AnamStreamClient } from '@/features/anam/client/types';
import { ANAM_VIDEO_ELEMENT_ID, DEFAULT_ANAM_PERSONA } from '@/features/anam/constants';
import type { AnamPersonaConfig, PersonaSessionStatus } from '@/features/anam/types';

export function usePersonaSession(personaConfig: AnamPersonaConfig = DEFAULT_ANAM_PERSONA) {
  const { getToken } = useAuth();
  const clientRef = useRef<AnamStreamClient | null>(null);
  const [status, setStatus] = useState<PersonaSessionStatus>(
    Platform.OS === 'web' ? 'idle' : 'unsupported',
  );
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    try {
      await clientRef.current?.stopStreaming?.();
    } catch {
      // ignore teardown errors
    } finally {
      clientRef.current = null;
      setStatus(Platform.OS === 'web' ? 'idle' : 'unsupported');
    }
  }, []);

  const start = useCallback(async () => {
    if (Platform.OS !== 'web') {
      setStatus('unsupported');
      setError('Anam JS SDK runs on web. Native bridge comes next.');
      return;
    }

    setError(null);
    setStatus('minting');

    try {
      const { sessionToken } = await requestAnamSessionToken({
        getToken,
        personaConfig,
      });

      setStatus('connecting');
      // Dynamic import keeps @anam-ai/js-sdk out of SSR / Node render bundles.
      const { createAnamStreamClient } = await import('@/features/anam/client/create-anam-client');
      const client = createAnamStreamClient(sessionToken);
      clientRef.current = client;
      await client.streamToVideoElement(ANAM_VIDEO_ELEMENT_ID);
      setStatus('connected');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start persona session';
      setError(message);
      setStatus('error');
      clientRef.current = null;
      if (__DEV__) {
        console.warn('[anam] start failed', err);
      }
    }
  }, [getToken, personaConfig]);

  return {
    status,
    error,
    start,
    stop,
    isWeb: Platform.OS === 'web',
  };
}
