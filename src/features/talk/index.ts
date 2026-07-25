export { requestTalkSession } from '@/features/talk/api/request-talk-session';
export { streamTalkBrain } from '@/features/talk/api/stream-talk-brain';
export { attachTalkVoicePipeline } from '@/features/talk/lib/attach-talk-voice-pipeline';
export { playTalkVoiceReply } from '@/features/talk/lib/play-talk-voice-reply';
export { resolveTalkVoiceMode } from '@/features/talk/lib/resolve-talk-voice-mode';
export type { TalkPipelineState } from '@/features/talk/lib/attach-talk-voice-pipeline';
export type {
  TalkBootstrap,
  TalkBrainStreamEvent,
  TalkPipelineMessage,
  TalkPipelineRole,
  TalkVoiceMode,
} from '@/features/talk/types';
