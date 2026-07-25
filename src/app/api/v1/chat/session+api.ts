import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { createChatSession } from '@/server/stream/create-chat-session';

loadEnv({ path: '.env', quiet: true });

type Body = {
  employeeId?: string;
  userName?: string;
  threadId?: string | null;
  title?: string;
};

/**
 * Mint Stream Chat credentials for Clerk user + employee channel.
 * Auth: Clerk JWT. No Stream Video.
 */
export async function POST(request: Request) {
  try {
    const payload = await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as Body;
    const employeeId = typeof body.employeeId === 'string' ? body.employeeId.trim() : '';

    if (!employeeId) {
      return Response.json({ success: false, error: 'employeeId is required' }, { status: 400 });
    }

    const data = await createChatSession({
      employeeId,
      actorUserId: payload.sub,
      actorName:
        (typeof body.userName === 'string' && body.userName.trim()) ||
        (typeof payload.email === 'string' ? payload.email : 'NULLXES user'),
      threadId: typeof body.threadId === 'string' ? body.threadId : null,
      title: typeof body.title === 'string' ? body.title : undefined,
    });

    return Response.json({ success: true, data });
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
