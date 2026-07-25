import type { ChatBubble } from '@/features/chat/types';

type StreamLikeMessage = {
  id?: string;
  text?: string;
  created_at?: string | Date;
  user?: { id?: string } | null;
};

export function mapStreamMessage(
  message: StreamLikeMessage,
  botUserId: string,
): ChatBubble | null {
  const text = message.text?.trim() ?? '';
  if (!text || !message.id) return null;

  const userId = message.user?.id ?? '';
  const role = userId === botUserId ? 'assistant' : 'user';
  const createdAt =
    typeof message.created_at === 'string'
      ? message.created_at
      : message.created_at instanceof Date
        ? message.created_at.toISOString()
        : new Date().toISOString();

  return {
    id: message.id,
    text,
    role,
    createdAt,
  };
}
