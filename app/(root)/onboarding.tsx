import { FormField } from "@/components/auth/form-field";
import {
  ALL_CURRENCIES,
  CurrencyPicker,
  type CurrencyEntry,
} from "@/components/onboarding/CurrencyPicker";
import { useSupabase } from "@/hooks/useSupabase";
import {
  onboardingSchema,
  type OnboardingFormValues,
} from "@/lib/schemas/onboarding";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function OnboardingScreen() {
  const { user } = useUser();
  const authSupabase = useSupabase();
  const setCurrency = useUserStore((state) => state.setCurrency);
  const setNeedsOnboarding = useUserStore((state) => state.setNeedsOnboarding);

  const {
    control,
    handleSubmit,
    formState: { errors: formErrors },
  } = useForm<OnboardingFormValues>({
    resolver: zodResolver(onboardingSchema),
    mode: "onBlur",
    defaultValues: { startingBalance: "" },
  });

  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyEntry>(
    () =>
      ALL_CURRENCIES.find((currency) => currency.code === "INR") ??
      ALL_CURRENCIES[0],
  );
  const [pickerOpen, setPickerOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const handleSave = async ({ startingBalance }: OnboardingFormValues) => {
    if (!user) {
      setError("Your session has expired. Please sign in again.");
      return;
    }

    const startingAmount = Number(startingBalance.replace(/,/g, ""));
    setSaving(true);
    setError("");

    try {
      const { error: updateError } = await authSupabase
        .from("users")
        .update({ currency: selectedCurrency.code })
        .eq("clerk_id", user.id);

      if (updateError) throw updateError;

      const { data: defaultAccount, error: accountFetchError } =
        await authSupabase
          .from("accounts")
          .select("id, balance")
          .eq("user_id", user.id)
          .eq("is_default", true)
          .single();

      if (accountFetchError || !defaultAccount) {
        throw accountFetchError ?? new Error("Default account not found.");
      }

      const { error: transactionError } = await authSupabase
        .from("transactions")
        .insert({
          user_id: user.id,
          account_id: defaultAccount.id,
          type: "INCOME",
          amount: startingAmount,
          category: "other_income",
          description: "Starting balance",
          date: new Date().toISOString(),
          input_method: "MANUAL",
        });

      if (transactionError) throw transactionError;

      const { error: balanceError } = await authSupabase
        .from("accounts")
        .update({ balance: defaultAccount.balance + startingAmount })
        .eq("id", defaultAccount.id);

      if (balanceError) throw balanceError;

      setCurrency(selectedCurrency.code);
      setNeedsOnboarding(false);
      router.replace("/(root)/(tabs)");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-body" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          contentContainerClassName="flex-grow justify-center px-6 py-10"
          showsVerticalScrollIndicator={false}
        >
          <View className="mx-auto w-full max-w-md">
            <Image
              source={require("../../assets/images/wealth.png")}
              className="mb-8 h-14 w-32"
              resizeMode="contain"
            />

            <Text className="mb-2 text-3xl font-bold text-[#1A1D26]">
              Let&apos;s get you set up
            </Text>
            <Text className="mb-8 text-sm leading-5 text-brand-text-muted">
              A couple of quick details to personalise your experience.
            </Text>

            <Controller
              control={control}
              name="startingBalance"
              render={({ field: { value, onChange, onBlur } }) => (
                <FormField
                  label="Starting balance"
                  placeholder="e.g. 50000"
                  value={value}
                  onBlur={onBlur}
                  onChangeText={(nextValue) => {
                    setError("");
                    onChange(nextValue);
                  }}
                  error={formErrors.startingBalance?.message}
                  keyboardType="numeric"
                  icon={
                    <Text className="text-sm text-brand-text-secondary">
                      {selectedCurrency.symbol}
                    </Text>
                  }
                />
              )}
            />

            <Text className="mb-2 text-xs font-semibold text-brand-bg">
              Currency
            </Text>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Choose currency"
              onPress={() => setPickerOpen(true)}
              className="mb-6 h-14 flex-row items-center justify-between rounded-xl border border-[#E8E6DF] bg-white px-4"
            >
              <Text
                className="mr-3 flex-1 text-sm text-brand-bg"
                numberOfLines={2}
              >
                {selectedCurrency.symbol} {selectedCurrency.code} —{" "}
                {selectedCurrency.name}
              </Text>
              <Feather name="chevron-down" size={18} color="#8A8D96" />
            </TouchableOpacity>

            {error ? (
              <Text
                accessibilityRole="alert"
                className="mb-4 text-xs text-brand-coral"
              >
                {error}
              </Text>
            ) : null}

            <TouchableOpacity
              accessibilityRole="button"
              onPress={handleSubmit(handleSave)}
              disabled={saving}
              className={`items-center rounded-xl bg-brand-blue py-4 ${saving ? "opacity-60" : ""}`}
              activeOpacity={0.85}
            >
              <Text className="text-sm font-semibold text-white">
                {saving ? "Saving..." : "Get started"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <CurrencyPicker
        visible={pickerOpen}
        selectedCode={selectedCurrency.code}
        onSelect={(currency) => {
          setSelectedCurrency(currency);
          setPickerOpen(false);
        }}
        onClose={() => setPickerOpen(false)}
      />
    </SafeAreaView>
  );
}
