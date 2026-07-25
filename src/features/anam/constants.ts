import { DEFAULT_EMPLOYEE_ID, getEmployee } from '@/features/workforce/data/employees';

/** Default Live employee — Kaira (verified on ANAM_API_KEY). */
export const DEFAULT_LIVE_EMPLOYEE_ID = DEFAULT_EMPLOYEE_ID;

export const DEFAULT_LIVE_EMPLOYEE = getEmployee(DEFAULT_LIVE_EMPLOYEE_ID)!;

export const ANAM_VIDEO_ELEMENT_ID = 'nullxes-anam-persona-video';
