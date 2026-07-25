/**
 * Stream Chat channel ids — same scheme as dplatform Talk.
 * Main = private per (employee, user). Max id length 64.
 */

/** Stream channel ids: keep alnum only (Clerk ids contain `_`). */
function compactId(id: string, length = 16): string {
  return id.replace(/[^a-zA-Z0-9]/g, '').slice(0, length);
}

export function talkChannelId(
  employeeId: string,
  threadId?: string | null,
  actorUserId?: string,
): string {
  if (threadId) {
    return `et-${employeeId}-${threadId}`;
  }

  if (!actorUserId) {
    throw new Error('actorUserId is required for the main Talk channel');
  }

  return `etu-${compactId(employeeId)}-${compactId(actorUserId)}`;
}

export function digitalEmployeeChatUserId(employeeId: string): string {
  return `digital-employee-${employeeId}`;
}
