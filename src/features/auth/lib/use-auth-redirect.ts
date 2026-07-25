import { useAuth } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';

import { useSessionUiStore } from '@/features/app-shell/store/session-ui';

type AuthRedirectMode = 'signed-in-away' | 'signed-out-away' | 'index-gate';

/**
 * Prefer replace over <Redirect /> — Expo Router Redirect uses dismiss() and
 * can ping-pong between sibling stack screens (auth ↔ index ↔ tabs).
 */
export function useAuthRedirect(mode: AuthRedirectMode) {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const welcomePending = useSessionUiStore((s) => s.welcomePending);
  const router = useRouter();
  const lastHref = useRef<string | null>(null);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }

    let href: Href | null = null;

    if (mode === 'signed-in-away') {
      if (!isSignedIn) {
        lastHref.current = null;
        return;
      }
      href = (welcomePending ? '/welcome' : '/(tabs)') as Href;
    } else if (mode === 'signed-out-away') {
      if (isSignedIn) {
        lastHref.current = null;
        return;
      }
      href = '/sign-in' as Href;
    } else {
      if (!isSignedIn) {
        href = '/sign-in' as Href;
      } else if (welcomePending) {
        href = '/welcome' as Href;
      } else {
        href = '/(tabs)' as Href;
      }
    }

    const key = String(href);
    if (lastHref.current === key) {
      return;
    }
    lastHref.current = key;
    router.replace(href);
  }, [isLoaded, isSignedIn, welcomePending, mode, router]);

  return { isLoaded, isSignedIn, welcomePending };
}
