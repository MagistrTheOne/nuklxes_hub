import { useAuth, useClerk, useSignUp } from '@clerk/expo';
import { type Href, useRouter } from 'expo-router';
import { AtSign, Lock, Mail, User } from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { AuthField } from '@/features/auth/components/auth-field';
import {
  AuthFormError,
  firstClerkErrorMessage,
} from '@/features/auth/components/auth-form-error';
import { AuthPrimaryButton } from '@/features/auth/components/auth-primary-button';
import { AuthScreen } from '@/features/auth/components/auth-screen';
import { finishAuthSession } from '@/features/auth/lib/navigate-after-auth';
import { resumeExistingAuthSession } from '@/features/auth/lib/resume-session';

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts[0] ?? '',
    lastName: parts.slice(1).join(' ') || parts[0] || 'User',
  };
}

/** Matches Clerk Username settings: 4–64, no extended chars, not digits-only. */
function normalizeUsername(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function validateUsername(value: string): string | null {
  const username = normalizeUsername(value);
  if (username.length < 4 || username.length > 64) {
    return 'Username must be 4–64 characters.';
  }
  if (!/^[a-z0-9_]+$/.test(username)) {
    return 'Use letters, numbers, and underscore only.';
  }
  if (/^\d+$/.test(username)) {
    return 'Username cannot be numbers only.';
  }
  return null;
}

function signUpDebugSnapshot(signUp: {
  status: string | null;
  missingFields: string[];
  unverifiedFields: string[];
  requiredFields: string[];
}) {
  return {
    status: signUp.status,
    missingFields: signUp.missingFields,
    unverifiedFields: signUp.unverifiedFields,
    requiredFields: signUp.requiredFields,
  };
}

export default function SignUpScreen() {
  const { signUp, errors, fetchStatus } = useSignUp();
  const { isSignedIn, getToken } = useAuth();
  const clerk = useClerk();
  const router = useRouter();

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [emailAddress, setEmailAddress] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [pendingVerification, setPendingVerification] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isFinishing, setIsFinishing] = useState(false);

  const isFetching = fetchStatus === 'fetching' || isFinishing;
  const clerkError = firstClerkErrorMessage(errors);
  const visibleError = formError ?? clerkError;

  const finalizeSignUp = async () => {
    setIsFinishing(true);
    try {
      const { error } = await finishAuthSession({
        finalize: (opts) => signUp.finalize(opts),
        routerReplace: (href) => router.replace(href),
        options: {
          getToken,
          email: emailAddress.trim(),
          fullName: fullName.trim(),
          logLabel: 'sign-up',
          clerk,
        },
      });

      if (error) {
        setFormError(error.message ?? 'Could not finish sign up.');
        if (__DEV__) {
          console.warn('[sign-up] finalize error', error);
        }
      }
    } finally {
      // Re-enable the form if navigation did not unmount this screen.
      setIsFinishing(false);
    }
  };

  /** Satisfy leftover Dashboard requirements (legal / names) after email verify. */
  const resolveMissingRequirements = async () => {
    const missing = new Set(signUp.missingFields ?? []);
    if (missing.size === 0) {
      return;
    }

    const patch: {
      legalAccepted?: boolean;
      firstName?: string;
      lastName?: string;
      username?: string;
    } = {};

    if (missing.has('legal_accepted')) {
      patch.legalAccepted = true;
    }

    if (missing.has('username')) {
      patch.username = normalizeUsername(username);
    }

    if (missing.has('first_name') || missing.has('last_name')) {
      const names = splitFullName(fullName);
      if (missing.has('first_name')) {
        patch.firstName = names.firstName;
      }
      if (missing.has('last_name')) {
        patch.lastName = names.lastName;
      }
    }

    if (Object.keys(patch).length === 0) {
      return;
    }

    const { error } = await signUp.update(patch);
    if (error) {
      setFormError(error.message ?? 'Could not complete required sign-up fields.');
      if (__DEV__) {
        console.warn('[sign-up] update missing fields error', error, patch);
      }
    }
  };

  const onCreateAccount = async () => {
    setFormError(null);
    const { firstName, lastName } = splitFullName(fullName);
    const normalizedUsername = normalizeUsername(username);
    const usernameError = validateUsername(normalizedUsername);
    if (usernameError) {
      setFormError(usernameError);
      return;
    }

    // legalAccepted: UI copy already states continuing = agree to Terms/Privacy.
    // username is required by Clerk Dashboard ("Require username").
    const { error } = await signUp.password({
      emailAddress: emailAddress.trim(),
      password,
      username: normalizedUsername,
      firstName,
      lastName,
      legalAccepted: true,
    });

    if (error) {
      setFormError(error.message ?? 'Sign up failed. Check email/password and try again.');
      if (__DEV__) {
        console.warn('[sign-up] password error', error, signUpDebugSnapshot(signUp));
      }
      return;
    }

    if (__DEV__) {
      console.log('[sign-up] after password', signUpDebugSnapshot(signUp));
    }

    const { error: sendError } = await signUp.verifications.sendEmailCode();
    if (sendError) {
      setFormError(sendError.message ?? 'Could not send verification code.');
      if (__DEV__) {
        console.warn('[sign-up] sendEmailCode error', sendError);
      }
      return;
    }

    if (__DEV__) {
      console.log('[sign-up] verification code sent', signUpDebugSnapshot(signUp));
    }
    setPendingVerification(true);
  };

  const syncAndGoHome = async () => {
    setIsFinishing(true);
    setFormError(null);
    try {
      await resumeExistingAuthSession({
        clerk,
        getToken,
        email: emailAddress.trim(),
        fullName: fullName.trim(),
        logLabel: 'sign-up',
        routerReplace: (href) => router.replace(href),
      });
    } catch (error) {
      if (__DEV__) {
        console.warn('[sign-up] resume failed', error);
      }
      setFormError('Could not continue your session. Try again.');
    } finally {
      // Re-enable the form if navigation did not unmount this screen.
      setIsFinishing(false);
    }
  };

  const onVerify = async () => {
    setFormError(null);

    if (isSignedIn) {
      await syncAndGoHome();
      return;
    }

    if (signUp.status !== 'complete') {
      const { error } = await signUp.verifications.verifyEmailCode({ code: code.trim() });

      if (error) {
        const message = error.message ?? 'Invalid verification code.';
        if (/already signed in/i.test(message)) {
          await syncAndGoHome();
          return;
        }
        setFormError(message);
        if (__DEV__) {
          console.warn('[sign-up] verifyEmailCode error', error);
        }
        return;
      }

      if (__DEV__) {
        console.log('[sign-up] after verify', signUpDebugSnapshot(signUp));
      }

      if (signUp.status === 'missing_requirements') {
        await resolveMissingRequirements();
        if (__DEV__) {
          console.log('[sign-up] after resolve missing', signUpDebugSnapshot(signUp));
        }
      }
    }

    if (signUp.status === 'complete') {
      await finalizeSignUp();
      return;
    }

    const missing = (signUp.missingFields ?? []).join(', ') || 'none';
    const unverified = (signUp.unverifiedFields ?? []).join(', ') || 'none';
    setFormError(
      `Sign up incomplete (${signUp.status}). Missing: ${missing}. Unverified: ${unverified}.`,
    );
    if (__DEV__) {
      console.warn('[sign-up] incomplete after verify', signUpDebugSnapshot(signUp));
    }
  };

  // Keep the verify UI mounted while finalize + Neon sync run.
  // Returning null on status===complete used to race finalize / getToken.
  if ((signUp.status === 'complete' || isSignedIn) && !isFinishing && !pendingVerification) {
    return null;
  }

  if (pendingVerification) {
    return (
      <AuthScreen>
        <Text className="mb-1 text-center text-[28px] font-semibold text-white">Verify email</Text>
        <Text className="mb-8 text-center text-[15px] text-white/55">
          Enter the code we sent to {emailAddress || 'your work email'}
        </Text>

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

        <AuthPrimaryButton
          label="Verify"
          onPress={onVerify}
          loading={isFetching}
          disabled={!code}
        />

        <Pressable
          className="mt-4 items-center"
          onPress={async () => {
            setFormError(null);
            const { error } = await signUp.verifications.sendEmailCode();
            if (error) {
              setFormError(error.message ?? 'Could not resend code.');
            }
          }}>
          <Text className="text-[14px] text-white/55">I need a new code</Text>
        </Pressable>
      </AuthScreen>
    );
  }

  return (
    <AuthScreen
      footer={
        <Text className="text-center text-[12px] leading-5 text-white/40">
          By continuing you agree to the <Text className="text-white/70">Terms</Text> and{' '}
          <Text className="text-white/70">Privacy Policy</Text>.
        </Text>
      }>
      <Text className="mb-1 text-center text-[28px] font-semibold text-white">Create account</Text>
      <Text className="mb-8 text-center text-[15px] text-white/55">Set up your workspace</Text>

      <AuthFormError message={visibleError} />

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
        label="Username"
        icon={AtSign}
        value={username}
        onChangeText={setUsername}
        placeholder="nullxes"
        autoCapitalize="none"
        autoComplete="username"
        error={errors.fields.username?.message}
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
        disabled={!fullName || !username || !emailAddress || !password}
      />

      <Pressable className="mt-6 items-center" onPress={() => router.replace('/sign-in' as Href)}>
        <Text className="text-[14px] text-white/55">
          Already have an account? <Text className="font-semibold text-white">Sign in</Text>
        </Text>
      </Pressable>

      <View nativeID="clerk-captcha" />
    </AuthScreen>
  );
}
