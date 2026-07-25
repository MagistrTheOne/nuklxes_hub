import { Mic } from 'lucide-react-native';
import { Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function VoiceScreen() {
  return (
    <View className="flex-1 bg-[#050505]">
      <SafeAreaView className="flex-1 items-center justify-center px-5" edges={['top']}>
        <View className="h-24 w-24 items-center justify-center rounded-full bg-white">
          <Mic size={36} color="#050505" />
        </View>
        <Text className="mt-8 text-[22px] font-semibold text-white">Voice</Text>
        <Text className="mt-3 text-center text-[15px] leading-6 text-white/45">
          Voice session stub. Mic pipeline + avatar runtime come later.
        </Text>
      </SafeAreaView>
    </View>
  );
}
