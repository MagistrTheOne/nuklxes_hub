import { config as loadEnv } from 'dotenv';

import { verifyClerkBearerToken } from '@/server/clerk-jwt';
import {
  BrainStreamHttpError,
  createTalkBrainNdjsonStream,
  type BrainStreamRequest,
} from '@/server/brain/talk-brain-stream';
import type { TalkPipelineMessage } from '@/server/brain/types';

loadEnv({ path: '.env', quiet: true });

function parseMessages(value: unknown): TalkPipelineMessage[] {
  if (!Array.isArray(value)) return [];

  return value
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const role = (item as { role?: unknown }).role;
      const content = (item as { content?: unknown }).content;
      if ((role !== 'user' && role !== 'persona') || typeof content !== 'string') {
        return null;
      }
      return { role, content };
    })
    .filter((item): item is TalkPipelineMessage => item !== null);
}

/**
 * Hub brain-stream — cognition for Talk / Chat.
 * Auth: Clerk JWT. Shared Neon for employee runtime. NDJSON out.
 */
export async function POST(request: Request) {
  try {
    await verifyClerkBearerToken(request.headers.get('authorization'));

    const body = (await request.json().catch(() => ({}))) as Partial<BrainStreamRequest>;
    const employeeId = typeof body.employeeId === 'string' ? body.employeeId.trim() : '';
    const messages = parseMessages(body.messages);

    const stream = await createTalkBrainNdjsonStream(
      {
        employeeId,
        sessionId: typeof body.sessionId === 'string' ? body.sessionId : undefined,
        turnId: typeof body.turnId === 'string' ? body.turnId : undefined,
        channel: body.channel === 'chat' ? 'chat' : 'voice',
        messages,
      },
      { signal: request.signal },
    );

    return new Response(stream, {
      status: 200,
      headers: {
        'Content-Type': 'application/x-ndjson; charset=utf-8',
        'Cache-Control': 'no-cache, no-transform',
        Connection: 'keep-alive',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Brain stream failed';
    const status =
      error instanceof BrainStreamHttpError
        ? error.status
        : message.includes('Bearer') || message.includes('token')
          ? 401
          : 500;

    if (typeof __DEV__ !== 'undefined' && __DEV__) {
      console.warn('[api/v1/talk/brain-stream]', message);
    }

    return Response.json({ error: message }, { status });
  }
}
