import { Pressable, ScrollView, Text, View } from 'react-native';

import type { ChatThreadItem } from '@/features/chat/store/chat-threads';
import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import type { DigitalEmployee } from '@/features/workforce/types';

export type ChatInboxRow = {
  employee: DigitalEmployee;
  preview: string;
  updatedAt: string | null;
};

type ChatInboxListProps = {
  rows: ChatInboxRow[];
  onOpen: (employeeId: string) => void;
};

function ageLabel(iso: string | null) {
  if (!iso) return '';
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 60_000) return 'now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

export function ChatInboxList({ rows, onOpen }: ChatInboxListProps) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="px-4 pb-6 pt-2"
      showsVerticalScrollIndicator={false}>
      {rows.length === 0 ? (
        <Text className="mt-16 text-center text-[14px] text-white/35">
          No assistants available yet
        </Text>
      ) : (
        rows.map(({ employee, preview, updatedAt }) => (
          <Pressable
            key={employee.id}
            onPress={() => onOpen(employee.id)}
            className="flex-row items-center border-b border-white/8 py-3.5 active:opacity-80">
            <EmployeeAvatar
              initials={employee.initials}
              previewUrl={employee.previewUrl}
              size="sm"
            />
            <View className="ml-3.5 min-w-0 flex-1">
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 pr-3 text-[16px] font-medium text-white" numberOfLines={1}>
                  {employee.name}
                </Text>
                <Text className="text-[12px] text-white/30">{ageLabel(updatedAt)}</Text>
              </View>
              <Text className="mt-1 text-[14px] text-white/40" numberOfLines={1}>
                {preview}
              </Text>
            </View>
          </Pressable>
        ))
      )}
    </ScrollView>
  );
}

/** Prefer main-thread preview for inbox rows. */
export function inboxPreviewForEmployee(
  employeeId: string,
  threads: ChatThreadItem[],
): { preview: string; updatedAt: string | null } {
  const main = threads.find((t) => t.employeeId === employeeId && t.id === 'main');
  const newest = threads
    .filter((t) => t.employeeId === employeeId)
    .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())[0];
  const hit = main ?? newest;
  if (!hit) {
    return { preview: 'Start a conversation', updatedAt: null };
  }
  return { preview: hit.preview, updatedAt: hit.updatedAt };
}
