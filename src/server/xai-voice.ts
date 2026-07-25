import { ADELINE_KALEN_EMPLOYEE_ID } from '@/features/xai-voice/constants';

export { ADELINE_KALEN_EMPLOYEE_ID };

const DEFAULT_ADELINE_AGENT_ID = 'agent_yLXnJLDucVtucCck';

export type XaiVoiceSessionPayload = {
  clientSecret: string;
  expiresAt?: string;
  websocketUrl: string;
  agentId: string;
  employeeId: string;
  bindConsoleAgent: true;
  sampleRate: number;
  sessionUpdate: {
    type: 'session.update';
    session: {
      reasoning: { effort: 'none' };
      turn_detection: {
        type: 'server_vad';
        silence_duration_ms: number;
        prefix_padding_ms: number;
      };
      audio: {
        input: { format: { type: 'audio/pcm'; rate: number } };
        output: { format: { type: 'audio/pcm'; rate: number } };
      };
      tools: [];
    };
  };
};

function getXaiApiKey() {
  return process.env.XAI_API_KEY?.trim() || '';
}

export function getAdelineAgentId() {
  return (
    process.env.XAI_VOICE_AGENT_ADELINE?.trim() || DEFAULT_ADELINE_AGENT_ID
  );
}

export function buildXaiRealtimeWebSocketUrl(agentId: string) {
  const params = new URLSearchParams({
    'reasoning.effort': 'none',
    agent_id: agentId,
  });
  return `wss://api.x.ai/v1/realtime?${params.toString()}`;
}

export async function createXaiVoiceClientSecret(): Promise<{
  value: string;
  expiresAt?: string;
}> {
  const apiKey = getXaiApiKey();
  if (!apiKey) {
    throw new Error('XAI_API_KEY is not configured');
  }

  const response = await fetch('https://api.x.ai/v1/realtime/client_secrets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      expires_after: { seconds: 300 },
      session: { reasoning: { effort: 'none' } },
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => response.statusText);
    throw new Error(`xAI client secret failed (${response.status}): ${detail.slice(0, 200)}`);
  }

  const payload = (await response.json()) as {
    client_secret?: { value?: string; expires_at?: string };
    value?: string;
    expires_at?: string;
  };

  const value = payload.client_secret?.value ?? payload.value;
  if (!value) {
    throw new Error('xAI client secret missing value');
  }

  return {
    value,
    expiresAt: payload.client_secret?.expires_at ?? payload.expires_at,
  };
}

/** Console-bound Adeline session (no voice/instructions override). */
export async function createAdelineVoiceSession(
  employeeId = ADELINE_KALEN_EMPLOYEE_ID,
): Promise<XaiVoiceSessionPayload> {
  if (employeeId !== ADELINE_KALEN_EMPLOYEE_ID) {
    throw new Error('Hub xAI Voice v1 supports Adeline Kalen only');
  }

  const sampleRate = 24000;
  const agentId = getAdelineAgentId();
  const secret = await createXaiVoiceClientSecret();

  return {
    clientSecret: secret.value,
    expiresAt: secret.expiresAt,
    websocketUrl: buildXaiRealtimeWebSocketUrl(agentId),
    agentId,
    employeeId,
    bindConsoleAgent: true,
    sampleRate,
    sessionUpdate: {
      type: 'session.update',
      session: {
        reasoning: { effort: 'none' },
        turn_detection: {
          type: 'server_vad',
          silence_duration_ms: 400,
          prefix_padding_ms: 200,
        },
        audio: {
          input: { format: { type: 'audio/pcm', rate: sampleRate } },
          output: { format: { type: 'audio/pcm', rate: sampleRate } },
        },
        tools: [],
      },
    },
  };
}
