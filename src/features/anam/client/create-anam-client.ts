import type { AnamStreamClient } from '@/features/anam/client/types';

/**
 * Native Android/iOS — Anam face runs in WebView bridge (PersonaStage),
 * not via this module. Kept for Metro platform resolve symmetry with .web.ts.
 */
export function createAnamStreamClient(_sessionToken: string): AnamStreamClient {
  return {
    async streamToVideoElement() {
      throw new Error(
        'Use PersonaStage WebView bridge on native (see usePersonaSession isNativeBridge).',
      );
    },
  };
}
