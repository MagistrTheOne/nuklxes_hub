export type AnamStreamClient = {
  streamToVideoElement: (videoElementId: string) => Promise<void>;
  stopStreaming?: () => Promise<void> | void;
};

export type CreateAnamStreamClient = (sessionToken: string) => AnamStreamClient;
