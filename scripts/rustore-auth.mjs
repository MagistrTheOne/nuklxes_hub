/**
 * Smoke-test RuStore Console API auth.
 * Requires RUSTORE_API_KEY_ID + RUSTORE_API_PRIVATE_KEY in .env
 *
 * Usage: node --import tsx ./scripts/rustore-auth.mjs
 *    or: npx tsx ./scripts/rustore-auth.mjs
 */
import 'dotenv/config';

import { getRustoreAuthToken } from '../src/server/rustore/get-auth-token.ts';

const token = await getRustoreAuthToken();
console.log('RuStore JWE ok, length=', token.length);
