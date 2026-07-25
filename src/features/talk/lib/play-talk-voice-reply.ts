import type { AnamTalkClient } from '@/features/anam/client/types';
import type { TalkVoiceMode } from '@/features/talk/types';

const PCM_CHUNK_BYTES = 4096;

function base64ToUint8Array(pcmBase64: string): Uint8Array {
  const binary = atob(pcmBase64);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

async function streamReplyWithAnamVoice(
  anamClient: AnamTalkClient,
  replyText: string,
  correlationId?: string,
): Promise<void> {
  const createStream = anamClient.createTalkMessageStream;
  if (!createStream) {
    throw new Error('Anam talk stream is unavailable on this platform');
  }

  const talkStream = createStream(correlationId);
  const words = replyText.split(/(\s+)/).filter((part) => part.length > 0);

  for (const part of words) {
    if (!talkStream.isActive()) break;
    await talkStream.streamMessageChunk(part, false);
  }

  if (talkStream.isActive()) {
    await talkStream.endMessage();
  }
}

function playReplyWithElevenLabsPcm(
  anamClient: AnamTalkClient,
  pcmBase64: string,
): boolean {
  const createAudio = anamClient.createAgentAudioInputStream;
  if (!createAudio) return false;

  try {
    const audioInputStream = createAudio({
      encoding: 'pcm_s16le',
      sampleRate: 16000,
      channels: 1,
    });

    const bytes = base64ToUint8Array(pcmBase64);
    for (let offset = 0; offset < bytes.length; offset += PCM_CHUNK_BYTES) {
      audioInputStream.sendAudioChunk(bytes.subarray(offset, offset + PCM_CHUNK_BYTES));
    }
    audioInputStream.endSequence();
    return true;
  } catch {
    return false;
  }
}

/**
 * Speak brain reply through Anam mouth.
 * elevenlabs → PCM chunks; anam → TalkMessageStream TTS.
 */
export async function playTalkVoiceReply(input: {
  anamClient: AnamTalkClient;
  replyText: string;
  voiceMode: TalkVoiceMode;
  pcmBase64?: string | null;
  correlationId?: string;
}): Promise<void> {
  const text = input.replyText.trim();
  if (!text) return;

  if (input.voiceMode === 'elevenlabs' && input.pcmBase64) {
    const played = playReplyWithElevenLabsPcm(input.anamClient, input.pcmBase64);
    if (played) return;
  }

  await streamReplyWithAnamVoice(input.anamClient, text, input.correlationId);
}
