import { AuthLoading } from '@/features/auth/components/auth-loading';
import { useAuthRedirect } from '@/features/auth/lib/use-auth-redirect';

export default function IndexGate() {
  const { isLoaded } = useAuthRedirect('index-gate');

  if (!isLoaded) {
    return <AuthLoading />;
  }

  return <AuthLoading />;
}
