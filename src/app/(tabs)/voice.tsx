import { Mic, Square } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  DEFAULT_VOICE_PREVIEW_TEXT,
  ELEVENLABS_VOICE_MODEL_ID,
  ElevenLabsVoiceProvider,
  useAgentSession,
  useElevenLabsVoices,
  useVoicePreview,
} from '@/features/elevenlabs';

type VoiceMode = 'preview' | 'live';

function ModeSwitch({
  mode,
  onChange,
}: {
  mode: VoiceMode;
  onChange: (mode: VoiceMode) => void;
}) {
  return (
    <View className="mt-4 flex-row gap-2 px-5">
      {(['preview', 'live'] as const).map((item) => {
        const active = mode === item;
        return (
          <Pressable
            key={item}
            onPress={() => onChange(item)}
            className={`h-9 flex-1 items-center justify-center rounded-full ${
              active ? 'bg-white' : 'border border-white/15'
            }`}>
            <Text
              className={`text-[13px] font-medium ${
                active ? 'text-[#050505]' : 'text-white/70'
              }`}>
              {item === 'preview' ? 'Preview' : 'Live agent'}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function VoicePanel() {
  const { data: voices = [], isFetching, isError } = useElevenLabsVoices();
  const [mode, setMode] = useState<VoiceMode>('preview');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? voices[0]?.voiceId ?? null;
  const activeVoice = useMemo(
    () => voices.find((v) => v.voiceId === activeId) ?? null,
    [activeId, voices],
  );

  const preview = useVoicePreview(activeId);
  const agent = useAgentSession({ voiceId: activeId });

  const status = mode === 'preview' ? preview.status : agent.status;
  const error = mode === 'preview' ? preview.error : agent.error;
  const busy =
    mode === 'preview'
      ? preview.status === 'loading' || preview.status === 'speaking'
      : agent.status === 'minting' ||
        agent.status === 'connecting' ||
        agent.status === 'connected';

  const statusLabel = (() => {
    if (mode === 'preview') {
      if (preview.status === 'loading') return 'Synthesizing…';
      if (preview.status === 'speaking') return 'Playing · tap to stop';
      return 'Tap to preview TTS';
    }
    if (agent.status === 'unsupported') return 'Live agent · web only for now';
    if (agent.status === 'minting') return 'Minting session…';
    if (agent.status === 'connecting') return 'Connecting mic…';
    if (agent.status === 'connected') {
      return agent.mode === 'speaking' ? 'Agent speaking · tap to end' : 'Listening · tap to end';
    }
    return Platform.OS === 'web' ? 'Tap for live agent' : 'Open on web for live agent';
  })();

  return (
    <SafeAreaView className="flex-1" edges={['top']}>
      <View className="px-5">
        <Text className="pt-2 text-[28px] font-semibold text-white">Voice</Text>
        <Text className="mt-2 text-[15px] leading-6 text-white/45">
          ElevenLabs · {mode === 'preview' ? ELEVENLABS_VOICE_MODEL_ID : 'Agents'}
          {activeVoice ? ` · ${activeVoice.name}` : ''}
        </Text>
      </View>

      <ModeSwitch
        mode={mode}
        onChange={(next) => {
          if (preview.status === 'speaking') void preview.stop();
          if (agent.status === 'connected') void agent.stop();
          setMode(next);
        }}
      />

      <View className="mt-8 items-center px-5">
        <Pressable
          onPress={() => {
            if (mode === 'preview') {
              if (preview.status === 'speaking') {
                void preview.stop();
                return;
              }
              void preview.speak(DEFAULT_VOICE_PREVIEW_TEXT);
              return;
            }

            if (agent.status === 'connected') {
              void agent.stop();
              return;
            }
            void agent.start();
          }}
          disabled={
            !activeId ||
            (mode === 'preview' && preview.status === 'loading') ||
            (mode === 'live' &&
              (agent.status === 'minting' ||
                agent.status === 'connecting' ||
                agent.status === 'unsupported'))
          }
          className="h-28 w-28 items-center justify-center rounded-full bg-white active:opacity-90 disabled:opacity-40">
          {status === 'loading' || status === 'minting' || status === 'connecting' ? (
            <ActivityIndicator color="#050505" />
          ) : status === 'speaking' || status === 'connected' ? (
            <Square size={32} color="#050505" fill="#050505" />
          ) : (
            <Mic size={36} color="#050505" />
          )}
        </Pressable>
        <Text className="mt-5 text-center text-[15px] text-white/50">{statusLabel}</Text>
        {error ? <Text className="mt-2 text-center text-[13px] text-red-400">{error}</Text> : null}
        {mode === 'live' && !error ? (
          <Text className="mt-2 text-center text-[12px] text-white/30">
            Needs ELEVENLABS_AGENT_ID on server
          </Text>
        ) : null}
      </View>

      <Text className="mb-3 mt-8 px-5 text-[12px] font-semibold tracking-[1.5px] text-white/35">
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
                if (busy) {
                  if (mode === 'preview') void preview.stop();
                  else void agent.stop();
                }
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
  );
}

export default function VoiceScreen() {
  return (
    <View className="flex-1 bg-[#050505]">
      <ElevenLabsVoiceProvider>
        <VoicePanel />
      </ElevenLabsVoiceProvider>
    </View>
  );
}
