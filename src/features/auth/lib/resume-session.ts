import type { Href } from 'expo-router';

import { useSessionUiStore } from '@/features/app-shell/store/session-ui';
import {
  resolvePendingSessionTasks,
  taskHrefForKey,
} from '@/features/auth/lib/resolve-session-tasks';
import { syncUserAfterAuth } from '@/features/auth/lib/sync-user';

type GetToken = (options?: { skipCache?: boolean }) => Promise<string | null>;

type ClerkSessionLike = {
  id: string;
  status?: string;
  currentTask?: { key?: string } | null;
};

type ClerkLike = {
  session?: ClerkSessionLike | null;
  user?: {
    organizationMemberships?: Array<{ organization?: { id: string } | null }>;
  } | null;
  setActive: (params: {
    session?: string;
    organization?: string | null;
  }) => Promise<unknown>;
  createOrganization?: (params: { name: string }) => Promise<{ id: string }>;
  client?: {
    sessions?: ClerkSessionLike[];
    signedInSessions?: ClerkSessionLike[];
  } | null;
};

export function resolveClerkSessionId(clerk: ClerkLike): string | null {
  if (clerk.session?.id) {
    return clerk.session.id;
  }

  const sessions = clerk.client?.signedInSessions ?? clerk.client?.sessions ?? [];
  const active =
    sessions.find((session) => session.status === 'active' || session.status === 'pending') ??
    sessions[0];
  return active?.id ?? null;
}

/**
 * Clerk password/sign-up can throw "You're already signed in" while useAuth().isSignedIn
 * is still false (session present but pending/inactive). Activate it, clear tasks, sync, route.
 */
export async function resumeExistingAuthSession(params: {
  clerk: ClerkLike;
  getToken: GetToken;
  email: string;
  fullName?: string | null;
  logLabel: string;
  routerReplace: (href: Href) => void;
}) {
  useSessionUiStore.getState().requestWelcome();

  const sessionId = resolveClerkSessionId(params.clerk);
  if (sessionId) {
    try {
      await params.clerk.setActive({ session: sessionId });
    } catch (error) {
      if (__DEV__) {
        console.warn(`[${params.logLabel}] setActive failed`, error);
      }
    }
  }

  const { taskKey, resolved } = await resolvePendingSessionTasks(params.clerk, params.logLabel);
  if (!resolved) {
    const taskHref = taskHrefForKey(taskKey);
    if (taskHref) {
      useSessionUiStore.getState().clearWelcome();
      params.routerReplace(taskHref as Href);
      return;
    }
  }

  await syncUserAfterAuth({
    getToken: params.getToken,
    email: params.email,
    fullName: params.fullName,
    logLabel: params.logLabel,
  });

  params.routerReplace('/welcome' as Href);
}
