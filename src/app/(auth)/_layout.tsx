import { useAuth } from '@clerk/expo';
import { Redirect, Stack } from 'expo-router';

import { AuthLoading } from '@/features/auth/components/auth-loading';

export default function AuthLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  if (!isLoaded) {
    return <AuthLoading />;
  }

  if (isSignedIn) {
    return <Redirect href="/" />;
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
