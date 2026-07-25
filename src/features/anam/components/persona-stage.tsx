import { Text, View } from 'react-native';

type PersonaStageProps = {
  className?: string;
};

/** Native placeholder until WebView / RN WebRTC path lands. */
export function PersonaStage({ className }: PersonaStageProps) {
  return (
    <View
      className={`items-center justify-center rounded-2xl border border-dashed border-white/15 bg-[#0B0B0B] px-6 py-16 ${className ?? ''}`}>
      <Text className="text-center text-[14px] text-white/40">
        Avatar stream requires web runtime or native WebRTC bridge
      </Text>
    </View>
  );
}
