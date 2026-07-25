import { getFallbackEmployee, getReadyFallbackEmployee } from '@/features/workforce/data/employees';
import { isAnamSlot, resolveAnamApiKey, slotKeyPresent } from '@/server/anam-key';
import { getPlatformEmployee } from '@/server/platform-employees';

export { isAnamSlot, resolveAnamApiKey, slotKeyPresent };

export async function resolveEmployeeSession(employeeId: string) {
  let employee = null as Awaited<ReturnType<typeof getPlatformEmployee>>;

  if (process.env.PLATFORM_DATABASE_URL?.trim()) {
    try {
      employee = await getPlatformEmployee(employeeId);
    } catch (error) {
      if (typeof __DEV__ !== 'undefined' && __DEV__) {
        console.warn('[anam-slots] platform lookup failed, using fallback', error);
      }
    }
  }

  if (!employee) {
    const fallback = getReadyFallbackEmployee(employeeId) ?? getFallbackEmployee(employeeId);
    if (!fallback?.anamReady || !fallback.personaId || !fallback.anamSlot) {
      throw new Error(`Employee not ready for Anam live: ${employeeId}`);
    }
    return {
      employee: fallback,
      personaConfig: { personaId: fallback.personaId },
      anamSlot: fallback.anamSlot,
    };
  }

  if (!employee.anamReady || !employee.personaId || !employee.anamSlot) {
    throw new Error(`Employee not ready for Anam live: ${employeeId}`);
  }

  return {
    employee,
    personaConfig: { personaId: employee.personaId },
    anamSlot: employee.anamSlot,
  };
}
