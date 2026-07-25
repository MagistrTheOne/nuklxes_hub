import { getReadyEmployee, type AnamSlot } from '@/features/workforce/data/employees';

const KNOWN_SLOTS = new Set<AnamSlot>([
  'ANAM_API_KEY',
  'ANAM_API_KEY_2',
  'ANAM_API_KEY_4',
  'ANAM_API_KEY_5',
  'ANAM_API_KEY_6',
  'ANAM_API_KEY_9',
  'ANAM_API_KEY_11',
]);

export function isAnamSlot(value: unknown): value is AnamSlot {
  return typeof value === 'string' && KNOWN_SLOTS.has(value as AnamSlot);
}

/**
 * Resolve lab API key from env by slot name (e.g. ANAM_API_KEY_2).
 * Never expose the key to the client.
 */
export function resolveAnamApiKey(slot: AnamSlot = 'ANAM_API_KEY') {
  const apiKey = process.env[slot]?.trim();
  if (!apiKey) {
    throw new Error(`${slot} is missing from the environment`);
  }
  return apiKey;
}

export function resolveEmployeeSession(employeeId: string) {
  const employee = getReadyEmployee(employeeId);
  if (!employee) {
    throw new Error(`Employee not ready for Anam live: ${employeeId}`);
  }
  return {
    employee,
    personaConfig: { personaId: employee.personaId },
    anamSlot: employee.anamSlot,
  };
}
