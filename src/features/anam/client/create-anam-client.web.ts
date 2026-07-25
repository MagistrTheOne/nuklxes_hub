import { createClient } from '@anam-ai/js-sdk';

import type { AnamStreamClient } from '@/features/anam/client/types';

/**
 * Browser / Expo web — official Anam JS SDK (WebRTC → <video>).
 * @see https://anam.ai/docs/javascript-sdk/quickstart
 */
export function createAnamStreamClient(sessionToken: string): AnamStreamClient {
  const client = createClient(sessionToken);

  return {
    streamToVideoElement: (videoElementId) => client.streamToVideoElement(videoElementId),
    stopStreaming: () => client.stopStreaming(),
  };
}
