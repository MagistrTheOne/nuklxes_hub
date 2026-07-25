import type { AnamAvatarProviderConfig } from '../../../../db/platform-schema';
import type { DigitalEmployee, EmployeeStatus } from '@/features/workforce/types';

function initialsFromName(name: string) {
  const parts = name
    .replace(/NULLXES/gi, '')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'NX';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
}

function normalizeStatus(status: string): EmployeeStatus {
  if (
    status === 'active' ||
    status === 'idle' ||
    status === 'pending' ||
    status === 'draft' ||
    status === 'paused' ||
    status === 'archived'
  ) {
    return status;
  }
  return 'pending';
}

export function mapPlatformEmployee(input: {
  id: string;
  name: string;
  role: string;
  status: string;
  organizationId: string;
  avatarConfig?: AnamAvatarProviderConfig | null;
  slotKeyPresent?: boolean;
}): DigitalEmployee {
  const config = input.avatarConfig ?? {};
  const meta = config.providerMetadata ?? {};
  const avatarId =
    typeof config.avatarId === 'string' && config.avatarId.length > 0
      ? config.avatarId
      : null;
  const personaId =
    typeof config.personaId === 'string' && config.personaId.length > 0
      ? config.personaId
      : null;
  const anamSlot =
    typeof meta.anamApiKeySlot === 'string' && meta.anamApiKeySlot.length > 0
      ? meta.anamApiKeySlot
      : null;
  const previewUrl =
    typeof config.previewUrl === 'string' && config.previewUrl.length > 0
      ? config.previewUrl
      : null;
  const provisioningReady = config.provisioningStatus === 'ready';
  const slotReady = input.slotKeyPresent ?? false;

  return {
    id: input.id,
    name: input.name,
    role: input.role,
    status: normalizeStatus(input.status),
    initials: initialsFromName(input.name),
    avatarId,
    personaId,
    anamSlot,
    previewUrl,
    anamReady: Boolean(
      provisioningReady && avatarId && personaId && anamSlot && slotReady,
    ),
    organizationId: input.organizationId,
  };
}
