import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as platformSchema from './platform-schema';

function requirePlatformDatabaseUrl() {
  const databaseUrl = process.env.PLATFORM_DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('PLATFORM_DATABASE_URL is missing from the environment');
  }
  return databaseUrl;
}

/** Read-only connection to NULLXES dplatform Neon (employees / Anam config). */
export function createPlatformDb() {
  const sql = neon(requirePlatformDatabaseUrl());
  return drizzle({ client: sql, schema: platformSchema });
}

export type PlatformDb = ReturnType<typeof createPlatformDb>;
export { platformSchema };
