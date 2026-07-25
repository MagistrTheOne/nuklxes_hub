import {
  Crosshair,
  LayoutGrid,
  MessageCircle,
  MessageSquare,
  Mic,
} from 'lucide-react-native';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type HubTabBarProps = {
  state: {
    index: number;
    routes: { key: string; name: string; params?: object }[];
  };
  descriptors: Record<string, { options: { title?: string; href?: string | null } }>;
  navigation: {
    emit: (event: {
      type: 'tabPress';
      target: string;
      canPreventDefault: boolean;
    }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

const ICONS = {
  index: LayoutGrid,
  live: Crosshair,
  voice: Mic,
  talk: MessageSquare,
  chat: MessageCircle,
} as const;

const HIDDEN_TABS = new Set(['activity']);

export function HubTabBar({ state, descriptors, navigation }: HubTabBarProps) {
  const insets = useSafeAreaInsets();
  const visibleRoutes = state.routes.filter((route) => !HIDDEN_TABS.has(route.name));

  return (
    <View
      className="border-t border-white/10 bg-[#050505] px-4 pt-2"
      style={{ paddingBottom: Math.max(insets.bottom, 10) }}>
      <View className="h-16 flex-row items-end justify-between">
        {visibleRoutes.map((route) => {
          const index = state.routes.findIndex((item) => item.key === route.key);
          const focused = state.index === index;
          const { options } = descriptors[route.key];
          const Icon = ICONS[route.name as keyof typeof ICONS] ?? LayoutGrid;
          const isCenter = route.name === 'voice';

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (isCenter) {
            return (
              <Pressable
                key={route.key}
                accessibilityRole="button"
                accessibilityState={focused ? { selected: true } : {}}
                accessibilityLabel={options.title ?? route.name}
                onPress={onPress}
                className="-mt-5 h-16 w-16 items-center justify-center rounded-full bg-white active:opacity-90">
                <Mic size={24} color="#050505" strokeWidth={2.2} />
              </Pressable>
            );
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.title ?? route.name}
              onPress={onPress}
              className="h-12 w-12 items-center justify-center active:opacity-70">
              <Icon size={22} color={focused ? '#FFFFFF' : 'rgba(255,255,255,0.35)'} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
