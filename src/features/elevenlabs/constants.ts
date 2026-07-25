export const ELEVENLABS_VOICE_MODEL_ID = 'eleven_v3' as const;

export const DEFAULT_VOICE_PREVIEW_TEXT =
  'Hello. This is NULLXES. Real-time voice for digital employees.';

/** Curated starters if the voices API is slow — George / Sarah / Laura / Charlie. */
export const FALLBACK_ELEVENLABS_VOICES = [
  {
    voiceId: 'JBFqnCBsd6RMkjVDRZzb',
    name: 'George',
    category: 'premade',
    gender: 'male',
    language: 'English',
    previewUrl: null,
  },
  {
    voiceId: 'EXAVITQu4vr4xnSDxMaL',
    name: 'Sarah',
    category: 'premade',
    gender: 'female',
    language: 'English',
    previewUrl: null,
  },
  {
    voiceId: 'FGY2WhTYpPnrIDTdsKH5',
    name: 'Laura',
    category: 'premade',
    gender: 'female',
    language: 'English',
    previewUrl: null,
  },
  {
    voiceId: 'IKne3meq5aSn9XLyUdCD',
    name: 'Charlie',
    category: 'premade',
    gender: 'male',
    language: 'English',
    previewUrl: null,
  },
] as const;
