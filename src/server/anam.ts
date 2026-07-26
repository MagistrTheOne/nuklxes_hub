import type { AnamSlot } from '@/features/workforce/types';
import { isAnamSlot, resolveAnamApiKey } from '@/server/anam-key';
import { resolveEmployeeSession } from '@/server/anam-slots';

const ANAM_API_BASE = (
  process.env.ANAM_API_BASE_URL?.trim() || 'https://api.anam.ai/v1'
).replace(/\/$/, '');

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
 * Lab keys often have concurrency=1. Stop orphaned active sessions so Hub can mint again.
 * @see https://anam.ai/docs/api-reference/sessions/get-current-concurrency-status
 */
async function releaseAnamConcurrencySlot(apiKey: string) {
  try {
    const concRes = await fetch(`${ANAM_API_BASE}/sessions/concurrency`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const conc = (await concRes.json().catch(() => null)) as {
      canStartSession?: boolean;
      active?: number;
      limit?: number;
    } | null;

    if (!concRes.ok || conc?.canStartSession !== false) return;

    const listRes = await fetch(`${ANAM_API_BASE}/sessions?status=active`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    const list = (await listRes.json().catch(() => null)) as {
      data?: { id?: string }[];
    } | null;

    for (const session of list?.data ?? []) {
      if (!session.id) continue;
      try {
        await fetch(`${ANAM_API_BASE}/sessions/${session.id}/stop`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${apiKey}` },
        });
      } catch {
        // best-effort
      }
    }
  } catch {
    // non-fatal — mint may still fail with concurrency error
  }
}

/**
 * Exchange server-side Anam lab key (slot) for a short-lived client session token.
 * @see https://anam.ai/docs/api-reference/sessions/create-session-token
 */
export async function createAnamSessionToken(input: CreateAnamSessionTokenInput) {
  const slot = input.anamSlot ?? 'ANAM_API_KEY';
  const apiKey = resolveAnamApiKey(slot);

  await releaseAnamConcurrencySlot(apiKey);

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
    const resolved = await resolveEmployeeSession(input.employeeId);
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

export { isAnamSlot, resolveAnamApiKey } from '@/server/anam-key';
export { resolveEmployeeSession } from '@/server/anam-slots';
