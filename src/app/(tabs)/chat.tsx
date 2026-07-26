import { useUser } from '@clerk/expo';
import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, History, Plus, Send, Video } from 'lucide-react-native';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  type NativeSyntheticEvent,
  Platform,
  Pressable,
  Text,
  TextInput,
  type TextInputKeyPressEventData,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ChatHistoryBar } from '@/features/chat/components/chat-history-bar';
import {
  ChatInboxList,
  inboxPreviewForEmployee,
} from '@/features/chat/components/chat-inbox-list';
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
  const router = useRouter();
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

  /** null = inbox; string = open thread */
  const [openId, setOpenId] = useState<string | null>(() =>
    typeof paramId === 'string' && paramId ? resolveId(paramId) : null,
  );
  const [threadId, setThreadId] = useState('main');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const sendingLock = useRef(false);

  const readyIds = ready.map((e) => e.id).join(',');

  useEffect(() => {
    if (typeof paramId === 'string' && paramId) {
      setOpenId(resolveId(paramId));
      setThreadId('main');
      setHistoryOpen(false);
    }
  }, [paramId, readyIds, email]);

  const selectedId = openId;
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

  const inboxRows = useMemo(
    () =>
      ready.map((employeeRow) => {
        const meta = inboxPreviewForEmployee(employeeRow.id, allThreads);
        return {
          employee: employeeRow,
          preview: meta.preview,
          updatedAt: meta.updatedAt,
        };
      }),
    [ready, allThreads],
  );

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
              ? 'online'
              : 'offline'
            : online
              ? 'online'
              : 'offline';

  const assistantLabel = employee?.name?.split(/\s+/).slice(0, 2).join(' ') ?? 'Assistant';

  // ——— Inbox ———
  if (!openId) {
    return (
      <View className="flex-1 bg-[#050505]">
        <SafeAreaView className="flex-1" edges={['top']}>
          <View className="px-5 pb-2 pt-2">
            <Text className="text-[28px] font-semibold text-white">Chat</Text>
            <Text className="mt-1.5 text-[15px] leading-6 text-white/45">
              Message your digital employees
            </Text>
          </View>
          <ChatInboxList
            rows={inboxRows}
            onOpen={(id) => {
              setOpenId(id);
              setThreadId('main');
              setHistoryOpen(false);
            }}
          />
        </SafeAreaView>
      </View>
    );
  }

  // ——— Thread (full width — no max-w rail) ———
  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1" edges={['top']}>
        <View className="flex-row items-center border-b border-white/10 px-3 py-2">
          <Pressable
            onPress={() => {
              setOpenId(null);
              setHistoryOpen(false);
              setDraft('');
            }}
            className="h-10 w-10 items-center justify-center active:opacity-70">
            <ArrowLeft size={22} color="#FFFFFF" />
          </Pressable>

          {employee ? (
            <EmployeeAvatar
              initials={employee.initials}
              previewUrl={employee.previewUrl}
              size="sm"
            />
          ) : null}

          <View className="ml-3 min-w-0 flex-1">
            <Text className="text-[16px] font-semibold text-white" numberOfLines={1}>
              {employee?.name ?? 'Chat'}
            </Text>
            <View className="mt-0.5 flex-row items-center">
              <View
                className={`mr-1.5 h-1.5 w-1.5 rounded-full ${
                  online && status === 'ready' ? 'bg-[#34C759]' : 'bg-white/25'
                }`}
              />
              <Text className="text-[12px] text-white/40">{syncLabel}</Text>
              {status === 'connecting' ? (
                <ActivityIndicator style={{ marginLeft: 8 }} color="#FFFFFF" />
              ) : null}
            </View>
          </View>

          {status === 'error' ? (
            <Pressable
              onPress={() => void connect()}
              className="mr-1 h-9 items-center justify-center rounded-full border border-white/15 px-3">
              <Text className="text-[12px] font-semibold text-white">Retry</Text>
            </Pressable>
          ) : null}

          <Pressable
            onPress={() => setHistoryOpen((v) => !v)}
            className="h-10 w-10 items-center justify-center active:opacity-70">
            <History size={18} color="rgba(255,255,255,0.55)" />
          </Pressable>

          <Pressable
            onPress={() => {
              if (!selectedId) return;
              router.push(`/(tabs)/live?employeeId=${selectedId}` as Href);
            }}
            className="h-10 w-10 items-center justify-center active:opacity-70">
            <Video size={20} color="#FFFFFF" />
          </Pressable>
        </View>

        {error ? (
          <Text className="px-4 py-2 text-center text-[13px] text-red-400">
            {error.includes('owned')
              ? 'Could not sync this thread. Retry.'
              : 'Could not complete that action. Try again.'}
          </Text>
        ) : null}

        <View className="flex-1">
          <ChatMessageList
            messages={messages}
            assistantName={assistantLabel}
            onUpdate={updateMessage}
            onDelete={deleteMessage}
          />
        </View>

        {historyOpen ? (
          <View className="px-3">
            <ChatHistoryBar
              threads={employeeThreads}
              activeThreadId={threadId}
              expanded
              onToggle={() => setHistoryOpen(false)}
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
              }}
            />
          </View>
        ) : null}

        <View className="flex-row items-end gap-2 border-t border-white/10 px-3 py-2.5">
          <Pressable
            onPress={() => {
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
            className="mb-0.5 h-11 w-11 items-center justify-center rounded-full border border-white/12 active:opacity-80">
            <Plus size={18} color="#FFFFFF" />
          </Pressable>

          <TextInput
            value={draft}
            onChangeText={setDraft}
            editable={status === 'ready' || status === 'sending'}
            placeholder={
              status === 'ready' || status === 'sending'
                ? 'Message'
                : status === 'error'
                  ? 'Retry to chat'
                  : 'Opening…'
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
            className="min-h-11 max-h-28 flex-1 rounded-full border border-white/12 bg-white/[0.04] px-4 py-2.5 text-[15px] text-white"
          />

          <Pressable
            onPress={onSend}
            disabled={!canSend || status === 'sending'}
            className="mb-0.5 h-11 w-11 items-center justify-center rounded-full bg-white active:opacity-90 disabled:opacity-35">
            {status === 'sending' ? (
              <ActivityIndicator color="#050505" />
            ) : (
              <Send size={18} color="#050505" />
            )}
          </Pressable>
        </View>
      </SafeAreaView>
    </View>
  );
}
