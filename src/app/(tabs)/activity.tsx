import { useMemo, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  MOCK_ACTIVITY,
  type ActivityFilter,
} from '@/features/activity/data/mock-activity';

const FILTERS: { key: ActivityFilter; label: string }[] = [
  { key: 'activity', label: 'Activity' },
  { key: 'live', label: 'Live' },
  { key: 'overnight', label: 'Overnight' },
];

export default function ActivityScreen() {
  const [filter, setFilter] = useState<ActivityFilter>('activity');

  const items = useMemo(
    () => MOCK_ACTIVITY.filter((item) => item.filter === filter),
    [filter],
  );

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <Text className="px-5 pb-4 pt-2 text-[28px] font-semibold text-white">Activity</Text>

        <View className="mb-5 flex-row gap-2 px-5">
          {FILTERS.map((item) => {
            const active = filter === item.key;
            return (
              <Pressable
                key={item.key}
                onPress={() => setFilter(item.key)}
                className={`rounded-full px-4 py-2 ${
                  active ? 'bg-[#1A1A1A]' : 'bg-transparent'
                }`}>
                <Text
                  className={`text-[14px] font-medium ${
                    active ? 'text-white' : 'text-white/40'
                  }`}>
                  {item.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <ScrollView className="flex-1 px-5" contentContainerClassName="pb-8">
          {items.map((item) => (
            <View
              key={item.id}
              className="mb-4 flex-row border-b border-white/10 pb-4">
              <View className="flex-1 pr-3">
                <Text className="text-[16px] font-medium text-white">{item.title}</Text>
                <Text className="mt-1 text-[13px] text-white/40">{item.detail}</Text>
              </View>
              <Text className="text-[13px] text-white/35">{item.age}</Text>
            </View>
          ))}
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
