import { useUser } from '@clerk/expo';
import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatHistoryBar } from '@/features/chat/components/chat-history-bar';
import { ChatMessageList } from '@/features/chat/components/chat-message-list';
import { useEmployeeChat } from '@/features/chat/hooks/use-employee-chat';
import {
  createThreadId,
  useChatThreadsStore,
} from '@/features/chat/store/chat-threads';
import { EmployeeAvatar } from '@/features/workforce/components/employee-avatar';
import { DEFAULT_EMPLOYEE_ID } from '@/features/workforce/data/employees';
import { preferredEmployeeIdForEmail } from '@/features/workforce/data/org-defaults';
import { useEmployees } from '@/features/workforce/hooks/use-employees';
import { employeeAvailable } from '@/features/workforce/lib/product-status';

export default function ChatScreen() {
  const { user } = useUser();
  const { employeeId: paramId } = useLocalSearchParams<{ employeeId?: string }>();
  const { data: employees = [] } = useEmployees();
  const ready = useMemo(
    () => employees.filter((e) => employeeAvailable(e)),
    [employees],
  );

  const email = user?.primaryEmailAddress?.emailAddress ?? null;
  const touchThread = useChatThreadsStore((s) => s.touch);
  const allThreads = useChatThreadsStore((s) => s.threads);

  const resolveId = (id?: string) => {
    if (typeof id === 'string' && ready.some((e) => e.id === id)) return id;
    const preferred = preferredEmployeeIdForEmail(email);
    if (preferred && ready.some((e) => e.id === preferred)) return preferred;
    if (ready.some((e) => e.id === DEFAULT_EMPLOYEE_ID)) return DEFAULT_EMPLOYEE_ID;
    return ready[0]?.id ?? null;
  };

  const [selectedId, setSelectedId] = useState(() => resolveId(paramId));
  const [threadId, setThreadId] = useState('main');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const sendingLock = useRef(false);

  const readyIds = ready.map((e) => e.id).join(',');

  useEffect(() => {
    setSelectedId(resolveId(paramId));
    setThreadId('main');
    setHistoryOpen(false);
  }, [paramId, readyIds, email]);

  const employee = useMemo(
    () => employees.find((e) => e.id === selectedId) ?? null,
    [employees, selectedId],
  );

  const online = employee ? employeeAvailable(employee) : false;
  const {
    status,
    error,
    messages,
    connect,
    send,
    updateMessage,
    deleteMessage,
  } = useEmployeeChat(selectedId, threadId === 'main' ? null : threadId);

  const employeeThreads = useMemo(() => {
    const list = allThreads.filter((item) => item.employeeId === selectedId);
    if (!list.some((item) => item.id === 'main') && selectedId) {
      return [
        {
          id: 'main',
          employeeId: selectedId,
          title: 'Main chat',
          preview: 'Primary thread with this assistant',
          updatedAt: new Date(0).toISOString(),
        },
        ...list,
      ];
    }
    return list;
  }, [allThreads, selectedId]);

  // Keep history preview in sync with the open thread.
  useEffect(() => {
    if (!selectedId || status !== 'ready') return;
    const last = messages[messages.length - 1];
    const firstUser = messages.find((item) => item.role === 'user');
    touchThread({
      id: threadId,
      employeeId: selectedId,
      title:
        threadId === 'main'
          ? 'Main chat'
          : firstUser?.text.slice(0, 42) || 'New chat',
      preview: last?.text ?? 'No messages yet',
    });
  }, [messages, selectedId, status, threadId, touchThread]);

  const canSend =
    (status === 'ready' || status === 'sending') &&
    Boolean(draft.trim()) &&
    !sendingLock.current;

  const onSend = () => {
    if (status === 'sending' || sendingLock.current) return;
    const text = draft.trim();
    if (!text || (status !== 'ready' && status !== 'sending')) return;

    sendingLock.current = true;
    setDraft('');
    void send(text).finally(() => {
      sendingLock.current = false;
    });
  };

  const syncLabel =
    status === 'connecting'
      ? 'Connecting…'
      : status === 'sending'
        ? 'Sending…'
        : status === 'error'
          ? 'Unavailable'
          : status === 'ready'
            ? online
              ? 'Online'
              : 'Offline'
            : online
              ? 'Online'
              : 'Offline';

  const assistantLabel = employee?.name?.split(/\s+/).slice(0, 2).join(' ') ?? 'Assistant';

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="w-full flex-1 items-center">
          <View className="w-full max-w-[560px] flex-1 self-center px-4">
            <View className="items-center pt-2">
              <Text className="text-[28px] font-semibold text-white">Chat</Text>
              <Text className="mt-2 text-center text-[15px] leading-6 text-white/45">
                Message your digital employees
              </Text>
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-4 max-h-11"
              contentContainerClassName="min-w-full flex-grow items-center justify-center gap-2">
              {ready.map((item) => {
                const active = item.id === selectedId;
                return (
                  <Pressable
                    key={item.id}
                    onPress={() => {
                      setSelectedId(item.id);
                      setThreadId('main');
                      setHistoryOpen(false);
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

            <View className="mt-4 flex-row items-center justify-center gap-3">
              {employee ? (
                <EmployeeAvatar
                  initials={employee.initials}
                  previewUrl={employee.previewUrl}
                />
              ) : null}
              <View className="max-w-[70%]">
                <Text className="text-[16px] font-medium text-white" numberOfLines={1}>
                  {employee?.name ?? 'Select employee'}
                </Text>
                <View className="mt-1 flex-row items-center">
                  <View
                    className={`mr-1.5 h-2 w-2 rounded-full ${
                      online && status === 'ready' ? 'bg-[#34C759]' : 'bg-white/25'
                    }`}
                  />
                  <Text className="text-[13px] text-white/40">{syncLabel}</Text>
                </View>
              </View>
              {status === 'connecting' ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : status === 'error' ? (
                <Pressable
                  onPress={() => void connect()}
                  className="h-10 items-center justify-center rounded-xl border border-white/15 px-3.5 active:opacity-80">
                  <Text className="text-[13px] font-semibold text-white">Retry</Text>
                </Pressable>
              ) : null}
            </View>

            {error ? (
              <Text className="mt-3 text-center text-[13px] text-red-400">
                {error.includes('owned')
                  ? 'Could not sync this thread. Retry.'
                  : 'Could not complete that action. Try again.'}
              </Text>
            ) : null}

            <View className="mt-3 flex-1">
              <ChatMessageList
                messages={messages}
                assistantName={assistantLabel}
                onUpdate={updateMessage}
                onDelete={deleteMessage}
              />
            </View>

            <ChatHistoryBar
              threads={employeeThreads}
              activeThreadId={threadId}
              expanded={historyOpen}
              onToggle={() => setHistoryOpen((open) => !open)}
              onSelect={(id) => {
                setThreadId(id);
                setHistoryOpen(false);
              }}
              onNewChat={() => {
                if (!selectedId) return;
                const id = createThreadId();
                touchThread({
                  id,
                  employeeId: selectedId,
                  title: 'New chat',
                  preview: 'Empty thread',
                });
                setThreadId(id);
                setHistoryOpen(true);
              }}
            />

            <View className="border-t border-white/10 py-3">
              <View className="mb-2 flex-row items-center justify-between px-1">
                <Text className="text-[11px] tracking-[0.6px] text-white/30">YOU</Text>
                <Text className="text-[11px] tracking-[0.6px] text-white/30">
                  {assistantLabel.toUpperCase()}
                </Text>
              </View>
              <View className="flex-row items-end gap-2">
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  editable={status === 'ready' || status === 'sending'}
                  placeholder={
                    status === 'ready' || status === 'sending'
                      ? 'Write as You…'
                      : status === 'error'
                        ? 'Retry to chat'
                        : 'Opening chat…'
                  }
                  placeholderTextColor="rgba(255,255,255,0.28)"
                  multiline={Platform.OS !== 'web'}
                  blurOnSubmit={Platform.OS === 'web'}
                  returnKeyType="send"
                  onSubmitEditing={() => {
                    if (Platform.OS === 'web') return;
                    onSend();
                  }}
                  onKeyPress={(event: NativeSyntheticEvent<TextInputKeyPressEventData>) => {
                    if (Platform.OS !== 'web') return;
                    const keyEvent = event.nativeEvent as TextInputKeyPressEventData & {
                      shiftKey?: boolean;
                    };
                    if (keyEvent.key === 'Enter' && !keyEvent.shiftKey) {
                      event.preventDefault?.();
                      onSend();
                    }
                  }}
                  className="min-h-11 max-h-28 flex-1 rounded-2xl border border-white/12 bg-white/[0.03] px-4 py-2.5 text-[15px] text-white"
                />
                <Pressable
                  onPress={onSend}
                  disabled={!canSend || status === 'sending'}
                  className="h-11 items-center justify-center rounded-2xl bg-white px-4 active:opacity-90 disabled:opacity-35">
                  {status === 'sending' ? (
                    <ActivityIndicator color="#050505" />
                  ) : (
                    <Text className="text-[14px] font-semibold text-[#050505]">Send</Text>
                  )}
                </Pressable>
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}
