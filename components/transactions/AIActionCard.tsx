import { LinearGradient } from "expo-linear-gradient";
import { useEffect } from "react";
import { Pressable, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

const CARD_HEIGHT = 104;

export function AIActionCard({
  icon,
  title,
  subtitle,
  colors,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  subtitle: string;
  colors: [string, string];
  onPress: () => void;
}) {
  const sweep = useSharedValue(0);

  useEffect(() => {
    sweep.value = withRepeat(
      withTiming(-220, { duration: 2600, easing: Easing.linear }),
      -1,
      false,
    );
  }, [sweep]);

  const sweepStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: sweep.value }],
  }));

  return (
    <Pressable
      accessibilityRole="button"
      className="flex-1 overflow-hidden rounded-2xl active:opacity-85"
      onPress={onPress}
      style={{ height: CARD_HEIGHT, backgroundColor: colors[0] }}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ position: "absolute", inset: 0 }}
      />
      <Animated.View
        pointerEvents="none"
        style={[
          {
            position: "absolute",
            top: -50,
            left: "45%",
            width: 56,
            height: 220,
            transform: [{ rotate: "24deg" }],
          },
          sweepStyle,
        ]}
      >
        <LinearGradient
          colors={["transparent", "rgba(255,255,255,0.22)", "transparent"]}
          style={{ flex: 1 }}
        />
      </Animated.View>
      <View className="flex-1 justify-center px-4">
        <View className="mb-2 h-9 w-9 items-center justify-center rounded-full bg-white/20">
          <Feather color="#FFFFFF" name={icon} size={16} />
        </View>
        <Text className="text-[13px] font-semibold text-white">{title}</Text>
        <Text className="mt-0.5 text-[11px] text-white/75">{subtitle}</Text>
      </View>
    </Pressable>
  );
}
