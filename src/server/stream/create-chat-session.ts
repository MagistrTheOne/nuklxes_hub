import {
  getReadyFallbackEmployee,
  NULLXES_ORG_ID,
} from '@/features/workforce/data/employees';
import { getPlatformEmployee } from '@/server/platform-employees';
import { getStreamCredentials, getStreamServerClient } from '@/server/stream/client';
import {
  digitalEmployeeChatUserId,
  talkChannelId,
} from '@/server/stream/talk-channel-id';

export type ChatSessionCredentials = {
  apiKey: string;
  token: string;
  userId: string;
  userName: string;
  channelType: 'messaging';
  channelId: string;
  employeeId: string;
  employeeName: string;
  botUserId: string;
};

export async function createChatSession(input: {
  employeeId: string;
  actorUserId: string;
  actorName: string;
  /** Clerk + Neon ids for the same person — used for membership / ownership migrate. */
  ownerIds?: string[];
  threadId?: string | null;
  title?: string;
}): Promise<ChatSessionCredentials> {
  const employeeId = input.employeeId.trim();
  const actorUserId = input.actorUserId.trim();
  if (!employeeId || !actorUserId) {
    throw new Error('employeeId and actorUserId are required');
  }

  const ownerIds = (
    input.ownerIds?.length ? input.ownerIds : [actorUserId]
  ).filter((id, index, all) => id && all.indexOf(id) === index);

  let employee = null as Awaited<ReturnType<typeof getPlatformEmployee>>;
  if (process.env.DATABASE_URL?.trim()) {
    try {
      employee = await getPlatformEmployee(employeeId);
    } catch {
      employee = null;
    }
  }
  if (!employee) {
    employee = getReadyFallbackEmployee(employeeId);
  }
  if (!employee) {
    throw new Error(`Employee not found: ${employeeId}`);
  }

  const { publicApiKey } = getStreamCredentials();
  const server = getStreamServerClient();
  const botUserId = digitalEmployeeChatUserId(employeeId);
  const channelId = talkChannelId(employeeId, input.threadId ?? null, actorUserId);
  const actorName = input.actorName.trim() || 'NULLXES user';

  await server.upsertUsers([
    ...ownerIds.map((id) => ({
      id,
      name: actorName,
    })),
    {
      id: botUserId,
      name: employee.name,
      image: employee.previewUrl ?? undefined,
    },
  ]);

  const channelData: Record<string, unknown> = {
    members: [actorUserId, botUserId],
    created_by_id: actorUserId,
    talkEmployeeId: employeeId,
    talkOrganizationId: employee.organizationId || NULLXES_ORG_ID,
    talkUserId: actorUserId,
    talkKind: input.threadId ? 'thread' : 'main',
  };
  if (input.threadId) {
    channelData.talkTitle = input.title ?? 'New chat';
  }

  const channel = server.channel('messaging', channelId, channelData);

  try {
    await channel.create();
  } catch {
    // already exists — ensure via query/create
    try {
      await channel.query({
        state: true,
        watch: false,
        data: channelData,
      });
    } catch {
      // non-fatal; addMembers below may still succeed on existing channels
    }

    // Prefer Neon actor on linked accounts when legacy Clerk id is still stored.
    try {
      const state = await channel.query({ state: true, watch: false });
      const existing = state.channel as { talkUserId?: string } | undefined;
      const talkUserId = existing?.talkUserId;
      if (
        typeof talkUserId === 'string' &&
        talkUserId !== actorUserId &&
        ownerIds.includes(talkUserId)
      ) {
        await channel.updatePartial({ set: { talkUserId: actorUserId } });
      }
    } catch {
      // non-fatal
    }
  }

  try {
    await channel.addMembers([actorUserId, botUserId]);
  } catch {
    // already members
  }

  const token = server.createToken(actorUserId);

  return {
    apiKey: publicApiKey,
    token,
    userId: actorUserId,
    userName: actorName,
    channelType: 'messaging',
    channelId,
    employeeId: employee.id,
    employeeName: employee.name,
    botUserId,
  };
}
