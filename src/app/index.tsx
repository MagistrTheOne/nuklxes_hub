import { useAuth } from '@clerk/expo';
import { Redirect, type Href } from 'expo-router';

import { useSessionUiStore } from '@/features/app-shell/store/session-ui';
import { AuthLoading } from '@/features/auth/components/auth-loading';

export default function IndexGate() {
  const { isLoaded, isSignedIn } = useAuth();
  const welcomePending = useSessionUiStore((s) => s.welcomePending);

  if (!isLoaded) {
    return <AuthLoading />;
  }

  if (!isSignedIn) {
    return <Redirect href={'/sign-in' as Href} />;
  }

  if (welcomePending) {
    return <Redirect href={'/welcome' as Href} />;
  }

  return <Redirect href={'/(tabs)' as Href} />;
}
