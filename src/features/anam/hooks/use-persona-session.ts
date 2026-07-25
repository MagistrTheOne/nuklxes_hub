import { useAuth } from '@clerk/expo';
import { useCallback, useRef, useState } from 'react';
import { Platform } from 'react-native';

import { requestAnamSessionToken } from '@/features/anam/api/request-session-token';
import type { AnamStreamClient } from '@/features/anam/client/types';
import { ANAM_VIDEO_ELEMENT_ID } from '@/features/anam/constants';
import type { AnamPersonaConfig, PersonaSessionStatus } from '@/features/anam/types';
import { DEFAULT_EMPLOYEE_ID } from '@/features/workforce/data/employees';
import type { AnamSlot } from '@/features/workforce/types';

export type UsePersonaSessionOptions = {
  employeeId?: string;
  personaConfig?: AnamPersonaConfig;
  anamSlot?: AnamSlot;
};

export function usePersonaSession(options: UsePersonaSessionOptions = {}) {
  const employeeId = options.employeeId ?? DEFAULT_EMPLOYEE_ID;
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
        employeeId: options.personaConfig ? undefined : employeeId,
        personaConfig: options.personaConfig,
        anamSlot: options.anamSlot,
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
  }, [employeeId, getToken, options.anamSlot, options.personaConfig]);

  return {
    status,
    error,
    start,
    stop,
    isWeb: Platform.OS === 'web',
    employeeId,
  };
}
