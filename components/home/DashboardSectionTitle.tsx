import { Text as UiText } from "@/components/ui/text";
import { ArrowRight } from "lucide-react-native";
import { Text, TouchableOpacity, View } from "react-native";

type DashboardSectionTitleProps = {
  title: string;
  action?: string;
  onAction?: () => void;
};

export default function DashboardSectionTitle({
  title,
  action,
  onAction,
}: DashboardSectionTitleProps) {
  return (
    <View className="mb-3.5 flex-row items-center justify-between">
      <UiText className="text-base font-semibold text-[#1A1D26]">
        {title}
      </UiText>
      {action && onAction ? (
        <TouchableOpacity
          accessibilityRole="button"
          onPress={onAction}
          className="flex-row items-center gap-1"
        >
          <Text className="text-xs font-medium text-brand-blue">{action}</Text>
          <ArrowRight size={14} color="#1A85FF" />
        </TouchableOpacity>
      ) : null}
    </View>
  );
}
