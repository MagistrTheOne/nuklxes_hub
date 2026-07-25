import { Text, View } from 'react-native';

type AuthFormErrorProps = {
  message?: string | null;
};

type ClerkMessage = {
  message?: string;
};

export function AuthFormError({ message }: AuthFormErrorProps) {
  if (!message) {
    return null;
  }

  return (
    <View className="mb-4 rounded-xl border border-red-400/30 bg-red-500/10 px-3.5 py-3">
      <Text className="text-[13px] leading-5 text-red-300">{message}</Text>
    </View>
  );
}

export function firstClerkErrorMessage(errors: unknown): string | null {
  if (!errors || typeof errors !== 'object') {
    return null;
  }

  const value = errors as {
    fields?: Record<string, ClerkMessage | null | undefined>;
    global?: Array<ClerkMessage | null | undefined>;
  };

  const fieldMessage = Object.values(value.fields ?? {}).find((item) => item?.message)?.message;
  if (fieldMessage) {
    return fieldMessage;
  }

  return value.global?.find((item) => item?.message)?.message ?? null;
}
