import { config as loadEnv } from 'dotenv';

import { buildAnamBridgeHtml } from '@/server/anam-bridge-html';

loadEnv({ path: '.env', quiet: true });

function resolveSdkUrl(request: Request) {
  const explicit = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '');
  if (explicit) {
    return `${explicit}/api/v1/anam/bridge-sdk`;
  }

  const url = new URL(request.url);
  return `${url.origin}/api/v1/anam/bridge-sdk`;
}

/** HTML page hosting Anam face for React Native WebView. */
export async function GET(request: Request) {
  const html = buildAnamBridgeHtml(resolveSdkUrl(request));
  return new Response(html, {
    status: 200,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'no-cache',
    },
  });
}
