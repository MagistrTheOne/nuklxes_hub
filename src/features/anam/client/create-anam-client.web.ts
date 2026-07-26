// Deep CJS entry — package "module" ESM re-exports break Metro on Windows.
import { createClient } from '@anam-ai/js-sdk/dist/main/index.js';

import type { AnamStreamClient } from '@/features/anam/client/types';

/**
 * Browser / Expo web — official Anam JS SDK (WebRTC → <video> + mouth APIs).
 * @see https://anam.ai/docs/javascript-sdk/quickstart
 */
export function createAnamStreamClient(sessionToken: string): AnamStreamClient {
  const client = createClient(sessionToken);

  return {
    streamToVideoElement: (videoElementId) => client.streamToVideoElement(videoElementId),
    stopStreaming: () => client.stopStreaming(),
    sendUserMessage: (content) => client.sendUserMessage(content),
    interruptPersona: () => client.interruptPersona(),
    muteInputAudio: () => client.muteInputAudio(),
    unmuteInputAudio: () => client.unmuteInputAudio(),
    createTalkMessageStream: (correlationId) => client.createTalkMessageStream(correlationId),
    createAgentAudioInputStream: (config) => client.createAgentAudioInputStream(config),
    addListener: (event, callback) => {
      // SDK types are stricter; runtime event names match AnamEvent enum values.
      client.addListener(event as never, callback as never);
    },
    removeListener: (event, callback) => {
      client.removeListener(event as never, callback as never);
    },
  };
}
