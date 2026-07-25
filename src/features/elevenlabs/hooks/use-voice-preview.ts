import { useAuth } from '@clerk/expo';
import { Audio } from 'expo-av';
import { useCallback, useEffect, useRef, useState } from 'react';

import { requestElevenLabsTts } from '@/features/elevenlabs/api/request-tts';
import { DEFAULT_VOICE_PREVIEW_TEXT } from '@/features/elevenlabs/constants';
import type { VoiceSessionStatus } from '@/features/elevenlabs/types';

export function useVoicePreview(voiceId: string | null) {
  const { getToken } = useAuth();
  const soundRef = useRef<Audio.Sound | null>(null);
  const [status, setStatus] = useState<VoiceSessionStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  const stop = useCallback(async () => {
    try {
      await soundRef.current?.stopAsync();
      await soundRef.current?.unloadAsync();
    } catch {
      // ignore teardown
    } finally {
      soundRef.current = null;
      setStatus('idle');
    }
  }, []);

  useEffect(() => {
    return () => {
      void stop();
    };
  }, [stop]);

  const speak = useCallback(
    async (text: string = DEFAULT_VOICE_PREVIEW_TEXT) => {
      if (!voiceId) {
        setError('Select a voice first');
        setStatus('error');
        return;
      }

      setError(null);
      setStatus('loading');
      await stop();

      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          allowsRecordingIOS: false,
        });

        const { audioBase64, contentType } = await requestElevenLabsTts({
          getToken,
          voiceId,
          text,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: `data:${contentType};base64,${audioBase64}` },
          { shouldPlay: true },
        );
        soundRef.current = sound;
        setStatus('speaking');

        sound.setOnPlaybackStatusUpdate((playback) => {
          if (!playback.isLoaded) return;
          if (playback.didJustFinish) {
            void stop();
          }
        });
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Voice preview failed';
        setError(message);
        setStatus('error');
        soundRef.current = null;
      }
    },
    [getToken, stop, voiceId],
  );

  return { status, error, speak, stop };
}
