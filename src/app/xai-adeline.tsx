import { useAuth } from '@clerk/expo';
import { useRouter } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useXaiVoiceSession } from '@/features/xai-voice';
import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import { useEmployees } from '@/features/workforce/hooks/use-employees';

function callStatusLabel(status: string) {
  if (status === 'minting' || status === 'connecting') return 'Connecting…';
  if (status === 'connected') return 'On call';
  if (status === 'error') return 'Unavailable';
  return 'Ready';
}

/** Adeline voice call sheet — product UI only. */
export default function XaiAdelineScreen() {
  const router = useRouter();
  const { isSignedIn } = useAuth();
  const { data: employees = [] } = useEmployees();
  const { status, error, transcript, start, stop, employeeId } = useXaiVoiceSession();

  const adeline = employees.find((e) => e.id === employeeId);

  if (!isSignedIn) {
    return (
      <View className="flex-1 items-center justify-center bg-[#050505]">
        <Text className="text-white/50">Sign in required</Text>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top', 'bottom']}>
        <View className="flex-row items-center justify-between px-5 pt-2">
          <Pressable onPress={() => router.back()} className="active:opacity-70">
            <Text className="text-[15px] text-white/55">Close</Text>
          </Pressable>
          <Text className="text-[13px] uppercase tracking-wide text-white/35">
            Voice call
          </Text>
          <View className="w-12" />
        </View>

        <View className="mt-8 items-center px-5">
          <EmployeeAvatar
            initials={adeline?.initials ?? 'AK'}
            previewUrl={adeline?.previewUrl}
            size="md"
          />
          <Text className="mt-4 text-[28px] font-semibold text-white">
            {adeline?.name ?? 'Adeline Kalen'}
          </Text>
          <Text className="mt-2 text-center text-[15px] leading-6 text-white/45">
            Realtime voice with Adeline
          </Text>
          <Text className="mt-2 text-[13px] text-white/30">{callStatusLabel(status)}</Text>
        </View>

        {error ? (
          <Text className="mt-4 px-5 text-center text-[13px] text-red-400">
            {error.includes('web') || error.includes('browser')
              ? error
              : 'Could not start the call. Try again.'}
          </Text>
        ) : null}

        <ScrollView className="mt-6 flex-1 px-5" contentContainerClassName="gap-2 pb-4">
          {transcript.length === 0 ? (
            <Text className="text-center text-[13px] text-white/25">
              Transcript appears after you speak.
            </Text>
          ) : (
            transcript.map((line, index) => (
              <View
                key={`${line.role}-${index}`}
                className={`rounded-2xl px-3.5 py-2.5 ${
                  line.role === 'user'
                    ? 'self-end bg-white'
                    : 'self-start border border-white/10 bg-[#0B0B0B]'
                }`}>
                <Text
                  className={`text-[14px] leading-5 ${
                    line.role === 'user' ? 'text-[#050505]' : 'text-white'
                  }`}>
                  {line.text}
                </Text>
              </View>
            ))
          )}
        </ScrollView>

        <View className="flex-row gap-3 px-5 pb-4">
          <Pressable
            onPress={() => void start()}
            disabled={status === 'minting' || status === 'connecting' || status === 'connected'}
            className="h-12 flex-1 items-center justify-center rounded-2xl bg-white active:opacity-90 disabled:opacity-40">
            <Text className="text-[15px] font-semibold text-[#050505]">
              {status === 'connected' ? 'On call' : 'Start call'}
            </Text>
          </Pressable>
          <Pressable
            onPress={stop}
            disabled={status === 'idle'}
            className="h-12 flex-1 items-center justify-center rounded-2xl border border-white/15 active:opacity-80 disabled:opacity-40">
            <Text className="text-[15px] font-semibold text-white">End</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
