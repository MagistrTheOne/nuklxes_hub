/** Minimal Talk surface used by voice pipeline (web Anam SDK). */
export type AnamTalkClient = {
  streamToVideoElement: (videoElementId: string) => Promise<void>;
  stopStreaming?: () => Promise<void> | void;
  sendUserMessage?: (content: string) => void;
  interruptPersona?: () => void;
  createTalkMessageStream?: (correlationId?: string) => {
    streamMessageChunk: (partial: string, endOfSpeech: boolean) => Promise<void> | void;
    endMessage: () => Promise<void> | void;
    isActive: () => boolean;
  };
  createAgentAudioInputStream?: (config: {
    encoding: 'pcm_s16le';
    sampleRate: number;
    channels: number;
  }) => {
    sendAudioChunk: (chunk: ArrayBuffer | Uint8Array | string) => void;
    endSequence: () => void;
  };
  addListener?: (event: string, callback: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, callback: (...args: unknown[]) => void) => void;
};

export type AnamStreamClient = AnamTalkClient;

export type CreateAnamStreamClient = (sessionToken: string) => AnamStreamClient;
