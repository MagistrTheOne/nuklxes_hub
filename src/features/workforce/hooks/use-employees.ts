import { useAuth } from '@clerk/expo';
import { useQuery } from '@tanstack/react-query';

import { fetchEmployee, fetchEmployees } from '@/features/workforce/api/fetch-employees';
import { FALLBACK_EMPLOYEES, getFallbackEmployee } from '@/features/workforce/data/employees';

export function useEmployees() {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['employees'],
    enabled: Boolean(isSignedIn),
    queryFn: () => fetchEmployees(getToken),
    staleTime: 60_000,
    placeholderData: FALLBACK_EMPLOYEES,
  });
}

export function useEmployee(id: string) {
  const { getToken, isSignedIn } = useAuth();

  return useQuery({
    queryKey: ['employees', id],
    enabled: Boolean(isSignedIn && id),
    queryFn: () => fetchEmployee(getToken, id),
    staleTime: 60_000,
    placeholderData: () => getFallbackEmployee(id),
  });
}
