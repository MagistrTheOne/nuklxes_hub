import { ConversationProvider } from '@elevenlabs/react';
import type { ReactNode } from 'react';

/** Web: ElevenAgents ConversationProvider (latest @elevenlabs/react). */
export function ElevenLabsVoiceProvider({ children }: { children: ReactNode }) {
  return <ConversationProvider>{children}</ConversationProvider>;
}
