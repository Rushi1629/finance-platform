import { getCategoryConfig } from "@/constants/categories";
import { formatPrice } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";
import { format } from "date-fns";
import { Feather } from "@expo/vector-icons";
import Swipeable from "react-native-gesture-handler/ReanimatedSwipeable";
import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";

type TransactionListItemProps = {
  transaction: Transaction;
  currency: string;
  accountName?: string;
  showDivider: boolean;
  onDelete?: () => void;
};

export default function TransactionListItem({
  transaction,
  currency,
  accountName,
  showDivider,
  onDelete,
}: TransactionListItemProps) {
  const category = getCategoryConfig(transaction.category);
  const isIncome = transaction.type === "INCOME";
  const description = transaction.description?.trim() || category.label;
  const [isSwipeOpen, setIsSwipeOpen] = useState(false);

  const row = (
    <View
      className={`flex-row items-center bg-white rounded-2xl
        py-3.5 px-1.5 ${showDivider ? "border-b border-[#F0EEE9]" : ""}`}
    >
      <View
        className="mr-3 h-11 w-11 items-center justify-center rounded-2xl"
        style={{ backgroundColor: `${category.color}20` }}
      >
        <Text className="text-lg">{category.icon}</Text>
      </View>
      <View className="min-w-0 flex-1">
        <Text
          numberOfLines={1}
          className="text-[13px] font-semibold text-[#303641]"
        >
          {description}
        </Text>
        <Text numberOfLines={1} className="mt-1 text-[11px] text-[#858A94]">
          {accountName ? `${accountName} · ` : ""}
          {format(new Date(transaction.date), "MMM d")}
        </Text>
      </View>
      <View className="ml-3 items-end">
        <Text
          numberOfLines={1}
          className={`text-[13px] font-semibold ${
            isIncome ? "text-[#249568]" : "text-[#303641]"
          }`}
        >
          {isIncome ? "+" : "−"}
          {formatPrice(transaction.amount, currency)}
        </Text>
        <Text className="mt-1 text-[10px] text-[#9A9EA6]">
          {isIncome ? "Income" : "Expense"}
        </Text>
      </View>
    </View>
  );

  if (!onDelete) return row;

  return (
    <Swipeable
      overshootRight={false}
      friction={1.5}
      rightThreshold={36}
      onSwipeableWillOpen={() => setIsSwipeOpen(true)}
      onSwipeableClose={() => setIsSwipeOpen(false)}
      containerStyle={{
        zIndex: isSwipeOpen ? 1 : 0,
        elevation: isSwipeOpen ? 1 : 0,
      }}
      renderRightActions={() => (
        <View className="w-[72px] justify-center py-1 pl-2">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel={`Delete ${description}`}
            onPress={onDelete}
            className="flex-1 items-center justify-center rounded-2xl bg-brand-coral"
          >
            <Feather name="trash-2" size={18} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
    >
      {row}
    </Swipeable>
  );
}
