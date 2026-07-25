import { useAuth, useClerk, useSignIn } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';

import { AuthField } from '@/features/auth/components/auth-field';
import {
  AuthFormError,
  firstClerkErrorMessage,
} from '@/features/auth/components/auth-form-error';
import { AuthPrimaryButton } from '@/features/auth/components/auth-primary-button';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { finishAuthSession } from '@/features/auth/lib/navigate-after-auth';
import { resumeExistingAuthSession } from '@/features/auth/lib/resume-session';

export default function SignInScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const { isSignedIn, getToken } = useAuth();
  const clerk = useClerk();
  const router = useRouter();

  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const isFetching = fetchStatus === 'fetching' || isFinishing;
  const clerkError = firstClerkErrorMessage(errors);
  const visibleError =
    formError ??
    (isFinishing || (clerkError && /already signed in/i.test(clerkError)) ? null : clerkError);

  const finalize = async () => {
    setIsFinishing(true);
    const { error } = await finishAuthSession({
      finalize: (opts) => signIn.finalize(opts),
      routerReplace: (href) => router.replace(href),
      options: {
        getToken,
        email: emailAddress.trim(),
        logLabel: 'sign-in',
        clerk,
      },
    });

    if (error) {
      setIsFinishing(false);
      setFormError(error.message ?? 'Could not finish sign in.');
      if (__DEV__) {
        console.warn('[sign-in] finalize error', error);
      }
    }
  };

  const syncAndGoHome = async () => {
    setIsFinishing(true);
    setFormError(null);
    try {
      await resumeExistingAuthSession({
        clerk,
        getToken,
        email: emailAddress.trim(),
        logLabel: 'sign-in',
        routerReplace: (href) => router.replace(href),
      });
      signIn.reset();
    } catch (error) {
      setIsFinishing(false);
      if (__DEV__) {
        console.warn('[sign-in] resume failed', error);
      }
      setFormError('Could not continue your session. Try again.');
    }
  };

  const onSignIn = async () => {
    setFormError(null);

    if (isSignedIn) {
      await syncAndGoHome();
      return;
    }

    const { error } = await signIn.password({
      emailAddress: emailAddress.trim(),
      password,
    });

    if (error) {
      const message = error.message ?? 'Sign in failed.';
      if (/already signed in/i.test(message)) {
        await syncAndGoHome();
        return;
      }
      setFormError(message);
      if (__DEV__) {
        console.warn('[sign-in] password error', error);
      }
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
      return;
    }

    setFormError(`Sign in incomplete. Status: ${signIn.status}`);
    if (__DEV__) {
      console.warn('[sign-in] incomplete', signIn);
    }
  };

  const onVerify = async () => {
    setFormError(null);
    const { error } = await signIn.mfa.verifyEmailCode({ code });

    if (error) {
      setFormError(error.message ?? 'Invalid verification code.');
      return;
    }

    if (signIn.status === 'complete') {
      await finalize();
      return;
    }

    setFormError(`Verification incomplete. Status: ${signIn.status}`);
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

        <AuthFormError message={visibleError} />

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
      <Text className="mb-1 text-center text-[28px] font-semibold text-white">Sign in</Text>
      <Text className="mb-8 text-center text-[15px] text-white/55">
        Access your digital workforce
      </Text>

      <AuthFormError message={visibleError} />

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
