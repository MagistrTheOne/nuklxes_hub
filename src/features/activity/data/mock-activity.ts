export type ActivityFilter = 'activity' | 'live' | 'overnight';

export type MockActivityItem = {
  id: string;
  title: string;
  detail: string;
  age: string;
  filter: ActivityFilter;
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
    detail: 'Live feed is a stub until SDK lands',
    age: 'now',
    filter: 'live',
  },
  {
    id: '6',
    title: 'Overnight digest ready',
    detail: 'Summary placeholder',
    age: '1d',
    filter: 'overnight',
  },
];
