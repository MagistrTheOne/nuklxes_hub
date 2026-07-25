import type { ComponentType } from 'react';
import { Text, TextInput, View, type TextInputProps } from 'react-native';
import type { SvgProps } from 'react-native-svg';

type AuthFieldProps = TextInputProps & {
  label: string;
  icon: ComponentType<SvgProps & { size?: number | string; color?: string }>;
  error?: string;
};

export function AuthField({ label, icon: Icon, error, ...inputProps }: AuthFieldProps) {
  return (
    <View className="mb-4">
      <Text className="mb-2 text-[13px] text-white/55">{label}</Text>
      <View className="h-14 flex-row items-center rounded-xl border border-white/15 bg-[#0B0B0B] px-3.5">
        <Icon size={18} color="rgba(255,255,255,0.45)" />
        <TextInput
          className="ml-3 flex-1 text-[15px] text-white"
          placeholderTextColor="rgba(255,255,255,0.35)"
          {...inputProps}
        />
      </View>
      {error ? <Text className="mt-1.5 text-[12px] text-red-400">{error}</Text> : null}
    </View>
  );
}
