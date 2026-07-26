import { History, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, Text, View } from 'react-native';

import type { ChatThreadItem } from '@/features/chat/store/chat-threads';

type ChatHistoryBarProps = {
  threads: ChatThreadItem[];
  activeThreadId: string;
  expanded: boolean;
  onToggle: () => void;
  onSelect: (threadId: string) => void;
  onNewChat: () => void;
};

function ageLabel(iso: string) {
  const ms = Date.now() - new Date(iso).getTime();
  if (Number.isNaN(ms) || ms < 60_000) return 'now';
  if (ms < 3_600_000) return `${Math.floor(ms / 60_000)}m`;
  if (ms < 86_400_000) return `${Math.floor(ms / 3_600_000)}h`;
  return `${Math.floor(ms / 86_400_000)}d`;
}

export function ChatHistoryBar({
  threads,
  activeThreadId,
  expanded,
  onToggle,
  onSelect,
  onNewChat,
}: ChatHistoryBarProps) {
  const active = threads.find((item) => item.id === activeThreadId) ?? null;

  return (
    <View className="border-t border-white/10 bg-[#080808]">
      <View className="flex-row items-center gap-2 px-1 py-2">
        <Pressable
          onPress={onToggle}
          className="h-9 flex-1 flex-row items-center rounded-xl px-2 active:opacity-80">
          <History size={15} color="rgba(255,255,255,0.45)" />
          <Text className="ml-2 flex-1 text-[13px] text-white/55" numberOfLines={1}>
            {expanded
              ? 'Hide history'
              : active
                ? `${active.title} · ${active.preview}`
                : 'Chat history'}
          </Text>
          <Text className="text-[11px] text-white/30">{expanded ? '▴' : '▾'}</Text>
        </Pressable>
        <Pressable
          onPress={onNewChat}
          className="h-9 flex-row items-center rounded-full border border-white/12 px-3 active:opacity-80">
          <Plus size={14} color="#FFFFFF" />
          <Text className="ml-1.5 text-[12px] font-semibold text-white">New</Text>
        </Pressable>
      </View>

      {expanded ? (
        <ScrollView
          className="max-h-36"
          nestedScrollEnabled
          showsVerticalScrollIndicator={false}
          contentContainerClassName="gap-1.5 pb-2">
          {threads.length === 0 ? (
            <Text className="px-2 py-2 text-[12px] text-white/30">
              No saved threads yet. Send a message or start a new chat.
            </Text>
          ) : (
            threads.map((thread) => {
              const activeItem = thread.id === activeThreadId;
              return (
                <Pressable
                  key={thread.id}
                  onPress={() => onSelect(thread.id)}
                  className={`rounded-xl px-3 py-2.5 active:opacity-80 ${
                    activeItem ? 'bg-white/10' : 'bg-transparent'
                  }`}>
                  <View className="flex-row items-center justify-between">
                    <Text
                      className={`text-[13px] font-medium ${
                        activeItem ? 'text-white' : 'text-white/75'
                      }`}
                      numberOfLines={1}>
                      {thread.title}
                    </Text>
                    <Text className="ml-2 text-[11px] text-white/30">
                      {ageLabel(thread.updatedAt)}
                    </Text>
                  </View>
                  <Text className="mt-0.5 text-[12px] text-white/35" numberOfLines={1}>
                    {thread.preview}
                  </Text>
                </Pressable>
              );
            })
          )}
        </ScrollView>
      ) : null}
    </View>
  );
}
