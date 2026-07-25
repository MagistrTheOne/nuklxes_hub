import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { PersonaStage } from '@/features/anam/components/persona-stage';
import { usePersonaSession } from '@/features/anam/hooks/use-persona-session';
import { DEFAULT_EMPLOYEE_ID } from '@/features/workforce/data/employees';
import { useEmployees } from '@/features/workforce/hooks/use-employees';

export default function LiveScreen() {
  const { employeeId: paramId, voiceMode: talkVoiceMode } = useLocalSearchParams<{
    employeeId?: string;
    talkSessionId?: string;
    voiceMode?: string;
  }>();
  const { data: employees = [] } = useEmployees();
  const ready = useMemo(() => employees.filter((e) => e.anamReady), [employees]);

  const resolveId = (id?: string) => {
    if (typeof id === 'string' && ready.some((e) => e.id === id)) return id;
    if (ready.some((e) => e.id === DEFAULT_EMPLOYEE_ID)) return DEFAULT_EMPLOYEE_ID;
    return ready[0]?.id ?? DEFAULT_EMPLOYEE_ID;
  };

  const [selectedId, setSelectedId] = useState(() => resolveId(paramId));

  const readyIds = ready.map((e) => e.id).join(',');

  useEffect(() => {
    setSelectedId(resolveId(paramId));
  }, [paramId, readyIds]);

  const employee = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId],
  );
  const { status, error, start, stop, isWeb } = usePersonaSession({
    employeeId: selectedId,
  });

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5">
          <Text className="pt-2 text-[28px] font-semibold text-white">Live</Text>
          <Text className="mt-2 text-[15px] leading-6 text-white/45">
            {employee?.name ?? 'Persona'} · Anam
            {` · voice=${typeof talkVoiceMode === 'string' ? talkVoiceMode : employee?.voiceMode ?? 'anam'}`}
          </Text>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-4 max-h-11"
          contentContainerClassName="gap-2 px-5">
          {ready.map((item) => {
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
