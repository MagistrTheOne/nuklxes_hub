import type { ReactNode } from 'react';

/**
 * Native: Agents WebRTC needs @elevenlabs/react-native + Dev Client later.
 * TTS preview via server + expo-av works on all platforms.
 */
export function ElevenLabsVoiceProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
