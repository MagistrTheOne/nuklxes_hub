import { useAuth, useClerk } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, Text, View } from 'react-native';
import Animated, {
  Easing,
  FadeIn,
  FadeInDown,
  FadeInUp,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthLoading } from '@/features/auth/components/auth-loading';
import { useSessionUiStore } from '@/features/app-shell/store/session-ui';
import { resolvePendingSessionTasks } from '@/features/auth/lib/resolve-session-tasks';

export default function WelcomeScreen() {
  const { isLoaded, isSignedIn } = useAuth({ treatPendingAsSignedOut: false });
  const clerk = useClerk();
  const router = useRouter();
  const clearWelcome = useSessionUiStore((s) => s.clearWelcome);
  const lineWidth = useSharedValue(0);
  const resolvedTasks = useRef(false);

  useEffect(() => {
    lineWidth.value = withDelay(
      280,
      withTiming(72, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [lineWidth]);

  useEffect(() => {
    if (!isLoaded) {
      return;
    }
    if (!isSignedIn) {
      router.replace('/sign-in' as Href);
      return;
    }
    if (resolvedTasks.current) {
      return;
    }
    resolvedTasks.current = true;
    void resolvePendingSessionTasks(clerk, 'welcome');
  }, [clerk, isLoaded, isSignedIn, router]);

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
  }));

  const enterWorkspace = () => {
    clearWelcome();
    router.replace('/(tabs)' as Href);
  };

  if (!isLoaded || !isSignedIn) {
    return <AuthLoading />;
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <View className="absolute inset-0 bg-[#0C0C0C]" />
      <View className="absolute inset-x-0 top-0 h-1/2 bg-[#111111]/60" />
      <SafeAreaView className="flex-1 px-8">
        <View className="flex-1 items-center justify-center">
          <Animated.View
            entering={FadeIn.duration(600)}
            className="h-28 w-28 items-center justify-center rounded-full border border-white/15 bg-[#171717]">
            <Text className="text-[64px] font-light leading-none text-white">X</Text>
          </Animated.View>

          <Animated.Text
            entering={FadeInDown.delay(120).duration(450)}
            className="mt-8 text-[13px] font-semibold tracking-[4px] text-white/60">
            NULLXES HUB
          </Animated.Text>

          <Animated.View style={lineStyle} className="mt-5 h-px bg-white/35" />

          <Animated.Text
            entering={FadeInUp.delay(220).duration(500)}
            className="mt-8 max-w-[320px] text-center text-[32px] font-semibold leading-10 text-white">
            Welcome to NULLXES HUB
          </Animated.Text>

          <Animated.Text
            entering={FadeInUp.delay(340).duration(500)}
            className="mt-4 max-w-[280px] text-center text-[16px] leading-6 text-white/55">
            Ваш цифровой ассистент NULLXES
          </Animated.Text>

          <Animated.Text
            entering={FadeInUp.delay(420).duration(500)}
            className="mt-3 text-center text-[12px] tracking-[2px] text-white/30">
            BEYOND LIMITS
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInUp.delay(480).duration(450)} className="pb-6">
          <Pressable
            onPress={enterWorkspace}
            className="h-14 items-center justify-center rounded-full bg-white active:opacity-90">
            <Text className="text-[16px] font-semibold text-[#050505]">Get started</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
