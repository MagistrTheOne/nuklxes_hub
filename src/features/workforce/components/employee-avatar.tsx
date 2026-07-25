import { Text, View } from 'react-native';

type EmployeeAvatarProps = {
  initials: string;
  size?: 'sm' | 'lg';
};

export function EmployeeAvatar({ initials, size = 'sm' }: EmployeeAvatarProps) {
  const box = size === 'lg' ? 'h-[280px] w-full rounded-3xl' : 'h-12 w-12 rounded-2xl';
  const text = size === 'lg' ? 'text-[42px]' : 'text-[14px]';

  return (
    <View className={`${box} items-center justify-center bg-[#171717]`}>
      <Text className={`${text} font-medium tracking-wide text-white/45`}>{initials}</Text>
    </View>
  );
}
