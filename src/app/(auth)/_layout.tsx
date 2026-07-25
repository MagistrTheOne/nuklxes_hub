import { Stack } from 'expo-router';

import { AuthLoading } from '@/features/auth/components/auth-loading';
import { useAuthRedirect } from '@/features/auth/lib/use-auth-redirect';

export default function AuthLayout() {
  const { isLoaded, isSignedIn } = useAuthRedirect('signed-in-away');

  if (!isLoaded) {
    return <AuthLoading />;
  }

  if (isSignedIn) {
    return <AuthLoading />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: '#050505' },
        animation: 'fade',
      }}
    />
  );
}
