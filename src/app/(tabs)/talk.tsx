import { useAuth } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ADELINE_KALEN_EMPLOYEE_ID } from '@/features/xai-voice';
import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import { useEmployees } from '@/features/workforce/hooks/use-employees';
import { requestTalkSession } from '@/features/talk';

/**
 * Talk bootstrap → Live with Anam face.
 * Adeline also has a separate xAI Grok Voice sheet (not Anam).
 */
export default function TalkScreen() {
  const { getToken } = useAuth();
  const router = useRouter();
  const { data: employees = [] } = useEmployees();
  const ready = employees.filter((e) => e.anamReady);
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startTalk = async (employeeId: string) => {
    setError(null);
    setLoadingId(employeeId);
    try {
      const session = await requestTalkSession({ getToken, employeeId });
      router.push(
        `/(tabs)/live?employeeId=${session.employeeId}&talkSessionId=${session.sessionId}&voiceMode=${session.voiceMode}` as Href,
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Talk bootstrap failed');
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1 px-5" edges={['top']}>
        <Text className="pt-2 text-[28px] font-semibold text-white">Talk</Text>
        <Text className="mt-2 text-[15px] leading-6 text-white/45">
          Anam face + Hub brain + ElevenLabs mouth
        </Text>
        <Text className="mt-1 text-[13px] text-white/30">
          Adeline also has a separate xAI Grok Voice call
        </Text>

        {error ? <Text className="mt-4 text-[13px] text-red-400">{error}</Text> : null}

        <Pressable
          onPress={() => router.push('/xai-adeline' as Href)}
          className="mt-5 rounded-2xl border border-white/12 bg-[#0B0B0B] px-4 py-3.5 active:opacity-80">
          <Text className="text-[15px] font-medium text-white">Adeline · Grok Voice</Text>
          <Text className="mt-1 text-[13px] text-white/40">
            xAI realtime · not Anam · web audio
          </Text>
        </Pressable>

        <ScrollView className="mt-5 flex-1" contentContainerClassName="pb-10">
          {ready.map((employee) => {
            const loading = loadingId === employee.id;
            const isAdeline = employee.id === ADELINE_KALEN_EMPLOYEE_ID;
            return (
              <Pressable
                key={employee.id}
                onPress={() => void startTalk(employee.id)}
                disabled={Boolean(loadingId)}
                className="mb-2.5 flex-row items-center rounded-2xl border border-white/10 bg-[#0B0B0B] px-3.5 py-3 active:opacity-80 disabled:opacity-40">
                <EmployeeAvatar initials={employee.initials} previewUrl={employee.previewUrl} />
                <View className="ml-3.5 flex-1">
                  <Text className="text-[16px] font-medium text-white">{employee.name}</Text>
                  <Text className="mt-0.5 text-[13px] text-white/45">
                    Anam Talk · {employee.voiceMode}
                    {isAdeline ? ' · + Grok Voice sheet' : ''}
                  </Text>
                </View>
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text className="text-[13px] font-medium text-white/50">Start</Text>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
