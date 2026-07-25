import { useAuth } from '@clerk/expo';
import { useCallback, useRef, useState } from 'react';

import { requestXaiVoiceSession } from '@/features/xai-voice/api/request-xai-voice-session';
import {
  base64ToInt16,
  floatTo16BitPcm,
  int16ToBase64,
} from '@/features/xai-voice/lib/pcm';
import { ADELINE_KALEN_EMPLOYEE_ID } from '@/features/xai-voice/constants';
import type { XaiVoiceStatus } from '@/features/xai-voice/types';

type TranscriptLine = { role: 'user' | 'assistant'; text: string };

/**
 * Web-only Adeline Grok Voice: mint → WS (xai-client-secret) → mic PCM ↔ playback.
 */
export function useXaiVoiceSession() {
  const { getToken } = useAuth();
  const [status, setStatus] = useState<XaiVoiceStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState<TranscriptLine[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const playTimeRef = useRef(0);

  const cleanupAudio = useCallback(() => {
    try {
      processorRef.current?.disconnect();
    } catch {
      // ignore
    }
    processorRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close();
    audioCtxRef.current = null;
    playTimeRef.current = 0;
  }, []);

  const teardown = useCallback(() => {
    try {
      wsRef.current?.close();
    } catch {
      // ignore
    }
    wsRef.current = null;
    cleanupAudio();
  }, [cleanupAudio]);

  const stop = useCallback(() => {
    teardown();
    setStatus('idle');
  }, [teardown]);

  const playPcmChunk = useCallback((base64: string, sampleRate: number) => {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const int16 = base64ToInt16(base64);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i += 1) {
      float32[i] = (int16[i] ?? 0) / 0x8000;
    }
    const buffer = ctx.createBuffer(1, float32.length, sampleRate);
    buffer.copyToChannel(float32, 0);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    const startAt = Math.max(ctx.currentTime, playTimeRef.current);
    source.start(startAt);
    playTimeRef.current = startAt + buffer.duration;
  }, []);

  const start = useCallback(async () => {
    setError(null);
    setTranscript([]);
    setStatus('minting');

    try {
      teardown();
      const session = await requestXaiVoiceSession({
        getToken,
        employeeId: ADELINE_KALEN_EMPLOYEE_ID,
      });

      setStatus('connecting');
      const ws = new WebSocket(session.websocketUrl, [
        `xai-client-secret.${session.clientSecret}`,
      ]);
      wsRef.current = ws;

      ws.onopen = async () => {
        ws.send(JSON.stringify(session.sessionUpdate));

        const audioCtx = new AudioContext({ sampleRate: session.sampleRate });
        audioCtxRef.current = audioCtx;
        playTimeRef.current = audioCtx.currentTime;

        const media = await navigator.mediaDevices.getUserMedia({
          audio: {
            channelCount: 1,
            echoCancellation: true,
            noiseSuppression: true,
          },
        });
        streamRef.current = media;
        const source = audioCtx.createMediaStreamSource(media);
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        processorRef.current = processor;

        processor.onaudioprocess = (event) => {
          if (ws.readyState !== WebSocket.OPEN) return;
          const input = event.inputBuffer.getChannelData(0);
          const pcm = floatTo16BitPcm(input);
          ws.send(
            JSON.stringify({
              type: 'input_audio_buffer.append',
              audio: int16ToBase64(pcm),
            }),
          );
        };

        // ScriptProcessor must be in the graph to fire; mute so mic isn't monitored.
        const mute = audioCtx.createGain();
        mute.gain.value = 0;
        source.connect(processor);
        processor.connect(mute);
        mute.connect(audioCtx.destination);
        setStatus('connected');
      };

      ws.onmessage = (event) => {
        try {
          const payload = JSON.parse(String(event.data)) as {
            type?: string;
            delta?: string;
            transcript?: string;
            item?: { role?: string; content?: Array<{ transcript?: string; text?: string }> };
          };

          if (
            payload.type === 'response.output_audio.delta' &&
            typeof payload.delta === 'string'
          ) {
            playPcmChunk(payload.delta, session.sampleRate);
          }

          if (
            payload.type === 'conversation.item.input_audio_transcription.completed' &&
            typeof payload.transcript === 'string' &&
            payload.transcript.trim()
          ) {
            setTranscript((prev) => [
              ...prev,
              { role: 'user', text: payload.transcript!.trim() },
            ]);
          }

          if (
            payload.type === 'response.output_audio_transcript.done' &&
            typeof payload.transcript === 'string' &&
            payload.transcript.trim()
          ) {
            setTranscript((prev) => [
              ...prev,
              { role: 'assistant', text: payload.transcript!.trim() },
            ]);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onerror = () => {
        setError('xAI WebSocket error');
        setStatus('error');
      };

      ws.onclose = () => {
        cleanupAudio();
        setStatus((current) => (current === 'error' ? current : 'idle'));
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start xAI voice';
      setError(message);
      setStatus('error');
      cleanupAudio();
    }
  }, [cleanupAudio, getToken, playPcmChunk, teardown]);

  return {
    status,
    error,
    transcript,
    start,
    stop,
    employeeId: ADELINE_KALEN_EMPLOYEE_ID,
  };
}
