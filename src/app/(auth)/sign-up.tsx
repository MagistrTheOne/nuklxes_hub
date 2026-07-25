import { useAuth, useSignUp } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/features/auth/components/auth-field';
import { AuthPrimaryButton } from '@/features/auth/components/auth-primary-button';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { createAuthNavigate } from '@/features/auth/lib/navigate-after-auth';

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || undefined,
  };
}

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn } = useAuth();
  const router = useRouter();
  const navigateAfterAuth = createAuthNavigate((href) => router.replace(href));

  const [fullName, setFullName] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');

  const isFetching = fetchStatus === 'fetching';
  const needsEmailVerification =
    signUp.status === 'missing_requirements' &&
    signUp.unverifiedFields.includes('email_address') &&
    signUp.missingFields.length === 0;

  const onCreateAccount = async () => {
    const { firstName, lastName } = splitFullName(fullName);
    const { error } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
      firstName,
      lastName,
    });

    if (error) {
      return;
    }

    await signUp.verifications.sendEmailCode();
  };

  const onVerify = async () => {
    await signUp.verifications.verifyEmailCode({ code });

    if (signUp.status === 'complete') {
      await signUp.finalize({
        navigate: navigateAfterAuth,
      });
    }
  };

  if (signUp.status === 'complete' || isSignedIn) {
    return null;
  }

  if (needsEmailVerification) {
    return (
      <AuthScreen>
        <Text className="mb-1 text-[28px] font-semibold text-white">Verify email</Text>
        <Text className="mb-8 text-[15px] text-white/55">
          Enter the code we sent to your work email
        </Text>

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

        <Pressable
          className="mt-4 items-center"
          onPress={() => signUp.verifications.sendEmailCode()}>
          <Text className="text-[14px] text-white/55">I need a new code</Text>
        </Pressable>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      footer={
        <Text className="text-center text-[12px] leading-5 text-white/40">
          By continuing you agree to the{' '}
          <Text className="text-white/70">Terms</Text> and{' '}
          <Text className="text-white/70">Privacy Policy</Text>.
        </Text>
      }>
      <Text className="mb-1 text-[28px] font-semibold text-white">Create account</Text>
      <Text className="mb-8 text-[15px] text-white/55">Set up your workspace</Text>

      <AuthField
        label="Full name"
        icon={User}
        value={fullName}
        onChangeText={setFullName}
        placeholder="Maxim Onyushko"
        autoComplete="name"
        error={errors.fields.firstName?.message ?? errors.fields.lastName?.message}
      />

      <AuthField
        label="Work email"
        icon={Mail}
        value={emailAddress}
        onChangeText={setEmailAddress}
        placeholder="name@company.com"
        autoCapitalize="none"
        keyboardType="email-address"
        autoComplete="email"
        error={errors.fields.emailAddress?.message}
      />

      <AuthField
        label="Password"
        icon={Lock}
        value={password}
        onChangeText={setPassword}
        placeholder="Min 8 characters"
        secureTextEntry
        autoComplete="new-password"
        error={errors.fields.password?.message}
      />

      <AuthPrimaryButton
        label="Create account"
        onPress={onCreateAccount}
        loading={isFetching}
        disabled={!fullName || !emailAddress || !password}
      />

      <Pressable className="mt-6 items-center" onPress={() => router.replace('/sign-in' as Href)}>
        <Text className="text-[14px] text-white/55">
          Already have an account? <Text className="font-semibold text-white">Sign in</Text>
        </Text>
      </Pressable>

      {/* Required for Clerk bot protection on sign-up */}
      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}
