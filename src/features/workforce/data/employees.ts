/**
 * NULLXES digital employees verified against Anam Lab (org NULLXES).
 * Source of truth later: Neon `employees` + `employee_provider_config` (type=avatar).
 * Preview images: Vercel Blob (wire when URLs land).
 */

export type EmployeeStatus = 'active' | 'idle' | 'pending';

/** Env var name holding the Anam lab key for this avatar's slot. */
export type AnamSlot =
  | 'ANAM_API_KEY'
  | 'ANAM_API_KEY_2'
  | 'ANAM_API_KEY_4'
  | 'ANAM_API_KEY_5'
  | 'ANAM_API_KEY_6'
  | 'ANAM_API_KEY_9'
  | 'ANAM_API_KEY_11';

export type DigitalEmployee = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  initials: string;
  /** Anam avatar UUID (Lab). */
  avatarId: string;
  /** Anam persona UUID used for live sessions. */
  personaId: string;
  anamSlot: AnamSlot;
  /** Verified via GET /avatars + /personas on the slot key. */
  anamReady: boolean;
  /** Vercel Blob preview URL when available. */
  previewUrl?: string;
};

/** Ready on current env slots — Akane / Evgenia / Megan pending recreates. */
export const DIGITAL_EMPLOYEES: DigitalEmployee[] = [
  {
    id: 'anna-maria',
    name: 'ANNA MARIA NULLXES',
    role: 'Co-CEO',
    status: 'active',
    initials: 'AM',
    avatarId: 'b2163ae1-aa94-40ab-b070-fa5fd40f5999',
    personaId: '81c24d31-ff69-4070-8397-81fdd6eece65',
    anamSlot: 'ANAM_API_KEY_2',
    anamReady: true,
  },
  {
    id: 'adeline',
    name: 'Adeline Kalen',
    role: 'Strategy',
    status: 'active',
    initials: 'AK',
    avatarId: '7689f5fd-3aec-496b-baa9-6f585aee0260',
    personaId: '0644210c-9fcf-4815-ad95-51d856e17a51',
    anamSlot: 'ANAM_API_KEY_11',
    anamReady: true,
  },
  {
    id: 'kaira',
    name: 'Kaira NULLXES',
    role: 'Co-CFO',
    status: 'active',
    initials: 'KN',
    avatarId: '4ac2afc2-ebcc-4643-b6ec-2c47b9c2e296',
    personaId: 'f1e1cb69-5c57-4276-b240-c829a2a9fd9f',
    anamSlot: 'ANAM_API_KEY',
    anamReady: true,
  },
  {
    id: 'somnia',
    name: 'Somnia',
    role: 'Operations',
    status: 'active',
    initials: 'SO',
    avatarId: '77ed30b8-4f40-4c58-9a9e-fe5b5eb6ffd3',
    personaId: '0e9ea820-e5a2-4257-9fa0-ed097caeb98e',
    anamSlot: 'ANAM_API_KEY',
    anamReady: true,
  },
  {
    id: 'yuki',
    name: 'Yuki Naruka',
    role: 'Research',
    status: 'active',
    initials: 'YN',
    avatarId: '61c82bf5-3d50-4987-9e72-a9c1bc0b6927',
    personaId: '8babea5d-9bfb-47c8-b954-05e6abe8f891',
    anamSlot: 'ANAM_API_KEY_6',
    anamReady: true,
  },
];

export const WORKFORCE_STATS = {
  active: DIGITAL_EMPLOYEES.filter((e) => e.status === 'active').length,
  live: 0,
  sessions: 0,
} as const;

export const DEFAULT_EMPLOYEE_ID = 'kaira';

export function getEmployee(id: string) {
  return DIGITAL_EMPLOYEES.find((employee) => employee.id === id) ?? null;
}

export function getReadyEmployee(id: string) {
  const employee = getEmployee(id);
  return employee?.anamReady ? employee : null;
}
