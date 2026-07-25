import type { AnamEphemeralPersonaConfig } from '@/features/anam/types';

/** Default ephemeral persona used until Lab persona IDs are wired per employee. */
export const DEFAULT_ANAM_PERSONA: AnamEphemeralPersonaConfig = {
  name: 'NULLXES Assistant',
  avatarId: '30fa96d0-26c4-4e55-94a0-517025942e18',
  avatarModel: 'cara-4',
  voiceId: '6bfbe25a-979d-40f3-a92b-5394170af54b',
  llmId: 'a7cf662c-2ace-4de1-a21e-ef0fbf144bb7',
  systemPrompt:
    'You are a NULLXES digital workforce assistant. Keep replies calm, concise, and professional.',
  maxSessionLengthSeconds: 600,
};

export const ANAM_VIDEO_ELEMENT_ID = 'nullxes-anam-persona-video';
