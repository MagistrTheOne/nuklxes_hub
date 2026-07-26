import type { ChatBubble } from '@/features/chat/types';

/** Drop exact id matches and replace pending local-* bubbles with the Stream twin. */
export function upsertChatMessage(
  prev: ChatBubble[],
  incoming: ChatBubble,
): ChatBubble[] {
  if (prev.some((item) => item.id === incoming.id)) {
    return prev.map((item) => (item.id === incoming.id ? incoming : item));
  }

  if (incoming.role === 'user') {
    const pendingIndex = prev.findIndex(
      (item) =>
        item.id.startsWith('local-') &&
        item.role === 'user' &&
        item.text === incoming.text,
    );
    if (pendingIndex >= 0) {
      const next = [...prev];
      next[pendingIndex] = incoming;
      return next;
    }
  }

  return [...prev, incoming];
}

export function replaceLocalWithStream(
  prev: ChatBubble[],
  localId: string,
  stream: ChatBubble,
): ChatBubble[] {
  const withoutDup = prev.filter((item) => item.id !== stream.id);
  return withoutDup.map((item) => (item.id === localId ? stream : item));
}
