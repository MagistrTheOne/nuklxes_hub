export type ElevenLabsVoice = {
  voiceId: string;
  name: string;
  category: string | null;
  gender: string | null;
  language: string | null;
  previewUrl: string | null;
};

export type ElevenLabsTtsResponse = {
  audioBase64: string;
  contentType: string;
  modelId: string;
};

export type VoiceSessionStatus = 'idle' | 'loading' | 'speaking' | 'error';
