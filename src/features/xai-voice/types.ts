export type XaiVoiceSession = {
  clientSecret: string;
  expiresAt?: string;
  websocketUrl: string;
  agentId: string;
  employeeId: string;
  bindConsoleAgent: true;
  sampleRate: number;
  sessionUpdate: {
    type: 'session.update';
    session: Record<string, unknown>;
  };
};

export type XaiVoiceStatus =
  | 'idle'
  | 'minting'
  | 'connecting'
  | 'connected'
  | 'error';
