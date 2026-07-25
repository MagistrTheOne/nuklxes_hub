export type EmployeeStatus = 'active' | 'idle';

export type MockEmployee = {
  id: string;
  name: string;
  role: string;
  status: EmployeeStatus;
  initials: string;
};

export const MOCK_WORKFORCE_STATS = {
  active: 8,
  live: 0,
  sessions: 3,
} as const;

export const MOCK_EMPLOYEES: MockEmployee[] = [
  {
    id: 'kaira',
    name: 'Kaira Maria',
    role: 'Co-CFO',
    status: 'active',
    initials: 'KM',
  },
  {
    id: 'anna',
    name: 'Anna Maria',
    role: 'Co-CEO',
    status: 'active',
    initials: 'AM',
  },
  {
    id: 'akane',
    name: 'Akane Tsukiyama',
    role: 'Humanoid lead',
    status: 'active',
    initials: 'AT',
  },
  {
    id: 'megan',
    name: 'Megan',
    role: 'Head of marketing',
    status: 'idle',
    initials: 'MG',
  },
];

export function getMockEmployee(id: string) {
  return MOCK_EMPLOYEES.find((employee) => employee.id === id) ?? null;
}
