import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

import * as schema from './schema';

function requireDatabaseUrl() {
  const databaseUrl = process.env.DATABASE_URL?.trim();
  if (!databaseUrl) {
    throw new Error('DATABASE_URL is missing from the environment');
  }
  return databaseUrl;
}

/** Single Neon — same DB as nullxesdai / dplatform. */
export function createDb() {
  const sql = neon(requireDatabaseUrl());
  return drizzle({ client: sql, schema });
}

/** @deprecated alias — one DB only */
export const createPlatformDb = createDb;

export type Db = ReturnType<typeof createDb>;
export { schema };
