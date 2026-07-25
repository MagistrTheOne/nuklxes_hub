import { Image } from 'expo-image';
import { Text, View } from 'react-native';

type EmployeeAvatarProps = {
  initials: string;
  previewUrl?: string | null;
  size?: 'sm' | 'md' | 'lg';
};

export function EmployeeAvatar({ initials, previewUrl, size = 'sm' }: EmployeeAvatarProps) {
  const box =
    size === 'lg'
      ? 'h-[280px] w-full rounded-3xl'
      : size === 'md'
        ? 'h-24 w-24 rounded-3xl'
        : 'h-12 w-12 rounded-2xl';
  const text = size === 'lg' ? 'text-[42px]' : size === 'md' ? 'text-[22px]' : 'text-[14px]';

  if (previewUrl) {
    return (
      <View className={`${box} overflow-hidden bg-[#171717]`}>
        <Image
          source={{ uri: previewUrl }}
          style={{ width: '100%', height: '100%' }}
          contentFit="cover"
          transition={200}
        />
      </View>
    );
  }

  return (
    <View className={`${box} items-center justify-center bg-[#171717]`}>
      <Text className={`${text} font-medium tracking-wide text-white/45`}>{initials}</Text>
    </View>
  );
}
