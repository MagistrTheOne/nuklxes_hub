/**
 * NULLXES Talk architecture (matches dplatform):
 * - Live face = Anam sessionToken (not ElevenLabs WebRTC agents)
 * - voiceMode=anam → Anam TTS
 * - voiceMode=elevenlabs → ElevenLabs PCM into Anam mouth
 * - Brain = platform POST /api/talk/brain-stream (proxied later)
 * - xAI Voice agent (Adeline) is a separate Grok-call pipeline
 */

export type TalkVoiceMode = 'elevenlabs' | 'anam';

export type TalkBootstrap = {
  sessionId: string;
  /** Anam engine session token — feed to Anam player only. */
  sessionToken: string;
  voiceMode: TalkVoiceMode;
  employeeId: string;
  employeeName: string;
  previewUrl: string | null;
  /** ElevenLabs voice for PCM→Anam when voiceMode=elevenlabs */
  voiceId: string | null;
};
