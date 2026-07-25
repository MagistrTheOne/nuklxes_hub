export type AnamEphemeralPersonaConfig = {
  name: string;
  avatarId: string;
  avatarModel?: 'cara-3' | 'cara-4' | 'cara-4-latest';
  voiceId: string;
  llmId: string;
  systemPrompt: string;
  maxSessionLengthSeconds?: number;
  skipGreeting?: boolean;
  initialMessage?: string | null;
};

export type AnamStatefulPersonaConfig = {
  personaId: string;
};

export type AnamPersonaConfig = AnamEphemeralPersonaConfig | AnamStatefulPersonaConfig;

export type AnamSessionTokenResponse = {
  sessionToken: string;
  /** Lab key slot used to mint this token (e.g. ANAM_API_KEY_2). */
  anamSlot?: string;
};

export type PersonaSessionStatus =
  | 'idle'
  | 'minting'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'unsupported';

/**
 * Official @anam-ai/js-sdk targets browsers (DOM video + WebRTC).
 * Expo web: supported. Native Android/iOS: needs WebView bridge or RN WebRTC later.
 */
export type AnamRuntimePlatform = 'web' | 'native';
