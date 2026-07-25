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
