import type { Href } from 'expo-router';

import { useSessionUiStore } from '@/features/app-shell/store/session-ui';
import {
  resolvePendingSessionTasks,
  taskHrefForKey,
} from '@/features/auth/lib/resolve-session-tasks';
import { syncUserAfterAuth } from '@/features/auth/lib/sync-user';

export type AuthNavigateArgs = {
  session?: {
    currentTask?: { key?: string } | null;
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
  clerk?: {
    session?: {
      id: string;
      status?: string;
      currentTask?: { key?: string } | null;
    } | null;
    user?: {
      organizationMemberships?: Array<{ organization?: { id: string } | null }>;
    } | null;
    setActive: (params: {
      session?: string;
      organization?: string | null;
    }) => Promise<unknown>;
    createOrganization?: (params: { name: string }) => Promise<{ id: string }>;
    client?: {
      sessions?: Array<{
        id: string;
        status?: string;
        currentTask?: { key?: string } | null;
      }>;
      signedInSessions?: Array<{
        id: string;
        status?: string;
        currentTask?: { key?: string } | null;
      }>;
    } | null;
  };
};

function navigateToPath(routerReplace: (href: Href) => void, path: string) {
  if (path.startsWith('http')) {
    if (typeof window !== 'undefined') {
      window.location.href = path;
    }
    return;
  }

  routerReplace(path as Href);
}

export function createAuthNavigate(
  routerReplace: (href: Href) => void,
  path: string = '/welcome',
) {
  return ({ session, decorateUrl }: AuthNavigateArgs) => {
    // Pending tasks are resolved by finishAuthSession before this runs.
    // If one remains (e.g. forced password reset), send the user there.
    const taskKey =
      typeof session?.currentTask === 'object' && session?.currentTask
        ? session.currentTask.key ?? null
        : null;
    const taskHref = taskHrefForKey(taskKey);
    if (taskHref) {
      navigateToPath(routerReplace, taskHref);
      return;
    }

    const url = decorateUrl(path);
    navigateToPath(routerReplace, url);
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

  // Before finalize: isSignedIn flips true — auth layout must open welcome, not tabs.
  useSessionUiStore.getState().requestWelcome();

  const { error } = await params.finalize({
    navigate: async (args) => {
      navigateArgs = args;
    },
  });

  if (error) {
    useSessionUiStore.getState().clearWelcome();
    return { error };
  }

  if (params.options.clerk) {
    const { taskKey, resolved } = await resolvePendingSessionTasks(
      params.options.clerk,
      params.options.logLabel,
    );
    if (!resolved) {
      const taskHref = taskHrefForKey(taskKey);
      if (taskHref) {
        useSessionUiStore.getState().clearWelcome();
        params.routerReplace(taskHref as Href);
        return { error: null };
      }
    }
  }

  await syncUserAfterAuth({
    getToken: params.options.getToken,
    session: navigateArgs?.session,
    email: params.options.email,
    fullName: params.options.fullName,
    logLabel: params.options.logLabel,
  });

  const navigateAfterAuth = createAuthNavigate(params.routerReplace, '/welcome');
  if (navigateArgs) {
    navigateAfterAuth(navigateArgs);
  } else {
    params.routerReplace('/welcome' as Href);
  }

  return { error: null };
}
