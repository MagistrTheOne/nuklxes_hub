import { getStreamServerClient } from '@/server/stream/client';
import { digitalEmployeeChatUserId } from '@/server/stream/talk-channel-id';

export async function sendChatBotMessage(input: {
  employeeId: string;
  channelId: string;
  text: string;
  actorUserId: string;
}): Promise<string> {
  const trimmed = input.text.trim();
  if (!trimmed) {
    throw new Error('Message text is required');
  }

  const channelId = input.channelId.trim();
  if (!channelId) {
    throw new Error('channelId is required');
  }

  const server = getStreamServerClient();
  const channel = server.channel('messaging', channelId);

  // Ownership: channel custom talkUserId must match Clerk actor when present.
  try {
    const state = await channel.query({ state: true, watch: false });
    const talkUserId = (state.channel as { talkUserId?: string } | undefined)?.talkUserId;
    if (typeof talkUserId === 'string' && talkUserId !== input.actorUserId) {
      throw new Error('Chat channel is owned by another user');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('owned by another')) {
      throw error;
    }
  }

  const response = await channel.sendMessage({
    text: trimmed,
    user_id: digitalEmployeeChatUserId(input.employeeId),
    // Stream custom fields
    nullxes_talk_role: 'assistant',
  } as Parameters<typeof channel.sendMessage>[0]);

  return response.message.id;
}
