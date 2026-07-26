import { useAuth, useUser } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { AudioLines } from 'lucide-react-native';
import { useEffect, useMemo, useState } from 'react';
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
import { DEFAULT_EMPLOYEE_ID } from '@/features/workforce/data/employees';
import { preferredEmployeeIdForEmail } from '@/features/workforce/data/org-defaults';
import { useEmployees } from '@/features/workforce/hooks/use-employees';
import {
  availabilityLabel,
  employeeAvailable,
} from '@/features/workforce/lib/product-status';

/**
 * Center Voice tab — pick digital employee, then start Anam video Talk.
 */
export default function VoiceScreen() {
  const { getToken } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const { data: employees = [], isFetching } = useEmployees();
  const ready = useMemo(
    () => employees.filter((e) => employeeAvailable(e)),
    [employees],
  );
  const email = user?.primaryEmailAddress?.emailAddress ?? null;

  const resolveId = () => {
    const preferred = preferredEmployeeIdForEmail(email);
    if (preferred && ready.some((e) => e.id === preferred)) return preferred;
    if (ready.some((e) => e.id === DEFAULT_EMPLOYEE_ID)) return DEFAULT_EMPLOYEE_ID;
    return ready[0]?.id ?? null;
  };

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [starting, setStarting] = useState(false);

  const readyIds = ready.map((e) => e.id).join(',');

  useEffect(() => {
    setSelectedId((current) => {
      if (current && ready.some((e) => e.id === current)) return current;
      return resolveId();
    });
  }, [readyIds, email]);

  const employee = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId],
  );

  const available = employee ? employeeAvailable(employee) : false;
  const statusText = employee
    ? `Voice · ${employee.role.split(/\s+/)[0] ?? 'Assistant'} · ${availabilityLabel(employee)}`
    : 'Select an assistant';

  const startVideoTalk = () => {
    if (!employee) return;
    if (!available) {
      Alert.alert('Talk', 'This assistant is unavailable right now.');
      return;
    }

    setStarting(true);
    void requestTalkSession({ getToken, employeeId: employee.id })
      .then((session) => {
        router.push(
          `/(tabs)/live?employeeId=${session.employeeId}&talkSessionId=${session.sessionId}&voiceMode=${session.voiceMode}&autoStart=1` as Href,
        );
      })
      .catch((err) => {
        Alert.alert(
          'Talk',
          err instanceof Error ? err.message : 'Could not start video session',
        );
      })
      .finally(() => setStarting(false));
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5 pt-2">
          <Text className="text-[28px] font-semibold text-white" numberOfLines={1}>
            {employee?.name ?? 'Voice'}
          </Text>
          <View className="mt-2 flex-row items-center">
            <View
              className={`mr-1.5 h-2 w-2 rounded-full ${
                available ? 'bg-[#34C759]' : 'bg-white/25'
              }`}
            />
            <Text className="text-[15px] text-white/45" numberOfLines={1}>
              {statusText}
            </Text>
          </View>
        </View>

        <View className="flex-1 items-center justify-center px-5">
          <Pressable
            onPress={startVideoTalk}
            disabled={!employee || starting}
            className="items-center active:opacity-90 disabled:opacity-50">
            <View className="h-52 w-52 items-center justify-center rounded-full border border-white/10">
              <View className="h-48 w-48 items-center justify-center rounded-full border border-white/10">
                {employee ? (
                  <EmployeeAvatar
                    initials={employee.initials}
                    previewUrl={employee.previewUrl}
                    size="hero"
                  />
                ) : (
                  <View className="h-44 w-44 items-center justify-center rounded-full bg-[#171717]">
                    {isFetching ? (
                      <ActivityIndicator color="#FFFFFF" />
                    ) : (
                      <Text className="text-white/40">—</Text>
                    )}
                  </View>
                )}
              </View>
            </View>

            <View className="mt-8 items-center">
              {starting ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <AudioLines size={28} color="#FFFFFF" strokeWidth={1.8} />
              )}
              <Text className="mt-3 text-[16px] text-white/55">
                {starting ? 'Starting video…' : 'Tap to start video'}
              </Text>
            </View>
          </Pressable>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="max-h-24"
          contentContainerClassName="min-w-full flex-grow items-center justify-center gap-2 px-5 pb-4">
          {ready.map((item) => {
            const active = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                onPress={() => setSelectedId(item.id)}
                className={`h-10 items-center justify-center rounded-full px-3.5 ${
                  active ? 'bg-white' : 'border border-white/15 bg-transparent'
                }`}>
                <Text
                  className={`text-[13px] font-medium ${
                    active ? 'text-[#050505]' : 'text-white/75'
                  }`}>
                  {item.name.split(/\s+/)[0]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
