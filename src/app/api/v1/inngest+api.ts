import { config as loadEnv } from 'dotenv';

import { getInngestEnv } from '@/server/inngest';

loadEnv({ path: '.env', quiet: true });

/**
 * Placeholder Inngest serve endpoint.
 * Replace with `serve({ client, functions })` once the new Inngest keys + jobs land.
 */
export async function GET() {
  const env = getInngestEnv();
  return Response.json({
    success: true,
    data: {
      configured: Boolean(env.eventKey && env.signingKey),
      status: 'scaffold',
    },
  });
}

export async function PUT() {
  return Response.json(
    {
      success: false,
      error: 'Inngest serve handler not wired yet — awaiting new API credentials',
    },
    { status: 501 },
  );
}

export async function POST() {
  return PUT();
}
