import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { createChatSession } from '@/server/stream/create-chat-session';
import { resolveStreamChatActor } from '@/server/stream/resolve-chat-actor';

loadEnv({ path: '.env', quiet: true });

type Body = {
  employeeId?: string;
  userName?: string;
  email?: string;
  threadId?: string | null;
  title?: string;
};

/**
 * Mint Stream Chat credentials for Clerk user + employee channel.
 * When email matches Neon `user` (e.g. ceo@nullxes.com), actor id = platform user id
 * so mobile shares the same channel as web.
 */
export async function POST(request: Request) {
  try {
    const payload = await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as Body;
    const employeeId = typeof body.employeeId === 'string' ? body.employeeId.trim() : '';

    if (!employeeId) {
      return Response.json({ success: false, error: 'employeeId is required' }, { status: 400 });
    }

    const actor = await resolveStreamChatActor({
      payload,
      email: typeof body.email === 'string' ? body.email : null,
      userName: typeof body.userName === 'string' ? body.userName : null,
    });

    const data = await createChatSession({
      employeeId,
      actorUserId: actor.actorUserId,
      actorName: actor.actorName,
      ownerIds: actor.ownerIds,
      threadId: typeof body.threadId === 'string' ? body.threadId : null,
      title: typeof body.title === 'string' ? body.title : undefined,
    });

    return Response.json({
      success: true,
      data: {
        ...data,
        linked: actor.linked,
        platformUserId: actor.platformUserId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Chat session failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('STREAM_')
          ? 503
          : message.includes('not found')
            ? 404
            : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/chat/session]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
