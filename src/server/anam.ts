import { isAnamSlot, resolveAnamApiKey, resolveEmployeeSession } from '@/server/anam-slots';
import type { AnamSlot } from '@/features/workforce/data/employees';

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
  anamSlot?: AnamSlot;
  clientLabel?: string;
};

/**
 * Exchange server-side Anam lab key (slot) for a short-lived client session token.
 * @see https://anam.ai/docs/api-reference/sessions/create-session-token
 */
export async function createAnamSessionToken(input: CreateAnamSessionTokenInput) {
  const slot = input.anamSlot ?? 'ANAM_API_KEY';
  const apiKey = resolveAnamApiKey(slot);

  const response = await fetch(`${ANAM_API_BASE}/auth/session-token`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
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
    anamSlot: slot,
  };
}

export type MintAnamSessionInput = {
  employeeId?: string;
  personaConfig?: AnamPersonaConfig;
  anamSlot?: AnamSlot;
  clientLabel?: string;
};

/**
 * Prefer employeeId (server catalog → persona + slot).
 * Fallback: explicit personaConfig + optional anamSlot.
 */
export async function mintAnamSession(input: MintAnamSessionInput) {
  if (input.employeeId) {
    const resolved = resolveEmployeeSession(input.employeeId);
    return createAnamSessionToken({
      personaConfig: resolved.personaConfig,
      anamSlot: resolved.anamSlot,
      clientLabel: input.clientLabel,
    });
  }

  if (!input.personaConfig) {
    throw new Error('employeeId or personaConfig is required');
  }

  const slot = input.anamSlot && isAnamSlot(input.anamSlot) ? input.anamSlot : 'ANAM_API_KEY';
  return createAnamSessionToken({
    personaConfig: input.personaConfig,
    anamSlot: slot,
    clientLabel: input.clientLabel,
  });
}

export { isAnamSlot, resolveAnamApiKey, resolveEmployeeSession };
