import { useClerk, useUser } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { Bell } from 'lucide-react-native';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import { useEmployees } from '@/features/workforce/hooks/use-employees';

export default function WorkforceScreen() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();
  const { data: employees = [], isFetching, isError } = useEmployees();
  const initial = (user?.firstName?.[0] ?? user?.username?.[0] ?? 'N').toUpperCase();
  const activeCount = employees.filter((e) => e.status === 'active').length;
  const liveReady = employees.filter((e) => e.anamReady).length;

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center justify-between px-5 pb-4 pt-2">
          <Pressable
            onPress={() => signOut()}
            className="h-10 w-10 items-center justify-center rounded-full bg-[#171717] active:opacity-80">
            <Text className="text-[14px] font-semibold text-white">{initial}</Text>
          </Pressable>
          <Text className="text-[20px] font-semibold text-white">Workforce</Text>
          <Pressable className="h-10 w-10 items-center justify-center active:opacity-70">
            <Bell size={20} color="rgba(255,255,255,0.55)" />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="pb-8"
          showsVerticalScrollIndicator={false}>
          <View className="mb-5 flex-row gap-2.5">
            {(
              [
                [`${activeCount} active`, 'active'],
                [`${liveReady} live`, 'live'],
                [`${employees.length} total`, 'sessions'],
              ] as const
            ).map(([label, key]) => (
              <View
                key={key}
                className="h-16 flex-1 items-center justify-center rounded-2xl border border-white/10 bg-[#0B0B0B]">
                <Text className="text-[14px] font-medium text-white">{label}</Text>
              </View>
            ))}
          </View>

          {employees.map((employee) => (
            <Pressable
              key={employee.id}
              onPress={() => router.push(`/employee/${employee.id}` as Href)}
              className="mb-2.5 flex-row items-center rounded-2xl border border-white/10 bg-[#0B0B0B] px-3.5 py-3 active:opacity-80">
              <EmployeeAvatar initials={employee.initials} previewUrl={employee.previewUrl} />
              <View className="ml-3.5 flex-1">
                <Text className="text-[16px] font-medium text-white">{employee.name}</Text>
                <Text className="mt-0.5 text-[13px] text-white/45" numberOfLines={1}>
                  {employee.role}
                </Text>
              </View>
              <View
                className={`h-2.5 w-2.5 rounded-full ${
                  employee.anamReady ? 'bg-[#34C759]' : 'bg-white/20'
                }`}
              />
            </Pressable>
          ))}

          <View className="mt-4 flex-row items-center justify-center gap-2">
            {isFetching ? <ActivityIndicator color="rgba(255,255,255,0.35)" /> : null}
            <Text className="text-center text-[12px] text-white/30">
              {isError
                ? 'Platform sync unavailable · showing snapshot'
                : 'Synced from NULLXES platform · Anam Lab'}
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
