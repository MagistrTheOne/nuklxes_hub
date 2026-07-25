/** RN ↔ Anam WebView postMessage protocol. */

export type BridgeStatus =
  | 'idle'
  | 'ready'
  | 'connecting'
  | 'connected'
  | 'error';

export type RnToBridgeMessage =
  | { type: 'start'; sessionToken: string }
  | { type: 'stop' }
  | { type: 'sendText'; content: string }
  | { type: 'speak'; content: string; correlationId?: string }
  | { type: 'playPcm'; pcmBase64: string }
  | { type: 'interrupt' };

export type BridgeToRnMessage =
  | { type: 'ready' }
  | { type: 'status'; status: BridgeStatus; error?: string }
  | { type: 'userMessage'; content: string; history?: Array<{ role: string; content: string }> }
  | { type: 'error'; error: string };

export type AnamBridgeHandle = {
  start: (sessionToken: string) => void;
  stop: () => void;
  sendText: (content: string) => void;
  speak: (content: string, correlationId?: string) => void;
  playPcm: (pcmBase64: string) => void;
  interrupt: () => void;
};
