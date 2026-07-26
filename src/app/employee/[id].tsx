import { useAuth } from '@clerk/expo';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  MessageCircle,
  Mic,
  MoreHorizontal,
  Settings2,
  Video,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { recentForEmployee } from '@/features/activity/data/mock-activity';
import { requestTalkSession } from '@/features/talk';
import { ADELINE_KALEN_EMPLOYEE_ID } from '@/features/xai-voice';
import { getAssistantProfile } from '@/features/workforce/data/assistant-profile';
import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import { useEmployee } from '@/features/workforce/hooks/use-employees';
import {
  availabilityLabel,
  employeeAvailable,
} from '@/features/workforce/lib/product-status';

export default function EmployeeScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { getToken } = useAuth();
  const { data: employee, isLoading } = useEmployee(id ?? '');
  const [startingTalk, setStartingTalk] = useState(false);
  const [startingVoice, setStartingVoice] = useState(false);

  const profile = useMemo(
    () => getAssistantProfile(employee?.id ?? ''),
    [employee?.id],
  );
  const recent = useMemo(
    () => (employee ? recentForEmployee(employee.name) : []),
    [employee],
  );

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

  const available = employeeAvailable(employee);
  const statusLabel = availabilityLabel(employee);
  const isAdeline = employee.id === ADELINE_KALEN_EMPLOYEE_ID;

  /** Talk / avatar tap → Anam video Live (auto-start). */
  const startTalk = () => {
    if (!available) {
      Alert.alert('Talk', 'This assistant is unavailable right now.');
      return;
    }
    setStartingTalk(true);
    void requestTalkSession({ getToken, employeeId: employee.id })
      .then((session) => {
        router.push(
          `/(tabs)/live?employeeId=${session.employeeId}&talkSessionId=${session.sessionId}&voiceMode=${session.voiceMode}&autoStart=1` as Href,
        );
      })
      .catch((err) => {
        Alert.alert(
          'Talk',
          err instanceof Error ? err.message : 'Could not start session',
        );
      })
      .finally(() => setStartingTalk(false));
  };

  /** Voice → Adeline sheet, otherwise same Live video path. */
  const startVoice = () => {
    if (!available) {
      Alert.alert('Voice', 'This assistant is unavailable right now.');
      return;
    }
    if (isAdeline) {
      router.push('/xai-adeline' as Href);
      return;
    }
    setStartingVoice(true);
    void requestTalkSession({ getToken, employeeId: employee.id })
      .then((session) => {
        router.push(
          `/(tabs)/live?employeeId=${session.employeeId}&talkSessionId=${session.sessionId}&voiceMode=${session.voiceMode}&autoStart=1` as Href,
        );
      })
      .catch((err) => {
        Alert.alert(
          'Voice',
          err instanceof Error ? err.message : 'Could not start voice session',
        );
      })
      .finally(() => setStartingVoice(false));
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-4 pb-3 pt-1">
          <Pressable
            onPress={() => router.back()}
            className="h-10 w-10 items-center justify-center active:opacity-70">
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>
          <Text className="text-[17px] font-medium text-white">Digital employee</Text>
          <Pressable className="h-10 w-10 items-center justify-center active:opacity-70">
            <MoreHorizontal size={22} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>

        <ScrollView className="flex-1 px-5" contentContainerClassName="pb-10">
          <View className="overflow-hidden rounded-3xl border border-white/10 bg-[#0B0B0B]">
            <Pressable
              onPress={startTalk}
              disabled={startingTalk}
              className="active:opacity-90 disabled:opacity-50">
              <EmployeeAvatar
                initials={employee.initials}
                previewUrl={employee.previewUrl}
                size="lg"
              />
            </Pressable>
            <View className="px-4 pb-4 pt-3">
              <Text className="text-[22px] font-semibold text-white">{employee.name}</Text>
              <Text className="mt-1 text-[14px] text-white/50" numberOfLines={2}>
                {employee.role}
              </Text>
              <View className="mt-2 flex-row items-center">
                <View
                  className={`mr-1.5 h-2 w-2 rounded-full ${
                    available ? 'bg-[#34C759]' : 'bg-white/25'
                  }`}
                />
                <Text className="text-[14px] text-white/50">
                  {available ? 'Active' : 'Idle'} · {statusLabel}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-4 flex-row gap-3">
            <Pressable
              onPress={startTalk}
              disabled={startingTalk}
              className="h-14 flex-1 flex-row items-center justify-center rounded-2xl bg-white active:opacity-90 disabled:opacity-40">
              {startingTalk ? (
                <ActivityIndicator color="#050505" />
              ) : (
                <>
                  <Video size={18} color="#050505" />
                  <Text className="ml-2 text-[16px] font-semibold text-[#050505]">Talk</Text>
                </>
              )}
            </Pressable>
            <Pressable
              onPress={startVoice}
              disabled={startingVoice}
              className="h-14 flex-1 flex-row items-center justify-center rounded-2xl border border-white/15 bg-[#0B0B0B] active:opacity-80 disabled:opacity-40">
              {startingVoice ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <>
                  <Mic size={18} color="#FFFFFF" />
                  <Text className="ml-2 text-[16px] font-semibold text-white">Voice</Text>
                </>
              )}
            </Pressable>
          </View>

          <Pressable
            onPress={() =>
              router.push(`/(tabs)/chat?employeeId=${employee.id}` as Href)
            }
            className="mt-3 h-14 flex-row items-center justify-center rounded-2xl border border-white/15 bg-[#0B0B0B] active:opacity-80">
            <MessageCircle size={18} color="#FFFFFF" />
            <Text className="ml-2 text-[16px] font-semibold text-white">Chat</Text>
          </Pressable>

          <View className="mt-4 flex-row flex-wrap gap-2">
            {(
              [
                ['Avatar', available],
                ['Voice', Boolean(employee.voiceId) || available],
                ['Brain', true],
              ] as const
            ).map(([label, ready]) => (
              <View
                key={label}
                className="flex-row items-center rounded-full border border-white/12 bg-[#0B0B0B] px-3 py-1.5">
                <View
                  className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                    ready ? 'bg-[#34C759]' : 'bg-white/25'
                  }`}
                />
                <Text className="text-[13px] text-white/70">{label}</Text>
              </View>
            ))}
          </View>

          <View className="mt-6 gap-3">
            <MetaRow label="Character preset" value={profile.characterPreset} />
            <MetaRow label="Active skills" value={String(profile.activeSkills)} />
            <MetaRow label="Knowledge sources" value={String(profile.knowledgeSources)} />
          </View>

          <Pressable
            onPress={() =>
              router.push(`/employee/configure/${employee.id}` as Href)
            }
            className="mt-6 h-14 flex-row items-center justify-between rounded-2xl border border-white/12 bg-[#0B0B0B] px-4 active:opacity-80">
            <View className="flex-row items-center">
              <Settings2 size={18} color="#FFFFFF" />
              <Text className="ml-2.5 text-[16px] font-semibold text-white">Configure</Text>
            </View>
            <Text className="text-[16px] text-white/35">›</Text>
          </Pressable>

          <Text className="mb-3 mt-8 text-[12px] font-semibold tracking-[1.5px] text-white/35">
            RECENT
          </Text>
          {recent.map((item) => (
            <View key={item.id} className="mb-4 border-b border-white/10 pb-4">
              <View className="flex-row items-start justify-between">
                <Text className="flex-1 pr-3 text-[15px] font-medium text-white">
                  {item.title}
                </Text>
                <Text className="text-[13px] text-white/35">{item.age}</Text>
              </View>
              <Text className="mt-1 text-[13px] text-white/40">{item.detail}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View className="flex-row items-center justify-between border-b border-white/10 pb-3">
      <Text className="text-[14px] text-white/40">{label}</Text>
      <Text className="text-[14px] text-white/80">{value}</Text>
    </View>
  );
}
