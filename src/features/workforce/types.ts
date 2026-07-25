/** Env var name holding the Anam lab key for this avatar's slot. */
export type AnamSlot = string;

export type EmployeeStatus = 'active' | 'idle' | 'pending' | 'draft' | 'paused' | 'archived';

export type DigitalEmployee = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  initials: string;
  avatarId: string | null;
  personaId: string | null;
  anamSlot: AnamSlot | null;
  previewUrl: string | null;
  /** provisioningStatus=ready AND slot key present in server env. */
  anamReady: boolean;
  organizationId: string;
};
