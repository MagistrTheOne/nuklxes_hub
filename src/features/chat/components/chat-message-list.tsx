import { FlatList, Text, View } from 'react-native';

import type { ChatBubble } from '@/features/chat/types';

export function ChatMessageList({ messages }: { messages: ChatBubble[] }) {
  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      className="flex-1"
      contentContainerClassName="gap-2.5 px-5 pb-4 pt-2"
      inverted={false}
      ListEmptyComponent={
        <Text className="mt-8 text-center text-[13px] text-white/30">
          No messages yet. Say hello.
        </Text>
      }
      renderItem={({ item }) => {
        const mine = item.role === 'user';
        return (
          <View className={`w-full flex-row ${mine ? 'justify-end' : 'justify-start'}`}>
            <View
              className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 ${
                mine
                  ? 'bg-white'
                  : 'border border-white/10 bg-[#0B0B0B]'
              }`}>
              <Text
                className={`text-[15px] leading-5 ${
                  mine ? 'text-[#050505]' : 'text-white'
                }`}>
                {item.text}
              </Text>
            </View>
          </View>
        );
      }}
    />
  );
}
