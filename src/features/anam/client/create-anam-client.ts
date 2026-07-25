import type { AnamStreamClient } from '@/features/anam/client/types';

/**
 * Native Android/iOS — official @anam-ai/js-sdk is browser-only
 * (DOM video element + browser WebRTC). Native path will be:
 * 1) WebView bridge hosting the web SDK, or
 * 2) react-native-webrtc + Anam signalling (dev client, not Expo Go).
 */
export function createAnamStreamClient(_sessionToken: string): AnamStreamClient {
  return {
    async streamToVideoElement() {
      throw new Error(
        'Anam streaming is not available on native yet. Use Expo web, or wire WebView / react-native-webrtc.',
      );
    },
  };
}
