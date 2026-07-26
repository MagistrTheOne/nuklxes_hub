import { useCallback, useState } from 'react';

import { ADELINE_KALEN_EMPLOYEE_ID } from '@/features/xai-voice/constants';
import type { XaiVoiceStatus } from '@/features/xai-voice/types';

/**
 * Native stub — full mic/PCM I/O for Grok Voice is web-first in Hub v1.
 * Session mint + WS audio path lives in use-xai-voice-session.web.ts.
 */
export function useXaiVoiceSession() {
  const [status] = useState<XaiVoiceStatus>('idle');
  const [error] = useState<string | null>(
    'Voice calls are available in the web app for now.',
  );

  const start = useCallback(async () => {
    // no-op on native for v1
  }, []);

  const stop = useCallback(() => {
    // no-op
  }, []);

  return {
    status,
    error,
    transcript: [] as Array<{ role: 'user' | 'assistant'; text: string }>,
    start,
    stop,
    employeeId: ADELINE_KALEN_EMPLOYEE_ID,
  };
}
