import type { AnamSlot } from '@/features/workforce/types';

const SLOT_RE = /^ANAM_API_KEY(_\d+)?$/;

export function isAnamSlot(value: unknown): value is AnamSlot {
  return typeof value === 'string' && SLOT_RE.test(value);
}

export function slotKeyPresent(slot: AnamSlot) {
  return Boolean(process.env[slot]?.trim());
}

/**
 * Resolve lab API key from env by slot name (e.g. ANAM_API_KEY_2).
 * Never expose the key to the client.
 */
export function resolveAnamApiKey(slot: AnamSlot = 'ANAM_API_KEY') {
  if (!isAnamSlot(slot)) {
    throw new Error(`Invalid Anam slot: ${String(slot)}`);
  }
  const apiKey = process.env[slot]?.trim();
  if (!apiKey) {
    throw new Error(`${slot} is missing from the environment`);
  }
  return apiKey;
}
