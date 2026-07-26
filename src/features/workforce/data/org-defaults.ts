/** Platform CEO identity — linked via Neon `user.email` + Clerk. */
export const PLATFORM_CEO_EMAIL = 'ceo@nullxes.com';

/** ANNA MARIA NULLXES — CO-CEO (default chat for ceo@nullxes.com). */
export const ANNA_MARIA_EMPLOYEE_ID = '8f418ec3-286e-4bac-87e0-351783bec70e';

export function preferredEmployeeIdForEmail(email: string | null | undefined): string | null {
  if (!email) return null;
  if (email.trim().toLowerCase() === PLATFORM_CEO_EMAIL) {
    return ANNA_MARIA_EMPLOYEE_ID;
  }
  return null;
}
