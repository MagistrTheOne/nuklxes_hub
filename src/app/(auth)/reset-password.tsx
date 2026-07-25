import { useSignIn } from '@clerk/expo';
import { type Href, Link, useRouter } from 'expo-router';
import { Lock, Mail } from 'lucide-react-native';
import { useState } from 'react';
import { Text } from 'react-native';

import { AuthField } from '@/features/auth/components/auth-field';
import {
  AuthFormError,
  firstClerkErrorMessage,
} from '@/features/auth/components/auth-form-error';
import { AuthPrimaryButton } from '@/features/auth/components/auth-primary-button';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { createAuthNavigate } from '@/features/auth/lib/navigate-after-auth';

export default function ResetPasswordScreen() {
  const { signIn, errors, fetchStatus } = useSignIn();
  const router = useRouter();
  const navigateAfterAuth = createAuthNavigate((href) => router.replace(href));

  const [emailAddress, setEmailAddress] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [codeSent, setCodeSent] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isFetching = fetchStatus === 'fetching';
  const needsNewPassword = signIn.status === 'needs_new_password';
  const visibleError = formError ?? firstClerkErrorMessage(errors);

  const onSendCode = async () => {
    setFormError(null);
    const { error: createError } = await signIn.create({
      identifier: emailAddress.trim(),
    });
    if (createError) {
      setFormError(createError.message ?? 'Could not start password reset.');
      return;
    }

    const { error: sendError } = await signIn.resetPasswordEmailCode.sendCode();
    if (sendError) {
      setFormError(sendError.message ?? 'Could not send reset code.');
      return;
    }

    setCodeSent(true);
  };

  const onVerifyCode = async () => {
    setFormError(null);
    const { error } = await signIn.resetPasswordEmailCode.verifyCode({ code });
    if (error) {
      setFormError(error.message ?? 'Invalid reset code.');
    }
  };

  const onSubmitPassword = async () => {
    setFormError(null);
    const { error } = await signIn.resetPasswordEmailCode.submitPassword({
      password,
      signOutOfOtherSessions: true,
    });

    if (error) {
      setFormError(error.message ?? 'Could not set new password.');
      return;
    }

    if (signIn.status === 'complete') {
      await signIn.finalize({
        navigate: navigateAfterAuth,
      });
    }
  };

  if (needsNewPassword) {
    return (
      <AuthScreen
        footer={
          <Link href={'/sign-in' as Href}>
            <Text className="text-[14px] font-semibold text-white">Back to sign in</Text>
          </Link>
        }>
        <Text className="mb-1 text-[28px] font-semibold text-white">New password</Text>
        <Text className="mb-8 text-[15px] text-white/55">Choose a new password for your account</Text>

        <AuthFormError message={visibleError} />

        <AuthField
          label="New password"
          icon={Lock}
          value={password}
          onChangeText={setPassword}
          placeholder="Min 8 characters"
          secureTextEntry
          autoComplete="new-password"
          error={errors.fields.password?.message}
        />

        <AuthPrimaryButton
          label="Set new password"
          onPress={onSubmitPassword}
          loading={isFetching}
          disabled={!password}
        />
      </AuthScreen>
    );
  }

  if (codeSent) {
    return (
      <AuthScreen
        footer={
          <Link href={'/sign-in' as Href}>
            <Text className="text-[14px] font-semibold text-white">Back to sign in</Text>
          </Link>
        }>
        <Text className="mb-1 text-[28px] font-semibold text-white">Check your email</Text>
        <Text className="mb-8 text-[15px] text-white/55">
          Enter the reset code we sent to your email
        </Text>

        <AuthFormError message={visibleError} />

        <AuthField
          label="Reset code"
          icon={Lock}
          value={code}
          onChangeText={setCode}
          placeholder="123456"
          keyboardType="number-pad"
          error={errors.fields.code?.message}
        />

        <AuthPrimaryButton
          label="Verify code"
          onPress={onVerifyCode}
          loading={isFetching}
          disabled={!code}
        />
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      footer={
        <Link href={'/sign-in' as Href}>
          <Text className="text-[14px] font-semibold text-white">Back to sign in</Text>
        </Link>
      }>
      <Text className="mb-1 text-[28px] font-semibold text-white">Reset password</Text>
      <Text className="mb-8 text-[15px] text-white/55">
        We will send a reset link to your email
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

      <AuthPrimaryButton
        label="Send reset link"
        onPress={onSendCode}
        loading={isFetching}
        disabled={!emailAddress}
      />
    </AuthScreen>
  );
}
