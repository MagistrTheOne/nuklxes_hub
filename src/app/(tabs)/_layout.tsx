import { Tabs } from 'expo-router';

import { HubTabBar } from '@/features/app-shell/components/hub-tab-bar';
import { AuthLoading } from '@/features/auth/components/auth-loading';
import { useAuthRedirect } from '@/features/auth/lib/use-auth-redirect';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuthRedirect('signed-out-away');

  if (!isLoaded) {
    return <AuthLoading />;
  }

  if (!isSignedIn) {
    return <AuthLoading />;
  }

  return (
    <Tabs
      // expo-router Tabs props diverge from @react-navigation BottomTabBarProps
      tabBar={(props) => <HubTabBar {...(props as object as Parameters<typeof HubTabBar>[0])} />}
      screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: '#050505' },
      }}>
      <Tabs.Screen name="index" options={{ title: 'Workforce' }} />
      <Tabs.Screen name="live" options={{ title: 'Live' }} />
      <Tabs.Screen name="voice" options={{ title: 'Voice' }} />
      <Tabs.Screen name="talk" options={{ title: 'Talk' }} />
      <Tabs.Screen name="activity" options={{ title: 'Activity' }} />
    </Tabs>
  );
}
