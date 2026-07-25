import { useAuth } from '@clerk/expo';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, MessageSquare, Video } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { requestTalkSession } from '@/features/talk';
import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import { useEmployee } from '@/features/workforce/hooks/use-employees';

export default function EmployeeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { data: employee, isLoading } = useEmployee(id ?? '');
  const [startingTalk, setStartingTalk] = useState(false);

  if (isLoading && !employee) {
    return (
      <View className="flex-1 items-center justify-center bg-[#050505]">
        <ActivityIndicator color="#FFFFFF" />
      </View>
    );
  }

  if (!employee) {
    return (
      <View className="flex-1 items-center justify-center bg-[#050505]">
        <Text className="text-white/55">Employee not found</Text>
        <Pressable onPress={() => router.back()} className="mt-4">
          <Text className="text-white">Back</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-4 pb-3 pt-1">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center active:opacity-70">
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="ml-1 text-[17px] font-medium text-white">Digital employee</Text>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerClassName="pb-10">
          <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B0B0B]">
            <EmployeeAvatar
              initials={employee.initials}
              previewUrl={employee.previewUrl}
              size="lg"
            />
            <View className="px-4 pb-4 pt-3">
              <Text className="text-[22px] font-semibold text-white">{employee.name}</Text>
              <View className="mt-1.5 flex-row items-center">
                <Text className="flex-1 text-[14px] text-white/50" numberOfLines={2}>
                  {employee.role}
                </Text>
              </View>
              <View className="mt-2 flex-row items-center">
                <View
                  className={`mr-1.5 h-2 w-2 rounded-full ${
                    employee.anamReady ? 'bg-[#34C759]' : 'bg-white/25'
                  }`}
                />
                <Text className="text-[14px] text-white/50">
                  {employee.anamReady ? 'live ready' : 'slot pending'}
                </Text>
              </View>
              <Text className="mt-2 text-[12px] text-white/30">
                voiceMode={employee.voiceMode}
                {employee.anamSlot ? ` · ${employee.anamSlot}` : ''}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={() => {
              if (!employee.anamReady) {
                Alert.alert('Talk', 'Anam persona not ready on this slot yet.');
                return;
              }
              setStartingTalk(true);
              void requestTalkSession({ getToken, employeeId: employee.id })
                .then((session) => {
                  router.push(
                    `/(tabs)/live?employeeId=${session.employeeId}&talkSessionId=${session.sessionId}&voiceMode=${session.voiceMode}` as Href,
                  );
                })
                .catch((err) => {
                  Alert.alert(
                    'Talk',
                    err instanceof Error ? err.message : 'Talk bootstrap failed',
                  );
                })
                .finally(() => setStartingTalk(false));
            }}
            disabled={startingTalk}
            className="mt-4 h-14 flex-row items-center justify-center rounded-2xl bg-white active:opacity-90 disabled:opacity-40">
            {startingTalk ? (
              <ActivityIndicator color="#050505" />
            ) : (
              <>
                <MessageSquare size={18} color="#050505" />
                <Text className="ml-2 text-[16px] font-semibold text-[#050505]">Talk</Text>
              </>
            )}
          </Pressable>

          <Pressable
            onPress={() => {
              if (!employee.anamReady) {
                Alert.alert('Live', 'Anam persona not ready on this slot yet.');
                return;
              }
              router.push(
                `/(tabs)/live?employeeId=${employee.id}&voiceMode=${employee.voiceMode}` as Href,
              );
            }}
            className="mt-3 h-14 flex-row items-center justify-center rounded-2xl border border-white/15 bg-[#0B0B0B] active:opacity-80">
            <Video size={18} color="#FFFFFF" />
            <Text className="ml-2 text-[16px] font-semibold text-white">Live</Text>
          </Pressable>

          <Text className="mb-3 mt-8 text-[12px] font-semibold tracking-[1.5px] text-white/35">
            ANAM
          </Text>
          <View className="mb-4 border-b border-white/10 pb-4">
            <Text className="text-[13px] text-white/40">personaId</Text>
            <Text className="mt-1 text-[13px] text-white/70">{employee.personaId ?? '—'}</Text>
          </View>
          <View className="border-b border-white/10 pb-4">
            <Text className="text-[13px] text-white/40">avatarId</Text>
            <Text className="mt-1 text-[13px] text-white/70">{employee.avatarId ?? '—'}</Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
