const ANAM_API_BASE = 'https://api.anam.ai/v1';

export type AnamEphemeralPersonaConfig = {
  name: string;
  avatarId: string;
  avatarModel?: 'cara-3' | 'cara-4' | 'cara-4-latest';
  voiceId: string;
  llmId: string;
  systemPrompt: string;
  maxSessionLengthSeconds?: number;
  skipGreeting?: boolean;
  initialMessage?: string | null;
};

export type AnamStatefulPersonaConfig = {
  personaId: string;
};

export type AnamPersonaConfig = AnamEphemeralPersonaConfig | AnamStatefulPersonaConfig;

export type CreateAnamSessionTokenInput = {
  personaConfig: AnamPersonaConfig;
  clientLabel?: string;
};

function requireAnamApiKey() {
  const apiKey = process.env.ANAM_API_KEY?.trim();
  if (!apiKey) {
    throw new Error('ANAM_API_KEY is missing from the environment');
  }
  return apiKey;
}

/**
 * Exchange server-side Anam API key for a short-lived client session token.
 * @see https://anam.ai/docs/api-reference/sessions/create-session-token
 */
export async function createAnamSessionToken(input: CreateAnamSessionTokenInput) {
  const response = await fetch(`${ANAM_API_BASE}/auth/session-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${requireAnamApiKey()}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      clientLabel: input.clientLabel,
      personaConfig: input.personaConfig,
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    sessionToken?: string;
    error?: string;
    message?: string;
  } | null;

  if (!response.ok || !json?.sessionToken) {
    const message = json?.error ?? json?.message ?? `Anam session token failed (${response.status})`;
    throw new Error(message);
  }

  return {
    sessionToken: json.sessionToken,
  };
}
