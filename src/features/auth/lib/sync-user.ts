type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

type SyncUserInput = {
  getToken: GetToken;
  email: string;
  fullName?: string | null;
};

type SessionLike = {
  getToken?: (options?: { skipCache?: boolean }) => Promise<string | null>;
  currentTask?: unknown;
};

function resolveApiUrl(path: string) {
  const base = process.env.EXPO_PUBLIC_API_URL?.replace(/\/$/, '') ?? '';
  return `${base}${path}`;
}

/** Prefer the session from finalize navigate — useAuth getToken is often null until after. */
export async function resolveSessionToken(
  getToken: GetToken,
  session?: SessionLike | null,
): Promise<string | null> {
  if (session?.getToken) {
    const fromSession = await session.getToken({ skipCache: true });
    if (fromSession) {
      return fromSession;
    }
  }

  for (let attempt = 0; attempt < 6; attempt += 1) {
    const token = await getToken({ skipCache: true });
    if (token) {
      return token;
    }
    await new Promise((resolve) => setTimeout(resolve, 75 * (attempt + 1)));
  }

  return null;
}

export async function syncUserToNeon({ getToken, email, fullName }: SyncUserInput) {
  const token = await getToken({ skipCache: true });
  if (!token) {
    throw new Error('Missing Clerk session token');
  }

  const response = await fetch(resolveApiUrl('/api/v1/me'), {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email,
      fullName: fullName ?? null,
    }),
  });

  const json = (await response.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
  } | null;

  if (!response.ok || !json?.success) {
    throw new Error(json?.error ?? `Neon sync failed (${response.status})`);
  }

  return json;
}

export async function syncUserAfterAuth(params: {
  getToken: GetToken;
  session?: SessionLike | null;
  email: string;
  fullName?: string | null;
  logLabel: string;
}) {
  try {
    const token = await resolveSessionToken(params.getToken, params.session);
    if (!token) {
      throw new Error('Missing Clerk session token');
    }

    await syncUserToNeon({
      getToken: async () => token,
      email: params.email,
      fullName: params.fullName,
    });

    if (__DEV__) {
      console.log(`[${params.logLabel}] neon sync ok`);
    }
  } catch (syncError) {
    if (__DEV__) {
      console.warn(`[${params.logLabel}] neon sync failed`, syncError);
    }
  }
}
