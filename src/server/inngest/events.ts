/**
 * Typed event names for NULLXES background jobs.
 * Expand when Inngest functions are implemented.
 */
export const InngestEvents = {
  USER_SYNCED: 'nullxes/user.synced',
  PERSONA_SESSION_STARTED: 'nullxes/persona.session.started',
  PERSONA_SESSION_ENDED: 'nullxes/persona.session.ended',
} as const;

export type InngestEventName = (typeof InngestEvents)[keyof typeof InngestEvents];
