export type ActivityFilter = 'activity' | 'live' | 'overnight';

export type MockActivityItem = {
  id: string;
  title: string;
  detail: string;
  age: string;
  filter: ActivityFilter;
  /** Optional first-name key for employee Recent section. */
  employeeKey?: string;
};

export const MOCK_ACTIVITY: MockActivityItem[] = [
  {
    id: '1',
    title: 'Kaira session completed',
    detail: 'Financial review · 25s',
    age: '2d',
    filter: 'activity',
  },
  {
    id: '2',
    title: 'Anna Maria activated',
    detail: 'Provisioning completed',
    age: '11d',
    filter: 'activity',
  },
  {
    id: '3',
    title: 'Anna Maria created',
    detail: 'From dashboard wizard',
    age: '11d',
    filter: 'activity',
  },
  {
    id: '4',
    title: 'Evgenia runtime updated',
    detail: 'Config change applied',
    age: '16d',
    filter: 'activity',
  },
  {
    id: '5',
    title: 'No live sessions',
    detail: 'Nothing in progress right now',
    age: 'now',
    filter: 'live',
  },
  {
    id: '6',
    title: 'Overnight digest ready',
    detail: 'Summary for your workspace',
    age: '1d',
    filter: 'overnight',
  },
  {
    id: '7',
    title: 'Session completed',
    detail: 'Financial review · rated 5.0',
    age: '2d',
    filter: 'activity',
    employeeKey: 'kaira',
  },
  {
    id: '8',
    title: 'Runtime updated',
    detail: 'Access level: Omega',
    age: '9d',
    filter: 'activity',
    employeeKey: 'kaira',
  },
];

export function recentForEmployee(employeeName: string) {
  const key = employeeName.split(/\s+/)[0]?.toLowerCase() ?? '';
  const keyed = MOCK_ACTIVITY.filter(
    (item) => item.employeeKey && key.startsWith(item.employeeKey),
  );
  if (keyed.length > 0) return keyed;
  return MOCK_ACTIVITY.filter((item) => item.filter === 'activity').slice(0, 2);
}
