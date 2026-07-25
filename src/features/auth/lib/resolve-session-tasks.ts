type SessionTaskLike = {
  key?: string;
};

type OrganizationMembershipLike = {
  organization?: { id: string; name?: string } | null;
};

type ClerkSessionLike = {
  id: string;
  status?: string;
  currentTask?: SessionTaskLike | null;
};

type ClerkLike = {
  session?: ClerkSessionLike | null;
  user?: {
    organizationMemberships?: OrganizationMembershipLike[];
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

function getSession(clerk: ClerkLike): ClerkSessionLike | null {
  if (clerk.session) {
    return clerk.session;
  }

  const sessions = clerk.client?.signedInSessions ?? clerk.client?.sessions ?? [];
  return sessions.find((session) => session.status === 'active' || session.status === 'pending') ?? sessions[0] ?? null;
}

/**
 * Pending Clerk session tasks keep isSignedIn=false by default.
 * Resolve the common post-auth blockers so the user can enter the hub.
 */
export async function resolvePendingSessionTasks(
  clerk: ClerkLike,
  logLabel: string,
): Promise<{ taskKey: string | null; resolved: boolean }> {
  const session = getSession(clerk);
  const taskKey = session?.currentTask?.key ?? null;

  if (!session || !taskKey) {
    return { taskKey: null, resolved: true };
  }

  if (__DEV__) {
    console.log(`[${logLabel}] pending session task`, taskKey);
  }

  if (taskKey === 'choose-organization') {
    try {
      const memberships = clerk.user?.organizationMemberships ?? [];
      const existingOrgId = memberships[0]?.organization?.id;

      if (existingOrgId) {
        await clerk.setActive({ session: session.id, organization: existingOrgId });
        return { taskKey, resolved: true };
      }

      // Prefer personal account when Clerk allows it.
      try {
        await clerk.setActive({ session: session.id, organization: null });
        if (!getSession(clerk)?.currentTask) {
          return { taskKey, resolved: true };
        }
      } catch {
        // Personal accounts may be disabled for this instance.
      }

      if (clerk.createOrganization) {
        const organization = await clerk.createOrganization({ name: 'Personal workspace' });
        await clerk.setActive({ session: session.id, organization: organization.id });
        return { taskKey, resolved: true };
      }
    } catch (error) {
      if (__DEV__) {
        console.warn(`[${logLabel}] failed to resolve choose-organization`, error);
      }
      return { taskKey, resolved: false };
    }
  }

  // reset-password / setup-mfa need dedicated screens — caller routes via taskUrls.
  return { taskKey, resolved: false };
}

export function taskHrefForKey(taskKey: string | null): '/reset-password' | null {
  if (taskKey === 'reset-password') {
    return '/reset-password';
  }
  return null;
}
