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
    const date = new Date(iso);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
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
      contentContainerClassName="gap-4 px-1 pb-4 pt-2"
      ListEmptyComponent={
        <View className="mt-10 items-center px-6">
          <Text className="text-center text-[15px] text-white/40">
            Start a conversation
          </Text>
          <Text className="mt-2 text-center text-[13px] text-white/25">
            Your messages stay on the right. {assistantName} replies on the left.
          </Text>
        </View>
      }
      renderItem={({ item }) => {
        const mine = item.role === 'user';
        const editing = editingId === item.id;
        const busy = busyId === item.id || item.pending;
        const label = mine ? 'You' : assistantName;
        const canMutate = Boolean(onUpdate && onDelete) && !item.id.startsWith('local-');

        return (
          <View className={`w-full ${mine ? 'items-end' : 'items-start'}`}>
            <View
              className={`mb-1.5 flex-row items-center gap-2 ${
                mine ? 'flex-row-reverse' : ''
              }`}>
              <View
                className={`rounded-full px-2 py-0.5 ${
                  mine ? 'bg-white/12' : 'bg-[#1A1A1A] border border-white/10'
                }`}>
                <Text
                  className={`text-[11px] font-semibold tracking-[0.4px] ${
                    mine ? 'text-white/70' : 'text-white/55'
                  }`}>
                  {label}
                </Text>
              </View>
              <Text className="text-[11px] text-white/25">{formatTime(item.createdAt)}</Text>
              {item.updatedAt ? (
                <Text className="text-[11px] text-white/20">edited</Text>
              ) : null}
            </View>

            <View
              className={`max-w-[78%] rounded-2xl px-4 py-3 ${
                mine
                  ? 'rounded-tr-md bg-white'
                  : 'rounded-tl-md border border-white/12 bg-[#1A1A1A]'
              }`}>
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
                    placeholderTextColor={
                      mine ? 'rgba(5,5,5,0.35)' : 'rgba(255,255,255,0.35)'
                    }
                  />
                  <View className="mt-3 flex-row justify-end gap-2">
                    <Pressable
                      onPress={() => {
                        setEditingId(null);
                        setEditDraft('');
                      }}
                      className="h-8 w-8 items-center justify-center rounded-full bg-black/10 active:opacity-70">
                      <X size={14} color={mine ? '#050505' : '#FFFFFF'} />
                    </Pressable>
                    <Pressable
                      onPress={() => void saveEdit(item.id)}
                      disabled={busy}
                      className="h-8 w-8 items-center justify-center rounded-full bg-[#050505] active:opacity-80 disabled:opacity-40">
                      {busy ? (
                        <ActivityIndicator color="#FFFFFF" size="small" />
                      ) : (
                        <Check size={14} color="#FFFFFF" />
                      )}
                    </Pressable>
                  </View>
                </View>
              ) : (
                <Text
                  className={`text-[15px] leading-6 ${
                    mine ? 'text-[#050505]' : 'text-white/92'
                  }`}>
                  {item.text}
                </Text>
              )}
            </View>

            {canMutate && !editing ? (
              <View
                className={`mt-1.5 flex-row items-center gap-3 ${
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
                    <Pencil size={12} color="rgba(255,255,255,0.35)" />
                    <Text className="ml-1 text-[11px] text-white/35">Edit</Text>
                  </Pressable>
                ) : null}
                <Pressable
                  onPress={() => confirmDelete(item)}
                  disabled={busy}
                  className="flex-row items-center active:opacity-70 disabled:opacity-40">
                  {busy && busyId === item.id ? (
                    <ActivityIndicator color="rgba(255,255,255,0.35)" size="small" />
                  ) : (
                    <>
                      <Trash2 size={12} color="rgba(255,255,255,0.35)" />
                      <Text className="ml-1 text-[11px] text-white/35">Delete</Text>
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
