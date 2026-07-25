import { ElevenLabsClient } from '@elevenlabs/elevenlabs-js';

export const ELEVENLABS_VOICE_MODEL_ID = 'eleven_v3' as const;

export type ElevenLabsVoice = {
  voiceId: string;
  name: string;
  category: string | null;
  gender: string | null;
  language: string | null;
  previewUrl: string | null;
};

function requireElevenLabsApiKey() {
  const apiKey = process.env.ELEVENLABS_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ELEVENLABS_API_KEY is missing from the environment');
  }
  return apiKey;
}

export function createElevenLabsClient() {
  return new ElevenLabsClient({ apiKey: requireElevenLabsApiKey() });
}

async function readableToBuffer(stream: ReadableStream<Uint8Array> | AsyncIterable<Uint8Array>) {
  if (Symbol.asyncIterator in Object(stream)) {
    const chunks: Buffer[] = [];
    for await (const chunk of stream as AsyncIterable<Uint8Array>) {
      chunks.push(Buffer.from(chunk));
    }
    return Buffer.concat(chunks);
  }

  const reader = (stream as ReadableStream<Uint8Array>).getReader();
  const chunks: Uint8Array[] = [];
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) chunks.push(value);
  }
  return Buffer.concat(chunks.map((c) => Buffer.from(c)));
}

export async function listElevenLabsVoices(): Promise<ElevenLabsVoice[]> {
  const client = createElevenLabsClient();
  const response = await client.voices.getAll();
  const voices = response.voices ?? [];

  return voices
    .filter((voice) => Boolean(voice.voiceId && voice.name))
    .map((voice) => ({
      voiceId: voice.voiceId!,
      name: voice.name!,
      category: voice.category ?? null,
      gender: voice.labels?.gender ?? null,
      language: voice.labels?.language ?? voice.labels?.accent ?? null,
      previewUrl: voice.previewUrl ?? null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

export type SynthesizeSpeechInput = {
  voiceId: string;
  text: string;
  modelId?: typeof ELEVENLABS_VOICE_MODEL_ID;
};

export async function synthesizeElevenLabsSpeech(input: SynthesizeSpeechInput) {
  const text = input.text.trim();
  if (!text) {
    throw new Error('text is required');
  }
  if (!input.voiceId.trim()) {
    throw new Error('voiceId is required');
  }

  const client = createElevenLabsClient();
  const audio = await client.textToSpeech.convert(input.voiceId, {
    text,
    modelId: input.modelId ?? ELEVENLABS_VOICE_MODEL_ID,
    outputFormat: 'mp3_44100_128',
  });

  const buffer = await readableToBuffer(audio as ReadableStream<Uint8Array>);
  return {
    audioBase64: buffer.toString('base64'),
    contentType: 'audio/mpeg',
    modelId: input.modelId ?? ELEVENLABS_VOICE_MODEL_ID,
  };
}

function resolveAgentId(agentId?: string) {
  const resolved = agentId?.trim() || process.env.ELEVENLABS_AGENT_ID?.trim();
  if (!resolved) {
    throw new Error('ELEVENLABS_AGENT_ID is missing from the environment');
  }
  return resolved;
}

/**
 * Mint a short-lived WebRTC conversation token for ElevenAgents.
 * @see https://elevenlabs.io/docs/eleven-agents/libraries/react
 */
export async function createElevenLabsConversationToken(agentId?: string) {
  const resolvedAgentId = resolveAgentId(agentId);
  const apiKey = requireElevenLabsApiKey();

  const url = new URL('https://api.elevenlabs.io/v1/convai/conversation/token');
  url.searchParams.set('agent_id', resolvedAgentId);

  const response = await fetch(url, {
    headers: { 'xi-api-key': apiKey },
  });

  const json = (await response.json().catch(() => null)) as {
    token?: string;
    detail?: string | { message?: string };
  } | null;

  if (!response.ok || !json?.token) {
    const detail =
      typeof json?.detail === 'string'
        ? json.detail
        : json?.detail?.message ?? `ElevenLabs conversation token failed (${response.status})`;
    throw new Error(detail);
  }

  return {
    conversationToken: json.token,
    agentId: resolvedAgentId,
  };
}

/** WebSocket signed URL fallback for private agents. */
export async function createElevenLabsSignedUrl(agentId?: string) {
  const resolvedAgentId = resolveAgentId(agentId);
  const client = createElevenLabsClient();
  const response = await client.conversationalAi.conversations.getSignedUrl({
    agentId: resolvedAgentId,
  });

  if (!response.signedUrl) {
    throw new Error('ElevenLabs signed URL missing from response');
  }

  return {
    signedUrl: response.signedUrl,
    agentId: resolvedAgentId,
  };
}
