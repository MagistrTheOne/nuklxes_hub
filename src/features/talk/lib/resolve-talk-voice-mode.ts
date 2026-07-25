import type { TalkVoiceMode } from '@/features/talk/types';

export function resolveTalkVoiceMode(input: {
  sessionVoiceProvider?: string | null;
  voiceId?: string | null;
  studioVoiceId?: string | null;
}): TalkVoiceMode {
  if (
    input.sessionVoiceProvider === 'elevenlabs' &&
    Boolean(input.voiceId) &&
    Boolean(input.studioVoiceId)
  ) {
    return 'elevenlabs';
  }
  return 'anam';
}
