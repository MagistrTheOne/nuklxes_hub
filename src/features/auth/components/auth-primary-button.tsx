import { ActivityIndicator, Pressable, Text } from 'react-native';

type AuthPrimaryButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
};

export function AuthPrimaryButton({
  label,
  onPress,
  disabled = false,
  loading = false,
}: AuthPrimaryButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <Pressable
      onPress={onPress}
      disabled={isDisabled}
      className={`mt-2 h-14 items-center justify-center rounded-xl bg-white ${
        isDisabled ? 'opacity-50' : 'active:opacity-90'
      }`}>
      {loading ? (
        <ActivityIndicator color="#050505" />
      ) : (
        <Text className="text-[16px] font-semibold text-[#050505]">{label}</Text>
      )}
    </Pressable>
  );
}
