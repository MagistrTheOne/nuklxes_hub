import { useAuth } from '@clerk/expo';
import { type Href, Redirect, useRouter } from 'expo-router';
import { useEffect } from 'react';
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

export default function WelcomeScreen() {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const clearWelcome = useSessionUiStore((s) => s.clearWelcome);
  const lineWidth = useSharedValue(0);

  useEffect(() => {
    lineWidth.value = withDelay(
      280,
      withTiming(48, { duration: 700, easing: Easing.out(Easing.cubic) }),
    );
  }, [lineWidth]);

  const lineStyle = useAnimatedStyle(() => ({
    width: lineWidth.value,
  }));

  const enterWorkspace = () => {
    clearWelcome();
    router.replace('/(tabs)' as Href);
  };

  if (!isLoaded) {
    return <AuthLoading />;
  }

  if (!isSignedIn) {
    return <Redirect href={'/sign-in' as Href} />;
  }

  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1 px-7">
        <View className="flex-1 items-center justify-center">
          <Animated.Text
            entering={FadeIn.duration(500)}
            className="text-[72px] font-light leading-none text-white">
            X
          </Animated.Text>

          <Animated.Text
            entering={FadeInDown.delay(120).duration(450)}
            className="mt-5 text-[12px] font-semibold tracking-[3px] text-white/45">
            NULLXES HUB
          </Animated.Text>

          <Animated.View
            style={lineStyle}
            className="mt-6 h-px bg-white/25"
          />

          <Animated.Text
            entering={FadeInUp.delay(220).duration(500)}
            className="mt-8 text-center text-[28px] font-semibold leading-9 text-white">
            Welcome to NULLXES HUB
          </Animated.Text>

          <Animated.Text
            entering={FadeInUp.delay(340).duration(500)}
            className="mt-3 text-center text-[15px] leading-6 text-white/50">
            Ваш цифровой ассистент NULLXES
          </Animated.Text>
        </View>

        <Animated.View entering={FadeInUp.delay(480).duration(450)} className="pb-4">
          <Pressable
            onPress={enterWorkspace}
            className="h-14 items-center justify-center rounded-2xl bg-white active:opacity-90">
            <Text className="text-[16px] font-semibold text-[#050505]">Get started</Text>
          </Pressable>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
}
