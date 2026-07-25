/**
 * Inngest client scaffold — wire keys when the new API credentials arrive.
 * Env: INNGEST_EVENT_KEY, INNGEST_SIGNING_KEY
 */

export type InngestEnv = {
  eventKey: string | null;
  signingKey: string | null;
};

export function getInngestEnv(): InngestEnv {
  return {
    eventKey: process.env.INNGEST_EVENT_KEY?.trim() || null,
    signingKey: process.env.INNGEST_SIGNING_KEY?.trim() || null,
  };
}

export function assertInngestConfigured() {
  const env = getInngestEnv();
  if (!env.eventKey || !env.signingKey) {
    throw new Error('Inngest is not configured (INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY)');
  }
  return env;
}
