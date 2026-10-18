import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { ActivityIndicator, Pressable } from "react-native";

export function GradientIconButton({
  icon,
  colors,
  size = 64,
  iconSize = 24,
  loading = false,
  disabled = false,
  borderColor,
  onPress,
}: {
  icon: keyof typeof Feather.glyphMap;
  colors: [string, string];
  size?: number;
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  borderColor?: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
      })}
    >
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          width: size,
          height: size,
          borderRadius: size / 2,
          alignItems: "center",
          justifyContent: "center",
          ...(borderColor ? { borderWidth: 3, borderColor } : null),
        }}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Feather color="#FFFFFF" name={icon} size={iconSize} />
        )}
      </LinearGradient>
    </Pressable>
  );
}
