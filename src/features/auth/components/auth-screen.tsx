import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthBrand } from '@/features/auth/components/auth-brand';

type AuthScreenProps = {
  children: ReactNode;
  footer?: ReactNode;
};

export function AuthScreen({ children, footer }: AuthScreenProps) {
  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView
            className="flex-1"
            contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 40, paddingBottom: 32 }}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <AuthBrand />
            <View className="flex-1">{children}</View>
            {footer ? <View className="mt-8 items-center">{footer}</View> : null}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
