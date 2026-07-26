import '../global.css';

import { ClerkProvider } from '@clerk/expo';
import { tokenCache } from '@clerk/expo/token-cache';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { initRustoreSdks } from '@/features/rustore';
import { AppQueryProvider } from '@/lib/query-client';

SplashScreen.preventAutoHideAsync();

const publishableKey = process.env.EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY ?? '';

export default function RootLayout() {
  useEffect(() => {
    void initRustoreSdks().catch(() => {
      // Never crash the process on optional store SDKs.
    });
    SplashScreen.hideAsync();
  }, []);

  if (!publishableKey) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: '#050505',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}>
        <StatusBar style="light" />
        <Text style={{ color: '#fff', fontSize: 16, textAlign: 'center' }}>
          Missing EXPO_PUBLIC_CLERK_PUBLISHABLE_KEY in this build.
        </Text>
      </View>
    );
  }

  return (
    <ClerkProvider
      publishableKey={publishableKey}
      tokenCache={tokenCache}
      taskUrls={{
        // Do not map choose-organization → /welcome (fights app routing).
        'reset-password': '/reset-password',
      }}>
      <AppQueryProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: '#050505' },
            animation: 'fade',
          }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="welcome" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="employee" />
          <Stack.Screen
            name="xai-adeline"
            options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
          />
        </Stack>
      </AppQueryProvider>
    </ClerkProvider>
  );
}
