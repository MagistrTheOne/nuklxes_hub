import { Show, useAuth, useClerk, useUser } from '@clerk/expo';
import { Redirect, type Href } from 'expo-router';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthLoading } from '@/features/auth/components/auth-loading';

export default function HomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const { signOut } = useClerk();

  if (!isLoaded) {
    return <AuthLoading />;
  }

  if (!isSignedIn) {
    return <Redirect href={'/sign-in' as Href} />;
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1 px-6">
        <Show when="signed-in">
          <View className="flex-1 justify-center">
            <Text className="text-[56px] font-light leading-none text-white">X</Text>
            <Text className="mt-4 text-[22px] font-semibold tracking-[2px] text-white">
              NULLXES HUB
            </Text>
            <Text className="mt-2 text-[14px] text-white/55">
              Signed in as {user?.primaryEmailAddress?.emailAddress ?? 'user'}
            </Text>
            <Text className="mt-8 text-[15px] leading-6 text-white/70">
              Auth is live. Product screens come next.
            </Text>

            <Pressable
              onPress={() => signOut()}
              className="mt-10 h-12 items-center justify-center rounded-xl border border-white/15 active:opacity-80">
              <Text className="text-[15px] font-medium text-white">Sign out</Text>
            </Pressable>
          </View>
        </Show>
      </SafeAreaView>
    </View>
  );
}
