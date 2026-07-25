import { StreamChat } from 'stream-chat';

export function getStreamCredentials() {
  const apiKey = process.env.STREAM_API_KEY?.trim() || '';
  const secret = process.env.STREAM_SECRET_KEY?.trim() || '';
  const publicApiKey =
    process.env.EXPO_PUBLIC_STREAM_API_KEY?.trim() || apiKey;

  if (!apiKey || !secret) {
    throw new Error('STREAM_API_KEY and STREAM_SECRET_KEY must be configured');
  }

  return { apiKey, secret, publicApiKey };
}

export function getStreamServerClient() {
  const { apiKey, secret } = getStreamCredentials();
  return StreamChat.getInstance(apiKey, secret);
}
