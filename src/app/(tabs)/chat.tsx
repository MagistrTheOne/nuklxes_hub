import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatMessageList } from '@/features/chat/components/chat-message-list';
import { useEmployeeChat } from '@/features/chat/hooks/use-employee-chat';
import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import { DEFAULT_EMPLOYEE_ID } from '@/features/workforce/data/employees';
import { useEmployees } from '@/features/workforce/hooks/use-employees';

/**
 * Stream Chat history sync + custom UI.
 * Cognition = Hub brain-stream. No Stream Video / default Stream chrome.
 */
export default function ChatScreen() {
  const { data: employees = [] } = useEmployees();
  const ready = useMemo(() => employees.filter((e) => e.anamReady), [employees]);
  const [selectedId, setSelectedId] = useState(
    () =>
      (ready.some((e) => e.id === DEFAULT_EMPLOYEE_ID)
        ? DEFAULT_EMPLOYEE_ID
        : ready[0]?.id) ?? null,
  );
  const [draft, setDraft] = useState('');

  const employee = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId],
  );

  const { status, error, messages, connect, send } = useEmployeeChat(selectedId);

  const onSend = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    void send(text);
  };

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="px-5">
          <Text className="pt-2 text-[28px] font-semibold text-white">Chat</Text>
          <Text className="mt-2 text-[15px] leading-6 text-white/45">
            Stream history · Hub brain · custom controls
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
                onPress={() => setSelectedId(item.id)}
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

        <View className="mt-4 flex-row items-center gap-3 px-5">
          {employee ? (
            <EmployeeAvatar
              initials={employee.initials}
              previewUrl={employee.previewUrl}
            />
          ) : null}
          <View className="flex-1">
            <Text className="text-[16px] font-medium text-white">
              {employee?.name ?? 'Select employee'}
            </Text>
            <Text className="mt-0.5 text-[13px] text-white/40">
              Status: {status}
            </Text>
          </View>
          <Pressable
            onPress={() => void connect()}
            disabled={!selectedId || status === 'connecting' || status === 'sending'}
            className="h-10 items-center justify-center rounded-xl bg-white px-3.5 active:opacity-90 disabled:opacity-40">
            {status === 'connecting' ? (
              <ActivityIndicator color="#050505" />
            ) : (
              <Text className="text-[13px] font-semibold text-[#050505]">
                {status === 'ready' ? 'Reconnect' : 'Connect'}
              </Text>
            )}
          </Pressable>
        </View>

        {error ? (
          <Text className="mt-3 px-5 text-[13px] text-red-400">{error}</Text>
        ) : null}

        <View className="mt-3 flex-1">
          <ChatMessageList messages={messages} />
        </View>

        <View className="flex-row items-end gap-2 border-t border-white/10 px-5 py-3">
          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={status === 'ready' || status === 'sending'}
            placeholder={
              status === 'ready' || status === 'sending'
                ? 'Message…'
                : 'Connect to start'
            }
            placeholderTextColor="rgba(255,255,255,0.28)"
            multiline
            className="min-h-11 max-h-28 flex-1 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-[15px] text-white"
          />
          <Pressable
            onPress={onSend}
            disabled={status !== 'ready' || !draft.trim()}
            className="h-11 items-center justify-center rounded-2xl bg-white px-4 active:opacity-90 disabled:opacity-35">
            {status === 'sending' ? (
              <ActivityIndicator color="#050505" />
            ) : (
              <Text className="text-[14px] font-semibold text-[#050505]">Send</Text>
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
