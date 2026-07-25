/**
 * Inngest client scaffold.
 * Wire real keys when the new Inngest app credentials arrive
 * (INNGEST_EVENT_KEY / INNGEST_SIGNING_KEY in .env).
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
  const { eventKey, signingKey } = getInngestEnv();
  if (!eventKey || !signingKey) {
    throw new Error('Inngest is not configured (set INNGEST_EVENT_KEY and INNGEST_SIGNING_KEY)');
  }
  return { eventKey, signingKey };
}
