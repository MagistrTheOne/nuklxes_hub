import type { ChatBubble } from '@/features/chat/types';

type StreamLikeMessage = {
  id?: string;
  text?: string;
  created_at?: string | Date;
  updated_at?: string | Date;
  user?: { id?: string } | null;
};

function toIso(value?: string | Date) {
  if (typeof value === 'string') return value;
  if (value instanceof Date) return value.toISOString();
  return null;
}

export function mapStreamMessage(
  message: StreamLikeMessage,
  botUserId: string,
): ChatBubble | null {
  const text = message.text?.trim() ?? '';
  if (!text || !message.id) return null;

  const userId = message.user?.id ?? '';
  const role = userId === botUserId ? 'assistant' : 'user';
  const createdAt = toIso(message.created_at) ?? new Date().toISOString();
  const updatedAt = toIso(message.updated_at) ?? undefined;

  return {
    id: message.id,
    text,
    role,
    createdAt,
    updatedAt:
      updatedAt && updatedAt !== createdAt ? updatedAt : undefined,
  };
}
