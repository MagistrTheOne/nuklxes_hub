import { and, eq } from 'drizzle-orm';

import { createPlatformDb } from '../../db/platform';
import {
  digitalEmployee,
  employeeProviderConfig,
  organization,
  type AnamAvatarProviderConfig,
} from '../../db/platform-schema';
import { mapPlatformEmployee } from '@/features/workforce/lib/map-employee';
import type { DigitalEmployee } from '@/features/workforce/types';
import { isAnamSlot, slotKeyPresent } from '@/server/anam-key';

const DEFAULT_ORG_NAME = 'NULLXES';

function resolveOrgId() {
  return process.env.PLATFORM_ORG_ID?.trim() || null;
}

async function resolveNullxesOrgId(db: ReturnType<typeof createPlatformDb>) {
  const fromEnv = resolveOrgId();
  if (fromEnv) return fromEnv;

  const [org] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.name, DEFAULT_ORG_NAME))
    .limit(1);

  return org?.id ?? null;
}

function toEmployee(
  row: {
    id: string;
    name: string;
    role: string;
    status: string;
    organizationId: string;
  },
  config: AnamAvatarProviderConfig | null,
): DigitalEmployee {
  const slot =
    typeof config?.providerMetadata?.anamApiKeySlot === 'string'
      ? config.providerMetadata.anamApiKeySlot
      : null;

  return mapPlatformEmployee({
    id: row.id,
    name: row.name,
    role: row.role,
    status: row.status,
    organizationId: row.organizationId,
    avatarConfig: config,
    slotKeyPresent: slot && isAnamSlot(slot) ? slotKeyPresent(slot) : false,
  });
}

export async function listPlatformEmployees(): Promise<DigitalEmployee[]> {
  const db = createPlatformDb();
  const orgId = await resolveNullxesOrgId(db);
  if (!orgId) {
    throw new Error('NULLXES organization not found in platform DB');
  }

  const rows = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      status: digitalEmployee.status,
      organizationId: digitalEmployee.organizationId,
      avatarConfig: employeeProviderConfig.config,
    })
    .from(digitalEmployee)
    .leftJoin(
      employeeProviderConfig,
      and(
        eq(employeeProviderConfig.employeeId, digitalEmployee.id),
        eq(employeeProviderConfig.providerType, 'avatar'),
      ),
    )
    .where(eq(digitalEmployee.organizationId, orgId));

  return rows
    .map((row) =>
      toEmployee(
        {
          id: row.id,
          name: row.name,
          role: row.role,
          status: row.status,
          organizationId: row.organizationId,
        },
        row.avatarConfig ?? null,
      ),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlatformEmployee(id: string): Promise<DigitalEmployee | null> {
  const db = createPlatformDb();

  const [row] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      status: digitalEmployee.status,
      organizationId: digitalEmployee.organizationId,
      avatarConfig: employeeProviderConfig.config,
    })
    .from(digitalEmployee)
    .leftJoin(
      employeeProviderConfig,
      and(
        eq(employeeProviderConfig.employeeId, digitalEmployee.id),
        eq(employeeProviderConfig.providerType, 'avatar'),
      ),
    )
    .where(eq(digitalEmployee.id, id))
    .limit(1);

  if (!row) return null;

  return toEmployee(
    {
      id: row.id,
      name: row.name,
      role: row.role,
      status: row.status,
      organizationId: row.organizationId,
    },
    row.avatarConfig ?? null,
  );
}
