import type { TalkVoiceMode } from '@/features/talk/types';

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
  /** Vercel Blob preview (avatarPreviewUrl on platform). */
  previewUrl: string | null;
  /** provisioningStatus=ready AND slot key present in server env. */
  anamReady: boolean;
  organizationId: string;
  /** From employee_provider_config type=session */
  voiceMode: TalkVoiceMode;
  voiceId: string | null;
  studioVoiceId: string | null;
};
