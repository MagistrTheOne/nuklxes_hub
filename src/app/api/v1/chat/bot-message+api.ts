import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import { resolveStreamChatActor } from '@/server/stream/resolve-chat-actor';
import { sendChatBotMessage } from '@/server/stream/send-bot-message';

loadEnv({ path: '.env', quiet: true });

type Body = {
  employeeId?: string;
  channelId?: string;
  text?: string;
  email?: string;
  userName?: string;
};

/** Server-side bot inject (digital employee) into Stream messaging channel. */
export async function POST(request: Request) {
  try {
    const payload = await verifyClerkBearerToken(request.headers.get('authorization'));
    const body = (await request.json().catch(() => ({}))) as Body;

    const employeeId = typeof body.employeeId === 'string' ? body.employeeId.trim() : '';
    const channelId = typeof body.channelId === 'string' ? body.channelId.trim() : '';
    const text = typeof body.text === 'string' ? body.text.trim() : '';

    if (!employeeId || !channelId || !text) {
      return Response.json(
        { success: false, error: 'employeeId, channelId, and text are required' },
        { status: 400 },
      );
    }

    const actor = await resolveStreamChatActor({
      payload,
      email: typeof body.email === 'string' ? body.email : null,
      userName: typeof body.userName === 'string' ? body.userName : null,
    });

    const messageId = await sendChatBotMessage({
      employeeId,
      channelId,
      text,
      actorUserId: actor.actorUserId,
      ownerIds: actor.ownerIds,
    });

    return Response.json({ success: true, data: { messageId } });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Bot message failed';
    const status =
      message.includes('Bearer') || message.includes('token')
        ? 401
        : message.includes('owned by another')
          ? 403
          : message.includes('STREAM_')
            ? 503
            : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/chat/bot-message]', message);
    }

    return Response.json({ success: false, error: message }, { status });
  }
}
