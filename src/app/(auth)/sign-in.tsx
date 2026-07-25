import { useSignIn } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/features/auth/components/auth-field';
import { AuthPrimaryButton } from '@/features/auth/components/auth-primary-button';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { createAuthNavigate } from '@/features/auth/lib/navigate-after-auth';

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const navigateAfterAuth = createAuthNavigate((href) => router.replace(href));

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const isFetching = fetchStatus === 'fetching';

  const finalize = async () => {
    await signIn.finalize({
      navigate: navigateAfterAuth,
    });
  };

  const onSignIn = async () => {
    const { error } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      return;
    }

    if (signIn.status === 'complete') {
      await finalize();
      return;
    }

    if (signIn.status === 'needs_client_trust') {
      const emailCodeFactor = signIn.supportedSecondFactors?.find(
        (factor) => factor.strategy === 'email_code',
      );
      if (emailCodeFactor) {
        await signIn.mfa.sendEmailCode();
      }
    }
  };

  const onVerify = async () => {
    await signIn.mfa.verifyEmailCode({ code });
    if (signIn.status === 'complete') {
      await finalize();
    }
  };

  if (signIn.status === 'needs_client_trust') {
    return (
      <AuthScreen
        footer={
          <Pressable onPress={() => signIn.reset()}>
            <Text className="text-[14px] text-white/55">Start over</Text>
          </Pressable>
        }>
        <Text className="mb-1 text-[28px] font-semibold text-white">Verify</Text>
        <Text className="mb-8 text-[15px] text-white/55">Enter the code sent to your email</Text>

        <AuthField
          label="Verification code"
          icon={Lock}
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          error={errors.fields.code?.message}
        />

        <AuthPrimaryButton label="Verify" onPress={onVerify} loading={isFetching} />

        <Pressable className="mt-4 items-center" onPress={() => signIn.mfa.sendEmailCode()}>
          <Text className="text-[14px] text-white/55">I need a new code</Text>
        </Pressable>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      footer={
        <Text className="text-[14px] text-white/55">
          New here?{' '}
          <Link href={'/sign-up' as Href} className="font-semibold text-white">
            Create account
          </Link>
        </Text>
      }>
      <Text className="mb-1 text-[28px] font-semibold text-white">Sign in</Text>
      <Text className="mb-8 text-[15px] text-white/55">Access your digital workforce</Text>

      <AuthField
        label="Work email"
        icon={Mail}
        value={emailAddress}
        onChangeText={setEmailAddress}
        placeholder="name@company.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={errors.fields.identifier?.message}
      />

      <AuthField
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="••••••••"
        secureTextEntry
        autoComplete="password"
        error={errors.fields.password?.message}
      />

      <AuthPrimaryButton
        label="Sign in"
        onPress={onSignIn}
        loading={isFetching}
        disabled={!emailAddress || !password}
      />

      <View className="mt-5 flex-row items-center justify-between">
        <Link href={'/reset-password' as Href}>
          <Text className="text-[14px] text-white/55">Forgot password?</Text>
        </Link>
        <Pressable
          onPress={() =>
            Alert.alert('SSO', 'Enterprise SSO will be wired in a later iteration.')
          }>
          <Text className="text-[14px] text-white/55">Use SSO</Text>
        </Pressable>
      </View>
    </AuthScreen>
  );
}
