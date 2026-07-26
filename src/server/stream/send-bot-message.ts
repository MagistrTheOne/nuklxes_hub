import { getStreamServerClient } from '@/server/stream/client';
import { digitalEmployeeChatUserId } from '@/server/stream/talk-channel-id';

type ChannelOwnership = {
  talkUserId?: string;
  created_by?: string | { id?: string };
  created_by_id?: string;
};

function collectOwnerCandidates(channel: ChannelOwnership | undefined): string[] {
  if (!channel) return [];
  const createdBy =
    typeof channel.created_by === 'string'
      ? channel.created_by
      : channel.created_by?.id;
  return [channel.talkUserId, channel.created_by_id, createdBy].filter(
    (id): id is string => typeof id === 'string' && id.length > 0,
  );
}

export async function sendChatBotMessage(input: {
  employeeId: string;
  channelId: string;
  text: string;
  /** Preferred Stream actor (Neon platform id when linked). */
  actorUserId: string;
  /** All ids that may own this Talk channel for the same person. */
  ownerIds?: string[];
}): Promise<string> {
  const trimmed = input.text.trim();
  if (!trimmed) {
    throw new Error('Message text is required');
  }

  const channelId = input.channelId.trim();
  if (!channelId) {
    throw new Error('channelId is required');
  }

  const allowedOwners = (
    input.ownerIds?.length ? input.ownerIds : [input.actorUserId]
  ).filter(Boolean);

  const server = getStreamServerClient();
  const channel = server.channel('messaging', channelId);

  // Ownership: talkUserId / created_by must match Clerk or linked Neon id.
  try {
    const state = await channel.query({ state: true, watch: false });
    const ownership = state.channel as ChannelOwnership | undefined;
    const candidates = collectOwnerCandidates(ownership);
    const matched = candidates.some((id) => allowedOwners.includes(id));

    if (candidates.length > 0 && !matched) {
      throw new Error('Chat channel is owned by another user');
    }

    // Align custom talkUserId to preferred actor when legacy Clerk id still stored.
    const talkUserId = ownership?.talkUserId;
    if (
      typeof talkUserId === 'string' &&
      talkUserId.length > 0 &&
      talkUserId !== input.actorUserId &&
      allowedOwners.includes(talkUserId)
    ) {
      try {
        await channel.updatePartial({ set: { talkUserId: input.actorUserId } });
      } catch {
        // non-fatal — message can still send
      }
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('owned by another')) {
      throw error;
    }
  }

  const response = await channel.sendMessage({
    text: trimmed,
    user_id: digitalEmployeeChatUserId(input.employeeId),
    nullxes_talk_role: 'assistant',
  } as Parameters<typeof channel.sendMessage>[0]);

  return response.message.id;
}
