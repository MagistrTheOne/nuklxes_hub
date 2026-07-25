import { readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Serves @anam-ai/js-sdk UMD build for the Android WebView bridge host page.
 */
export async function GET() {
  try {
    const sdkPath = path.join(
      process.cwd(),
      'node_modules',
      '@anam-ai',
      'js-sdk',
      'dist',
      'umd',
      'anam.js',
    );
    const body = await readFile(sdkPath, 'utf8');
    return new Response(body, {
      status: 200,
      headers: {
        'Content-Type': 'application/javascript; charset=utf-8',
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SDK missing';
    return Response.json({ error: message }, { status: 500 });
  }
}
