import { and, eq } from 'drizzle-orm';
import { alias } from 'drizzle-orm/pg-core';

import { createDb } from '../../../db';
import {
  digitalEmployee,
  employeeProviderConfig,
  employeeRuntime,
  organization,
  type BrainProvider,
  type BrainProviderConfig,
} from '../../../db/schema';

const DEFAULT_ORG_NAME = 'NULLXES';

const brainCfg = alias(employeeProviderConfig, 'brain_cfg');

export type EmployeeBrainContext = {
  id: string;
  name: string;
  role: string;
  organizationId: string;
  brainProvider: BrainProvider;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  model: string | null;
};

async function resolveOrgId(db: ReturnType<typeof createDb>) {
  const fromEnv = process.env.PLATFORM_ORG_ID?.trim();
  if (fromEnv) return fromEnv;

  const [org] = await db
    .select({ id: organization.id })
    .from(organization)
    .where(eq(organization.name, DEFAULT_ORG_NAME))
    .limit(1);

  return org?.id ?? null;
}

export async function loadEmployeeBrain(
  employeeId: string,
): Promise<EmployeeBrainContext | null> {
  const db = createDb();
  const orgId = await resolveOrgId(db);

  const [row] = await db
    .select({
      id: digitalEmployee.id,
      name: digitalEmployee.name,
      role: digitalEmployee.role,
      organizationId: digitalEmployee.organizationId,
      employeeBrainProvider: digitalEmployee.brainProvider,
      runtimeBrainProvider: employeeRuntime.brainProvider,
      systemPrompt: employeeRuntime.systemPrompt,
      temperature: employeeRuntime.temperature,
      maxTokens: employeeRuntime.maxTokens,
      isActive: employeeRuntime.isActive,
      brainProviderId: brainCfg.providerId,
      brainConfig: brainCfg.config,
    })
    .from(digitalEmployee)
    .leftJoin(employeeRuntime, eq(employeeRuntime.employeeId, digitalEmployee.id))
    .leftJoin(
      brainCfg,
      and(eq(brainCfg.employeeId, digitalEmployee.id), eq(brainCfg.providerType, 'brain')),
    )
    .where(eq(digitalEmployee.id, employeeId))
    .limit(1);

  if (!row) return null;
  if (orgId && row.organizationId !== orgId) return null;

  const brainConfig = (row.brainConfig as BrainProviderConfig | null) ?? null;
  const model =
    typeof brainConfig?.model === 'string' && brainConfig.model.trim()
      ? brainConfig.model.trim()
      : null;

  const brainProvider =
    row.runtimeBrainProvider ??
    (row.brainProviderId as BrainProvider | null) ??
    row.employeeBrainProvider;

  return {
    id: row.id,
    name: row.name,
    role: row.role,
    organizationId: row.organizationId,
    brainProvider,
    systemPrompt:
      row.systemPrompt?.trim() ||
      `You are ${row.name}, a ${row.role}. Operate professionally within your organization's digital workforce.`,
    temperature: row.temperature ?? 0.7,
    maxTokens: row.maxTokens ?? 1024,
    model,
  };
}
