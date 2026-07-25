export type TalkPipelineRole = 'user' | 'persona';

export type TalkPipelineMessage = {
  role: TalkPipelineRole;
  content: string;
};

export type TalkBrainChatMessage = {
  role: 'user' | 'assistant';
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

export type BrainApiConfig = {
  provider: 'openai' | 'nullxes' | 'xai';
  baseUrl: string;
  apiKey: string;
  model: string;
};
