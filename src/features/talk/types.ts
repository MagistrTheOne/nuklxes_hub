/**
 * NULLXES Talk architecture:
 * - Live face = Anam sessionToken
 * - voiceMode=elevenlabs → ElevenLabs PCM into Anam mouth (default)
 * - voiceMode=anam → Anam TTS
 * - Brain = Hub POST /api/v1/talk/brain-stream (Clerk)
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

export type TalkPipelineRole = 'user' | 'persona';

export type TalkPipelineMessage = {
  role: TalkPipelineRole;
  content: string;
};

export type TalkBrainStreamEvent =
  | {
      type: 'perf';
      turnId?: string;
      spans?: Partial<Record<'build' | 'ttfb' | 'tool_loop' | 'rag', number>>;
      flags?: { cacheHit?: boolean; ragUsed?: boolean; slaDegrade?: boolean };
    }
  | {
      type: 'meta';
      brainProvider: string;
      model: string;
      modelLabel: string;
    }
  | { type: 'content'; content: string }
  | { type: 'tool'; tool: string; phase: 'start' | 'done' };
