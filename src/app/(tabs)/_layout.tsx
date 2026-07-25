import { useAuth } from '@clerk/expo';
import { Redirect, Tabs, type Href } from 'expo-router';

import { HubTabBar } from '@/features/app-shell/components/hub-tab-bar';
import { AuthLoading } from '@/features/auth/components/auth-loading';

export default function TabsLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return <AuthLoading />;
  }

  if (!isSignedIn) {
    return <Redirect href={'/sign-in' as Href} />;
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
