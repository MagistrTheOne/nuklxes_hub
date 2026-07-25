import { Mic, Square } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_VOICE_PREVIEW_TEXT,
  ELEVENLABS_VOICE_MODEL_ID,
  useElevenLabsVoices,
  useVoicePreview,
} from '@/features/elevenlabs';

/**
 * Voice studio preview only (ElevenLabs TTS eleven_v3).
 * Live Talk = Anam face + brain-stream — see Talk / Live tabs.
 * Not ElevenLabs Conversational Agents / WebRTC.
 */
export default function VoiceScreen() {
  const { data: voices = [], isFetching, isError } = useElevenLabsVoices();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? voices[0]?.voiceId ?? null;
  const activeVoice = useMemo(
    () => voices.find((v) => v.voiceId === activeId) ?? null,
    [activeId, voices],
  );
  const { status, error, speak, stop } = useVoicePreview(activeId);
  const busy = status === 'loading' || status === 'speaking';

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5">
          <Text className="pt-2 text-[28px] font-semibold text-white">Voice</Text>
          <Text className="mt-2 text-[15px] leading-6 text-white/45">
            TTS preview · {ELEVENLABS_VOICE_MODEL_ID}
            {activeVoice ? ` · ${activeVoice.name}` : ''}
          </Text>
          <Text className="mt-1 text-[13px] text-white/30">
            Live Talk uses Anam + brain — not EL Agents
          </Text>
        </View>

        <View className="mt-10 items-center px-5">
          <Pressable
            onPress={() => {
              if (status === 'speaking') {
                void stop();
                return;
              }
              void speak(DEFAULT_VOICE_PREVIEW_TEXT);
            }}
            disabled={!activeId || status === 'loading'}
            className="h-28 w-28 items-center justify-center rounded-full bg-white active:opacity-90 disabled:opacity-40">
            {status === 'loading' ? (
              <ActivityIndicator color="#050505" />
            ) : status === 'speaking' ? (
              <Square size={32} color="#050505" fill="#050505" />
            ) : (
              <Mic size={36} color="#050505" />
            )}
          </Pressable>
          <Text className="mt-5 text-[15px] text-white/50">
            {status === 'loading'
              ? 'Synthesizing…'
              : status === 'speaking'
                ? 'Playing · tap to stop'
                : 'Tap to preview'}
          </Text>
          {error ? <Text className="mt-2 text-center text-[13px] text-red-400">{error}</Text> : null}
        </View>

        <Text className="mb-3 mt-10 px-5 text-[12px] font-semibold tracking-[1.5px] text-white/35">
          VOICES
        </Text>

        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pb-10"
          showsVerticalScrollIndicator={false}>
          {voices.map((voice) => {
            const active = voice.voiceId === activeId;
            return (
              <Pressable
                key={voice.voiceId}
                onPress={() => {
                  if (busy) void stop();
                  setSelectedId(voice.voiceId);
                }}
                className={`mb-2 flex-row items-center rounded-2xl border px-3.5 py-3 ${
                  active
                    ? 'border-white/30 bg-white'
                    : 'border-white/10 bg-[#0B0B0B]'
                }`}>
                <View className="flex-1">
                  <Text
                    className={`text-[16px] font-medium ${
                      active ? 'text-[#050505]' : 'text-white'
                    }`}>
                    {voice.name}
                  </Text>
                  <Text
                    className={`mt-0.5 text-[13px] ${
                      active ? 'text-[#050505]/60' : 'text-white/40'
                    }`}>
                    {[voice.gender, voice.language, voice.category]
                      .filter(Boolean)
                      .join(' · ') || 'ElevenLabs'}
                  </Text>
                </View>
              </Pressable>
            );
          })}

          <View className="mt-4 flex-row items-center justify-center gap-2">
            {isFetching ? <ActivityIndicator color="rgba(255,255,255,0.35)" /> : null}
            <Text className="text-center text-[12px] text-white/30">
              {isError ? 'Voices API unavailable · showing starters' : 'Synced from ElevenLabs'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
