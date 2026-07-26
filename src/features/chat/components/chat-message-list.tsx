import { Check, Pencil, Trash2, X } from 'lucide-react-native';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { ChatBubble } from '@/features/chat/types';

type ChatMessageListProps = {
  messages: ChatBubble[];
  assistantName?: string;
  onUpdate?: (messageId: string, text: string) => Promise<boolean>;
  onDelete?: (messageId: string) => Promise<boolean>;
};

function formatTime(iso: string) {
  try {
    return new Date(iso).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  } catch {
    return '';
  }
}

export function ChatMessageList({
  messages,
  assistantName = 'Assistant',
  onUpdate,
  onDelete,
}: ChatMessageListProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);

  const confirmDelete = (item: ChatBubble) => {
    if (!onDelete) return;
    const run = () => {
      setBusyId(item.id);
      void onDelete(item.id).finally(() => setBusyId(null));
    };

    if (Platform.OS === 'web') {
      if (typeof window !== 'undefined' && window.confirm('Delete this message?')) {
        run();
      }
      return;
    }

    Alert.alert('Delete message', 'Remove this message from the thread?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: run },
    ]);
  };

  const saveEdit = async (messageId: string) => {
    if (!onUpdate) return;
    const text = editDraft.trim();
    if (!text) return;
    setBusyId(messageId);
    const ok = await onUpdate(messageId, text);
    setBusyId(null);
    if (ok) {
      setEditingId(null);
      setEditDraft('');
    }
  };

  return (
    <FlatList
      data={messages}
      keyExtractor={(item) => item.id}
      className="flex-1"
      style={{ width: '100%' }}
      contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 16, paddingTop: 8, gap: 10 }}
      ListEmptyComponent={
        <View className="mt-16 items-center px-6">
          <Text className="text-center text-[15px] text-white/40">No messages yet</Text>
          <Text className="mt-2 text-center text-[13px] text-white/25">
            Say hello to {assistantName}
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const mine = item.role === 'user';
        const editing = editingId === item.id;
        const busy = busyId === item.id || item.pending;
        const canMutate = Boolean(onUpdate && onDelete) && !item.id.startsWith('local-');

        return (
          <View style={{ width: '100%', alignItems: mine ? 'flex-end' : 'flex-start' }}>
            <View
              className={`rounded-2xl px-3.5 py-2.5 ${
                mine
                  ? 'rounded-br-md bg-white'
                  : 'rounded-bl-md border border-white/10 bg-[#1C1C1C]'
              }`}
              style={{ maxWidth: '82%' }}>
              {editing ? (
                <View>
                  <TextInput
                    value={editDraft}
                    onChangeText={setEditDraft}
                    multiline
                    autoFocus
                    className={`min-h-12 text-[15px] leading-5 ${
                      mine ? 'text-[#050505]' : 'text-white'
                    }`}
                  />
                  <View className="mt-2 flex-row justify-end gap-2">
                    <Pressable
                      onPress={() => {
                        setEditingId(null);
                        setEditDraft('');
                      }}
                      className="h-8 w-8 items-center justify-center rounded-full bg-black/10">
                      <X size={14} color={mine ? '#050505' : '#FFFFFF'} />
                    </Pressable>
                    <Pressable
                      onPress={() => void saveEdit(item.id)}
                      disabled={busy}
                      className="h-8 w-8 items-center justify-center rounded-full bg-[#050505] disabled:opacity-40">
                      {busy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Check size={14} color="#FFFFFF" />
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <>
                  <Text
                    className={`text-[15px] leading-6 ${
                      mine ? 'text-[#050505]' : 'text-white'
                    }`}>
                    {item.text}
                  </Text>
                  <View className="mt-1 flex-row items-center justify-end gap-1.5">
                    {item.updatedAt ? (
                      <Text
                        className={`text-[10px] ${
                          mine ? 'text-[#050505]/40' : 'text-white/30'
                        }`}>
                        edited
                      </Text>
                    ) : null}
                    <Text
                      className={`text-[11px] ${
                        mine ? 'text-[#050505]/45' : 'text-white/35'
                      }`}>
                      {formatTime(item.createdAt)}
                    </Text>
                  </View>
                </>
              )}
            </View>

            {canMutate && !editing ? (
              <View
                className={`mt-1 flex-row items-center gap-3 ${
                  mine ? 'justify-end' : 'justify-start'
                }`}>
                {mine ? (
                  <Pressable
                    onPress={() => {
                      setEditingId(item.id);
                      setEditDraft(item.text);
                    }}
                    disabled={busy}
                    className="flex-row items-center active:opacity-70 disabled:opacity-40">
                    <Pencil size={11} color="rgba(255,255,255,0.32)" />
                    <Text className="ml-1 text-[11px] text-white/32">Edit</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => confirmDelete(item)}
                  disabled={busy}
                  className="flex-row items-center active:opacity-70 disabled:opacity-40">
                  {busy && busyId === item.id ? (
                    <ActivityIndicator color="rgba(255,255,255,0.32)" size="small" />
                  ) : (
                    <>
                      <Trash2 size={11} color="rgba(255,255,255,0.32)" />
                      <Text className="ml-1 text-[11px] text-white/32">Delete</Text>
                    </>
                  )}
                </Pressable>
              </View>
            ) : null}
          </View>
        );
      }}
    />
  );
}
