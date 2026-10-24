import { PillGroupProps } from "@/types/transaction";
import { Pressable, ScrollView, Text, View } from "react-native";

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  scrollable = false,
  accentColor = "#1A85FF",
}: PillGroupProps<T>) {
  const pills = (
    <View className={scrollable ? "flex-row gap-2" : "flex-row flex-wrap gap-2"}>
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <Pressable
            key={option.key}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            className={`min-h-10 flex-row items-center gap-2 border px-3 py-2 ${
              option.detail ? "min-w-[144px] rounded-2xl" : "rounded-full"
            }`}
            onPress={() => onChange(option.key)}
            style={{
              backgroundColor: selected ? `${accentColor}18` : "#FFFFFF",
              borderColor: selected ? `${accentColor}80` : "#E7E5DE",
            }}
          >
            {option.icon ? (
              <Text className="text-sm">{option.icon}</Text>
            ) : null}
            <View className={option.detail ? "flex-1" : undefined}>
              <Text
                className={`text-xs font-medium ${
                  selected
                    ? "text-[#1A1D26]"
                    : "text-[#5C5F68]"
                }`}
                numberOfLines={1}
              >
                {option.label}
              </Text>
              {option.detail ? (
                <Text className="mt-1 text-[10px] text-[#5C5F68]">
                  {option.detail}
                </Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );

  if (!scrollable) return pills;

  return (
    <ScrollView
      horizontal
      contentContainerStyle={{ gap: 8, paddingRight: 4 }}
      showsHorizontalScrollIndicator={false}
    >
      {pills}
    </ScrollView>
  );
}
