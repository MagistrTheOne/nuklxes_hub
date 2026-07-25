import { Platform, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonaStage } from '@/features/anam/components/persona-stage';
import { usePersonaSession } from '@/features/anam/hooks/use-persona-session';

export default function LiveScreen() {
  const { status, error, start, stop, isWeb } = usePersonaSession();

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1 px-5" edges={['top']}>
        <Text className="pt-2 text-[28px] font-semibold text-white">Live</Text>
        <Text className="mt-3 text-[15px] leading-6 text-white/45">
          Realtime Anam persona stage. Session tokens mint on the server; the JS SDK
          streams on web.
        </Text>

        <View className="mt-8 overflow-hidden rounded-3xl border border-white/10">
          <PersonaStage />
        </View>

        <Text className="mt-4 text-[13px] text-white/40">
          Status: {status}
          {Platform.OS !== 'web' ? ' · native bridge pending' : ''}
        </Text>
        {error ? <Text className="mt-2 text-[13px] text-red-400">{error}</Text> : null}

        <View className="mt-6 flex-row gap-3">
          <Pressable
            onPress={() => void start()}
            disabled={!isWeb || status === 'minting' || status === 'connecting'}
            className="h-12 flex-1 items-center justify-center rounded-2xl bg-white active:opacity-90 disabled:opacity-40">
            <Text className="text-[15px] font-semibold text-[#050505]">
              {status === 'connected' ? 'Restart' : 'Start session'}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => void stop()}
            disabled={status !== 'connected'}
            className="h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 active:opacity-80 disabled:opacity-40">
            <Text className="text-[15px] font-semibold text-white">Stop</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
