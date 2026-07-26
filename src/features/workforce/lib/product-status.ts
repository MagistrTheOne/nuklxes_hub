import type { DigitalEmployee } from '@/features/workforce/types';

/** User-facing availability — never expose Anam/slots/providers. */
export function employeeAvailable(employee: Pick<DigitalEmployee, 'anamReady' | 'status'>) {
  return employee.anamReady && employee.status !== 'archived' && employee.status !== 'draft';
}

export function availabilityLabel(employee: Pick<DigitalEmployee, 'anamReady' | 'status'>) {
  if (employeeAvailable(employee)) return 'available';
  if (employee.status === 'paused') return 'paused';
  return 'unavailable';
}
