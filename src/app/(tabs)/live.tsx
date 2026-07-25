import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LiveScreen() {
  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1 px-5" edges={['top']}>
        <Text className="pt-2 text-[28px] font-semibold text-white">Live</Text>
        <Text className="mt-3 text-[15px] leading-6 text-white/45">
          Live sessions stub. Realtime presence arrives with the assistant SDK.
        </Text>
        <View className="mt-10 items-center justify-center rounded-3xl border border-dashed border-white/15 px-6 py-16">
          <Text className="text-[14px] text-white/35">0 live · placeholder</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}
