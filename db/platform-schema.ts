import { jsonb, pgEnum, pgTable, text, timestamp, uuid } from 'drizzle-orm/pg-core';

/**
 * Read-only mirror of NULLXES dplatform tables (web Neon).
 * Do not migrate/push from this app — source of truth is dplatform.
 */

export const employeeStatusEnum = pgEnum('employee_status', [
  'draft',
  'active',
  'paused',
  'archived',
]);

export const avatarProviderEnum = pgEnum('avatar_provider', ['anam', 'nullxes', 'custom']);

export const providerConfigTypeEnum = pgEnum('provider_config_type', [
  'avatar',
  'brain',
  'session',
]);

export const digitalEmployee = pgTable('digital_employee', {
  id: uuid('id').primaryKey().defaultRandom(),
  organizationId: uuid('organization_id').notNull(),
  name: text('name').notNull(),
  description: text('description'),
  role: text('role').notNull(),
  department: text('department'),
  status: employeeStatusEnum('status').notNull().default('draft'),
  avatarProvider: avatarProviderEnum('avatar_provider').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type AnamAvatarProviderConfig = {
  avatarId?: string;
  personaId?: string;
  previewUrl?: string;
  displayName?: string;
  provisioningStatus?: string;
  providerMetadata?: {
    anamApiKeySlot?: string;
    voiceId?: string;
    anamPersonaVoiceId?: string;
    llmId?: string;
    [key: string]: unknown;
  };
  [key: string]: unknown;
};

export const employeeProviderConfig = pgTable('employee_provider_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull(),
  providerType: providerConfigTypeEnum('provider_type').notNull(),
  providerId: text('provider_id').notNull(),
  config: jsonb('config').$type<AnamAvatarProviderConfig>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const organization = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
});
