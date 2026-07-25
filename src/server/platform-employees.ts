import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createDb } from '../../db';
import {
  digitalEmployee,
  employeeProviderConfig,
  organization,
  type AnamAvatarProviderConfig,
  type SessionProviderConfig,
} from '../../db/schema';
import { mapPlatformEmployee } from '@/features/workforce/lib/map-employee';
import type { DigitalEmployee } from '@/features/workforce/types';
import { isAnamSlot, slotKeyPresent } from '@/server/anam-key';

const DEFAULT_ORG_NAME = 'NULLXES';

const avatarCfg = alias(employeeProviderConfig, 'avatar_cfg');
const sessionCfg = alias(employeeProviderConfig, 'session_cfg');

function resolveOrgId() {
  return process.env.PLATFORM_ORG_ID?.trim() || null;
}

async function resolveNullxesOrgId(db: ReturnType<typeof createDb>) {
  const fromEnv = resolveOrgId();
  if (fromEnv) return fromEnv;

  const [org] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.name, DEFAULT_ORG_NAME))
    .limit(1);

  return org?.id ?? null;
}

function toEmployee(row: {
  id: string;
  name: string;
  role: string;
  status: string;
  organizationId: string;
  avatarConfig: AnamAvatarProviderConfig | null;
  sessionConfig: SessionProviderConfig | null;
  sessionProviderId: string | null;
}): DigitalEmployee {
  const avatar = row.avatarConfig;
  const slot =
    typeof avatar?.providerMetadata?.anamApiKeySlot === 'string'
      ? avatar.providerMetadata.anamApiKeySlot
      : null;

  return mapPlatformEmployee({
    id: row.id,
    name: row.name,
    role: row.role,
    status: row.status,
    organizationId: row.organizationId,
    avatarConfig: avatar,
    sessionConfig: row.sessionConfig,
    sessionProviderId: row.sessionProviderId,
    slotKeyPresent: slot && isAnamSlot(slot) ? slotKeyPresent(slot) : false,
  });
}

export async function listPlatformEmployees(): Promise<DigitalEmployee[]> {
  const db = createDb();
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
      avatarConfig: avatarCfg.config,
      sessionConfig: sessionCfg.config,
      sessionProviderId: sessionCfg.providerId,
    })
    .from(digitalEmployee)
    .leftJoin(
      avatarCfg,
      and(eq(avatarCfg.employeeId, digitalEmployee.id), eq(avatarCfg.providerType, 'avatar')),
    )
    .leftJoin(
      sessionCfg,
      and(eq(sessionCfg.employeeId, digitalEmployee.id), eq(sessionCfg.providerType, 'session')),
    )
    .where(eq(digitalEmployee.organizationId, orgId));

  return rows
    .map((row) =>
      toEmployee({
        id: row.id,
        name: row.name,
        role: row.role,
        status: row.status,
        organizationId: row.organizationId,
        avatarConfig: (row.avatarConfig as AnamAvatarProviderConfig | null) ?? null,
        sessionConfig: (row.sessionConfig as SessionProviderConfig | null) ?? null,
        sessionProviderId: row.sessionProviderId ?? null,
      }),
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

export async function getPlatformEmployee(id: string): Promise<DigitalEmployee | null> {
  const db = createDb();

  const [row] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      status: digitalEmployee.status,
      organizationId: digitalEmployee.organizationId,
      avatarConfig: avatarCfg.config,
      sessionConfig: sessionCfg.config,
      sessionProviderId: sessionCfg.providerId,
    })
    .from(digitalEmployee)
    .leftJoin(
      avatarCfg,
      and(eq(avatarCfg.employeeId, digitalEmployee.id), eq(avatarCfg.providerType, 'avatar')),
    )
    .leftJoin(
      sessionCfg,
      and(eq(sessionCfg.employeeId, digitalEmployee.id), eq(sessionCfg.providerType, 'session')),
    )
    .where(eq(digitalEmployee.id, id))
    .limit(1);

  if (!row) return null;

  return toEmployee({
    id: row.id,
    name: row.name,
    role: row.role,
    status: row.status,
    organizationId: row.organizationId,
    avatarConfig: (row.avatarConfig as AnamAvatarProviderConfig | null) ?? null,
    sessionConfig: (row.sessionConfig as SessionProviderConfig | null) ?? null,
    sessionProviderId: row.sessionProviderId ?? null,
  });
}
