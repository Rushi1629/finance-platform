import cc from "currency-codes";
import getSymbol from "currency-symbol-map";
import { Check, Search, X } from "lucide-react-native";
import { useMemo, useState } from "react";
import {
    FlatList,
    Modal,
    Pressable,
    Text,
    TextInput,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export type CurrencyEntry = {
  code: string;
  name: string;
  symbol: string;
};

export const ALL_CURRENCIES: CurrencyEntry[] = cc
  .codes()
  .map((code) => ({
    code,
    name: cc.code(code)?.currency ?? code,
    symbol: getSymbol(code) ?? code,
  }))
  .filter((currency) => currency.symbol !== currency.code);

type CurrencyPickerProps = {
  visible: boolean;
  selectedCode: string;
  onSelect: (currency: CurrencyEntry) => void;
  onClose: () => void;
};

export function CurrencyPicker({
  visible,
  selectedCode,
  onSelect,
  onClose,
}: CurrencyPickerProps) {
  const [search, setSearch] = useState("");

  const filteredCurrencies = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return ALL_CURRENCIES;

    return ALL_CURRENCIES.filter(
      ({ code, name, symbol }) =>
        code.toLowerCase().includes(query) ||
        name.toLowerCase().includes(query) ||
        symbol.toLowerCase().includes(query),
    );
  }, [search]);

  const closePicker = () => {
    setSearch("");
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={closePicker}
    >
      <SafeAreaView className="flex-1 bg-brand-body" edges={["top", "bottom"]}>
        <View className="flex-row items-center justify-between px-5 pb-4 pt-3">
          <View>
            <Text className="text-xl font-semibold text-brand-bg">
              Choose currency
            </Text>
            <Text className="mt-1 text-sm text-brand-text-secondary">
              {filteredCurrencies.length} currencies
            </Text>
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close currency picker"
            onPress={closePicker}
            className="h-10 w-10 items-center justify-center rounded-full bg-white"
          >
            <X size={20} color="#5C5F68" />
          </Pressable>
        </View>

        <View className="mx-5 mb-3 flex-row items-center rounded-xl border border-[#E8E6DF] bg-white px-3">
          <Search size={18} color="#8A8D96" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or code"
            placeholderTextColor="#8A8D96"
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            className="h-12 flex-1 px-3 text-sm text-brand-bg"
          />
          {search.length > 0 && (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Clear search"
              onPress={() => setSearch("")}
              className="h-9 w-9 items-center justify-center"
            >
              <X size={17} color="#8A8D96" />
            </Pressable>
          )}
        </View>

        <FlatList
          data={filteredCurrencies}
          keyExtractor={(currency) => currency.code}
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="px-5 pb-6"
          ListEmptyComponent={
            <View className="items-center py-12">
              <Text className="text-sm font-medium text-brand-bg">
                No currencies found
              </Text>
              <Text className="mt-1 text-sm text-brand-text-secondary">
                Try another name, code, or symbol.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const isSelected = item.code === selectedCode;

            return (
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected: isSelected }}
                onPress={() => {
                  onSelect(item);
                  setSearch("");
                }}
                className="min-h-16 flex-row items-center border-b border-[#E8E6DF] py-3"
              >
                <View className="mr-3 h-10 w-10 items-center justify-center rounded-full bg-white">
                  <Text className="text-base font-semibold text-brand-bg">
                    {item.symbol}
                  </Text>
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-sm font-semibold text-brand-bg">
                    {item.code}
                  </Text>
                  <Text
                    className="mt-0.5 text-sm text-brand-text-secondary"
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                </View>
                {isSelected && <Check size={19} color="#1A85FF" />}
              </Pressable>
            );
          }}
        />
      </SafeAreaView>
    </Modal>
  );
}
