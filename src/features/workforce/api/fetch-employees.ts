import type { DigitalEmployee } from '@/features/workforce/types';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

export async function fetchEmployees(getToken: GetToken): Promise<DigitalEmployee[]> {
  const token = await getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/employees'), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: DigitalEmployee[];
  } | null;

  if (!response.ok || !json?.success || !Array.isArray(json.data)) {
    throw new Error(json?.error ?? `Employees request failed (${response.status})`);
  }

  return json.data;
}

export async function fetchEmployee(
  getToken: GetToken,
  id: string,
): Promise<DigitalEmployee | null> {
  const token = await getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl(`/api/v1/employees/${id}`), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.status === 404) {
    return null;
  }

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: DigitalEmployee;
  } | null;

  if (!response.ok || !json?.success || !json.data) {
    throw new Error(json?.error ?? `Employee request failed (${response.status})`);
  }

  return json.data;
}
