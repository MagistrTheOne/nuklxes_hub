/**
 * Offline / bootstrap fallback for NULLXES org employees.
 * Live source: PLATFORM_DATABASE_URL → digital_employee + employee_provider_config.
 */

import type { DigitalEmployee } from '@/features/workforce/types';

export type { AnamSlot, DigitalEmployee, EmployeeStatus } from '@/features/workforce/types';

/** NULLXES org on dplatform Neon. */
export const NULLXES_ORG_ID = '58eaf337-1081-4402-9abe-c3d28d51dda6';

/** Kaira — verified on ANAM_API_KEY. */
export const DEFAULT_EMPLOYEE_ID = 'a8a5fb9e-4c84-489f-9097-8245349b4348';

/**
 * Snapshot from platform DB (2026-07-25).
 * anamReady reflects local env slot keys (Akane/Evgenia/Megan need _5/_9/_4).
 */
export const FALLBACK_EMPLOYEES: DigitalEmployee[] = [
  {
    id: '8f418ec3-286e-4bac-87e0-351783bec70e',
    name: 'ANNA MARIA NULLXES',
    role: 'CO-CEO NULLXES',
    status: 'active',
    initials: 'AM',
    avatarId: 'b2163ae1-aa94-40ab-b070-fa5fd40f5999',
    personaId: '81c24d31-ff69-4070-8397-81fdd6eece65',
    anamSlot: 'ANAM_API_KEY_2',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/yDcySBiTFbk9RVgIYhpsS08xdSfsCCQV/one-shot_yDcySBiTFbk9RVgIYhpsS08xdSfsCCQV_anna-maria-nullxes1784069599151-cropped-tVY22TG8bVCR9uNWjAwGkfdib1ISDj.png',
    anamReady: true,
    organizationId: NULLXES_ORG_ID,
  },
  {
    id: 'b0ab9bc2-aed4-4e1c-875f-dfb9180d234a',
    name: 'Adeline Kalen',
    role: 'Head of the Interworld Department NULLXES',
    status: 'active',
    initials: 'AK',
    avatarId: '7689f5fd-3aec-496b-baa9-6f585aee0260',
    personaId: '0644210c-9fcf-4815-ad95-51d856e17a51',
    anamSlot: 'ANAM_API_KEY_11',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/PiLHc6bJdbIh84H_-_z5GvdJfYfml8O0/one-shot_PiLHc6bJdbIh84H_-_z5GvdJfYfml8O0_adeline-kalen1783423254149-cropped-KguSoC2DGQOzqUzGy89n7caTkrLJXM.png',
    anamReady: true,
    organizationId: NULLXES_ORG_ID,
  },
  {
    id: 'd746a010-58bf-4ceb-8fa1-db4ed5db3bc2',
    name: 'Akane Tsukiyama',
    role: 'Entertiprise humanoid Lead',
    status: 'active',
    initials: 'AT',
    avatarId: '3f2bc000-c321-47b0-8059-b918a6c5c5cf',
    personaId: '653e200a-f937-4541-a33b-dabc01f218c5',
    anamSlot: 'ANAM_API_KEY_5',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/HF_scAdfTClWEcWybNeAIv1jSolKa1tV/one-shot_HF_scAdfTClWEcWybNeAIv1jSolKa1tV_akane-tsukiyama1782590009557-cropped-jYLNbJcqBK5yflw1CAi4xxJmvvmmQh.png',
    anamReady: false,
    organizationId: NULLXES_ORG_ID,
  },
  {
    id: 'fff66248-d7c0-4187-9930-550afef28748',
    name: 'Evgenia Emelyanova',
    role: 'CFO for CEO NULLXES',
    status: 'active',
    initials: 'EE',
    avatarId: '603b82ea-ab57-4c40-a1b2-5c29171dca1a',
    personaId: '96869f7a-8ee8-45ca-81f3-40adbddc777f',
    anamSlot: 'ANAM_API_KEY_9',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/Y5BH0i3qonbSOYMVRsrm-1vEuzJBKCom/one-shot_Y5BH0i3qonbSOYMVRsrm-1vEuzJBKCom_evgenia-emelyanova1783038573320-cropped-KTHngQQdDpk3JhjRMR0QMh569dK12h.png',
    anamReady: false,
    organizationId: NULLXES_ORG_ID,
  },
  {
    id: 'a8a5fb9e-4c84-489f-9097-8245349b4348',
    name: 'Kaira NULLXES',
    role: 'Enterprise CO-CFO NULLXES for Helpingo CEO Maxim Onyushko',
    status: 'active',
    initials: 'KN',
    avatarId: '4ac2afc2-ebcc-4643-b6ec-2c47b9c2e296',
    personaId: 'f1e1cb69-5c57-4276-b240-c829a2a9fd9f',
    anamSlot: 'ANAM_API_KEY',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/ZSsrbQD-Zdw6k5agy2uUITTlzb38natv/one-shot_ZSsrbQD-Zdw6k5agy2uUITTlzb38natv_kaira-nullxes1782523311734-cropped-ppNMTqnmFIPgVjKS4KMlIvNIEbVTnC.png',
    anamReady: true,
    organizationId: NULLXES_ORG_ID,
  },
  {
    id: 'f6863598-3f64-4aef-8dba-a1596315a9c4',
    name: 'Megan NULLXES',
    role: 'Enterprise Head of Marketing',
    status: 'active',
    initials: 'MG',
    avatarId: 'f968b9d7-e4cb-466b-a443-60a618bf8d66',
    personaId: 'da9e34e6-f601-4b97-a5ba-b98af2e63dfc',
    anamSlot: 'ANAM_API_KEY_4',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/XSeVksE0pMaCCRLLJP2CyiIto8npb5Jk/one-shot_XSeVksE0pMaCCRLLJP2CyiIto8npb5Jk_megan-nullxes1782587787279-cropped-7MfnZ4ebDA4K9YRQ3sNSuKKw8tU2ra.png',
    anamReady: false,
    organizationId: NULLXES_ORG_ID,
  },
  {
    id: '2dc76351-269c-4bc0-b085-1589b9acef61',
    name: 'Somnia',
    role: 'Enterprise CEO NULLXES Support role Somnia',
    status: 'active',
    initials: 'SO',
    avatarId: '77ed30b8-4f40-4c58-9a9e-fe5b5eb6ffd3',
    personaId: '0e9ea820-e5a2-4257-9fa0-ed097caeb98e',
    anamSlot: 'ANAM_API_KEY',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/ZSsrbQD-Zdw6k5agy2uUITTlzb38natv/one-shot_ZSsrbQD-Zdw6k5agy2uUITTlzb38natv_somnia1780699165409-refined-ncveH1N4nWvY5SKINnF70uo9nb70Kk.png',
    anamReady: true,
    organizationId: NULLXES_ORG_ID,
  },
  {
    id: '28582def-fbe3-42cb-ba6e-8a3f2c938622',
    name: 'Yuki Naruka',
    role: 'NULLXES Enterprise B2B SALES',
    status: 'active',
    initials: 'YN',
    avatarId: '61c82bf5-3d50-4987-9e72-a9c1bc0b6927',
    personaId: '8babea5d-9bfb-47c8-b954-05e6abe8f891',
    anamSlot: 'ANAM_API_KEY_6',
    previewUrl:
      'https://newgxnc1uqs0jnqm.public.blob.vercel-storage.com/avatar-previews/2ZnPZeUbwRdtHPCUejkDsLj10KX_L9dq/one-shot_2ZnPZeUbwRdtHPCUejkDsLj10KX_L9dq_yuki-naruka1782759347868-cropped-MKlWoB4gSmprA9xXNRn5SGUR6UahCI.png',
    anamReady: true,
    organizationId: NULLXES_ORG_ID,
  },
];

/** @deprecated use FALLBACK_EMPLOYEES — kept for existing imports during transition */
export const DIGITAL_EMPLOYEES = FALLBACK_EMPLOYEES;

export const WORKFORCE_STATS = {
  active: FALLBACK_EMPLOYEES.filter((e) => e.status === 'active').length,
  live: 0,
  sessions: 0,
} as const;

export function getFallbackEmployee(id: string) {
  return FALLBACK_EMPLOYEES.find((employee) => employee.id === id) ?? null;
}

export function getReadyFallbackEmployee(id: string) {
  const employee = getFallbackEmployee(id);
  return employee?.anamReady ? employee : null;
}

export function getEmployee(id: string) {
  return getFallbackEmployee(id);
}

export function getReadyEmployee(id: string) {
  return getReadyFallbackEmployee(id);
}
