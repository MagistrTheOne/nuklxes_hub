import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonaStage } from '@/features/anam/components/persona-stage';
import { usePersonaSession } from '@/features/anam/hooks/use-persona-session';
import {
  DEFAULT_EMPLOYEE_ID,
  DIGITAL_EMPLOYEES,
  getEmployee,
} from '@/features/workforce/data/employees';

function resolveEmployeeId(paramId?: string) {
  return typeof paramId === 'string' && getEmployee(paramId)?.anamReady
    ? paramId
    : DEFAULT_EMPLOYEE_ID;
}

export default function LiveScreen() {
  const { employeeId: paramId } = useLocalSearchParams<{ employeeId?: string }>();
  const [selectedId, setSelectedId] = useState(() => resolveEmployeeId(paramId));

  useEffect(() => {
    setSelectedId(resolveEmployeeId(paramId));
  }, [paramId]);

  const employee = useMemo(() => getEmployee(selectedId), [selectedId]);
  const { status, error, start, stop, isWeb } = usePersonaSession({
    employeeId: selectedId,
  });

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5">
          <Text className="pt-2 text-[28px] font-semibold text-white">Live</Text>
          <Text className="mt-2 text-[15px] leading-6 text-white/45">
            {employee?.name ?? 'Persona'} · slot {employee?.anamSlot ?? '—'}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 max-h-11"
          contentContainerClassName="gap-2 px-5">
          {DIGITAL_EMPLOYEES.filter((e) => e.anamReady).map((item) => {
            const active = item.id === selectedId;
            return (
              <Pressable
                key={item.id}
                onPress={() => {
                  if (status === 'connected') void stop();
                  setSelectedId(item.id);
                }}
                className={`h-9 items-center justify-center rounded-full px-3.5 ${
                  active ? 'bg-white' : 'border border-white/15 bg-transparent'
                }`}>
                <Text
                  className={`text-[13px] font-medium ${
                    active ? 'text-[#050505]' : 'text-white/70'
                  }`}>
                  {item.name.split(' ')[0]}
                </Text>
              </Pressable>
            );
          })}
        </ScrollView>

        <View className="mt-5 px-5">
          <View className="overflow-hidden rounded-3xl border border-white/10">
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
        </View>
      </SafeAreaView>
    </View>
  );
}
