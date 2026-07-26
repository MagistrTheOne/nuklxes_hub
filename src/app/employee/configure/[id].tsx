import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ArrowLeft,
  BookOpen,
  Brain,
  CheckSquare,
  Diamond,
  RefreshCw,
  ScanFace,
  SlidersHorizontal,
  Sparkles,
  UserRound,
  Volume2,
} from 'lucide-react-native';
import type { ComponentType } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getAssistantProfile } from '@/features/workforce/data/assistant-profile';
import { useEmployee } from '@/features/workforce/hooks/use-employees';
import { employeeAvailable } from '@/features/workforce/lib/product-status';

type Row = {
  key: string;
  label: string;
  value?: string;
  Icon: ComponentType<{ size?: number; color?: string }>;
};

export default function ConfigureScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { data: employee } = useEmployee(id ?? '');
  const profile = getAssistantProfile(id ?? '');
  const available = employee ? employeeAvailable(employee) : false;
  const shortName = employee?.name.split(/\s+/)[0] ?? 'Back';

  const rows: Row[] = [
    { key: 'customization', label: 'Customization', Icon: UserRound },
    {
      key: 'avatar',
      label: 'Avatar',
      value: available ? 'ready' : 'pending',
      Icon: ScanFace,
    },
    {
      key: 'voice',
      label: 'Voice',
      value: employee?.voiceId || available ? 'ready' : 'pending',
      Icon: Volume2,
    },
    {
      key: 'brain',
      label: 'Brain',
      value: profile.brainLabel,
      Icon: Brain,
    },
    {
      key: 'knowledge',
      label: 'Knowledge',
      value: `${profile.knowledgeSources} source${profile.knowledgeSources === 1 ? '' : 's'}`,
      Icon: BookOpen,
    },
    { key: 'tasks', label: 'Tasks', Icon: CheckSquare },
    {
      key: 'character',
      label: 'Character',
      value: profile.characterPreset,
      Icon: Sparkles,
    },
    {
      key: 'skills',
      label: 'Skills',
      value: String(profile.activeSkills),
      Icon: SlidersHorizontal,
    },
    { key: 'tools', label: 'Tools', Icon: Diamond },
    { key: 'lifecycle', label: 'Lifecycle', Icon: RefreshCw },
  ];

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center px-4 pb-2 pt-1">
          <Pressable
            onPress={() => router.back()}
            className="h-10 flex-row items-center active:opacity-70">
            <ArrowLeft size={20} color="#FFFFFF" />
            <Text className="ml-1 text-[16px] text-white">{shortName}</Text>
          </Pressable>
        </View>

        <Text className="px-5 pb-4 text-[28px] font-semibold text-white">Configure</Text>

        <ScrollView className="flex-1 px-5" contentContainerClassName="pb-10">
          {rows.map((row) => (
            <Pressable
              key={row.key}
              onPress={() =>
                Alert.alert(row.label, 'Configuration detail coming soon.')
              }
              className="mb-1 flex-row items-center border-b border-white/10 py-4 active:opacity-70">
              <row.Icon size={20} color="rgba(255,255,255,0.75)" />
              <Text className="ml-3.5 flex-1 text-[16px] text-white">{row.label}</Text>
              {row.value ? (
                <Text className="mr-2 text-[14px] text-white/40">{row.value}</Text>
              ) : null}
              <Text className="text-[16px] text-white/30">›</Text>
            </Pressable>
          ))}

          <Pressable
            onPress={() => router.replace(`/employee/${id}` as Href)}
            className="mt-8 h-12 items-center justify-center rounded-2xl border border-white/12 active:opacity-80">
            <Text className="text-[15px] font-medium text-white/70">Done</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
