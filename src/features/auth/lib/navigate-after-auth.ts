import type { Href } from 'expo-router';

import { syncUserAfterAuth } from '@/features/auth/lib/sync-user';

export type AuthNavigateArgs = {
  session?: {
    currentTask?: unknown;
    getToken?: (options?: { skipCache?: boolean }) => Promise<string | null>;
  } | null;
  decorateUrl: (path: string) => string;
};

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

type FinishAuthOptions = {
  getToken: GetToken;
  email: string;
  fullName?: string | null;
  logLabel: string;
};

export function createAuthNavigate(routerReplace: (href: Href) => void) {
  return ({ session, decorateUrl }: AuthNavigateArgs) => {
    if (session?.currentTask) {
      return;
    }

    const url = decorateUrl('/');
    if (url.startsWith('http')) {
      if (typeof window !== 'undefined') {
        window.location.href = url;
      }
      return;
    }

    routerReplace(url as Href);
  };
}

/**
 * Clerk calls finalize navigate *before* the session is active, so getToken() is
 * often null there. Capture args, let finalize finish, then sync + route.
 */
export async function finishAuthSession(params: {
  finalize: (opts: {
    navigate: (args: AuthNavigateArgs) => void | Promise<void>;
  }) => Promise<{ error: { message?: string } | null }>;
  routerReplace: (href: Href) => void;
  options: FinishAuthOptions;
}): Promise<{ error: { message?: string } | null }> {
  let navigateArgs: AuthNavigateArgs | null = null;

  const { error } = await params.finalize({
    navigate: async (args) => {
      navigateArgs = args;
    },
  });

  if (error) {
    return { error };
  }

  await syncUserAfterAuth({
    getToken: params.options.getToken,
    session: navigateArgs?.session,
    email: params.options.email,
    fullName: params.options.fullName,
    logLabel: params.options.logLabel,
  });

  const navigateAfterAuth = createAuthNavigate(params.routerReplace);
  if (navigateArgs) {
    navigateAfterAuth(navigateArgs);
  } else {
    params.routerReplace('/' as Href);
  }

  return { error: null };
}
