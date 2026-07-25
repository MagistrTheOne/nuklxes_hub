import {
  boolean,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
} from 'drizzle-orm/pg-core';

/**
 * Read-only / typed mirror of the single NULLXES Neon (dplatform).
 * Source of truth: platform schema. Do NOT drizzle-kit push from this app.
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

/** Better Auth user — identity source on web. Clerk bridge is separate. */
export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export const organization = pgTable('organization', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull(),
});

export const membership = pgTable('membership', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  organizationId: uuid('organization_id').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
});

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

export type SessionProviderConfig = {
  voiceId?: string;
  studioVoiceId?: string;
  voiceProvider?: 'elevenlabs' | 'anam' | string;
  [key: string]: unknown;
};

export const employeeProviderConfig = pgTable('employee_provider_config', {
  id: uuid('id').primaryKey().defaultRandom(),
  employeeId: uuid('employee_id').notNull(),
  providerType: providerConfigTypeEnum('provider_type').notNull(),
  providerId: text('provider_id').notNull(),
  config: jsonb('config').$type<AnamAvatarProviderConfig | SessionProviderConfig>().notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
});

export type PlatformUser = typeof user.$inferSelect;
