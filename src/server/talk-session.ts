import { randomUUID } from 'crypto';

import type { TalkBootstrap } from '@/features/talk/types';
import { mintAnamSession } from '@/server/anam';
import { getPlatformEmployee } from '@/server/platform-employees';
import { getReadyFallbackEmployee } from '@/features/workforce/data/employees';

/**
 * Bootstrap Talk like dplatform startTalkSessionAction:
 * { sessionId, sessionToken (Anam), voiceMode }.
 * Brain-stream: POST /api/v1/talk/brain-stream. PCM→Anam mouth attaches on the client next.
 */
export async function bootstrapTalkSession(employeeId: string): Promise<TalkBootstrap> {
  let employee = null as Awaited<ReturnType<typeof getPlatformEmployee>>;

  if (process.env.DATABASE_URL?.trim()) {
    try {
      employee = await getPlatformEmployee(employeeId);
    } catch {
      employee = null;
    }
  }

  if (!employee) {
    employee = getReadyFallbackEmployee(employeeId);
  }

  if (!employee?.anamReady || !employee.personaId || !employee.anamSlot) {
    throw new Error(`Employee not ready for Talk: ${employeeId}`);
  }

  const { sessionToken } = await mintAnamSession({
    employeeId: employee.id,
    clientLabel: 'nullxes-hub-talk',
  });

  return {
    sessionId: randomUUID(),
    sessionToken,
    voiceMode: employee.voiceMode,
    employeeId: employee.id,
    employeeName: employee.name,
    previewUrl: employee.previewUrl,
    voiceId: employee.voiceId,
  };
}
