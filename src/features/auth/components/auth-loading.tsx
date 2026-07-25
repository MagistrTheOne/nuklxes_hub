import { ActivityIndicator, View } from 'react-native';

export function AuthLoading() {
  return (
    <View className="flex-1 items-center justify-center bg-[#050505]">
      <ActivityIndicator color="#FFFFFF" />
    </View>
  );
}
