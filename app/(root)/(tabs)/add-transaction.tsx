import { useCreateTransaction } from "@/hooks/mutations/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { PillGroup } from "@/components/transactions/pill-group";
import { AIActionCard } from "@/components/transactions/AIActionCard";
import { CalendarPicker } from "@/components/transactions/CalendarPicker";
import { ReceiptScannerModal } from "@/components/transactions/ReceiptScannerModal";
import { VoiceRecorderModal } from "@/components/transactions/VoiceRecorderModal";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/constants/categories";
import { AI_GRADIENT, AI_GRADIENT_REVERSE } from "@/lib/theme";
import {
  extractTransactionFromReceipt,
  type ExtractedTransaction,
} from "@/lib/services/extractTransaction";
import type { InputMethod } from "@/types/transaction";
import {
  transactionSchema,
  type TransactionFormValues,
} from "@/lib/schemas/transaction";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { format, isValid, isAfter, parseISO } from "date-fns";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  ArrowLeft,
  CalendarDays,
  ChevronRight,
  WalletCards,
} from "lucide-react-native";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const TYPE_OPTIONS = [
  { key: "EXPENSE", label: "Expense" },
  { key: "INCOME", label: "Income" },
] as const;

export default function AddTransactionScreen() {
  const { user } = useUser();
  const router = useRouter();
  const params = useLocalSearchParams<{ action?: string }>();
  const currency = useUserStore((state) => state.currency);
  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccountsQuery();
  const { mutateAsync: createTransaction, isPending: saving } =
    useCreateTransaction();
  const queryClient = useQueryClient();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: "Error",
    message: "",
  });
  const [inputMethod, setInputMethod] = useState<InputMethod>("MANUAL");
  const [voiceTranscript, setVoiceTranscript] = useState<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [voiceModalOpen, setVoiceModalOpen] = useState(false);

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<TransactionFormValues>({
    resolver: zodResolver(transactionSchema),
    mode: "onBlur",
    defaultValues: {
      type: "EXPENSE",
      amount: "",
      category: "food",
      accountId: "",
      description: "",
      date: new Date(),
    },
  });

  const type = useWatch({ control, name: "type" });
  const category = useWatch({ control, name: "category" });
  const accountId = useWatch({ control, name: "accountId" });
  const date = useWatch({ control, name: "date" });
  const categories = type === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const accentColor = type === "INCOME" ? "#3DDC84" : "#FF947A";
  const currencySymbol =
    new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      maximumFractionDigits: 0,
    })
      .formatToParts(0)
      .find((part) => part.type === "currency")?.value ?? currency;

  useEffect(() => {
    if (!accountId && accounts.length > 0) {
      setValue("accountId", accounts[0].id);
    }
  }, [accountId, accounts, setValue]);

  useEffect(() => {
    if (params.action === "scan") {
      // Route params are one-shot requests to open a modal.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setScannerOpen(true);
      router.setParams({ action: undefined });
    } else if (params.action === "voice") {
      setVoiceModalOpen(true);
      router.setParams({ action: undefined });
    }
  }, [params.action, router]);

  const goBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/(root)/(tabs)/transactions");
    }
  };

  const showErrorDialog = (title: string, message: string) => {
    setErrorDialog({ open: true, title, message });
  };

  const clearErrorDialog = () => {
    setErrorDialog((current) => ({ ...current, open: false }));
  };

  const closeScanner = () => {
    setScannerOpen(false);
    if (params.action === "scan") router.setParams({ action: undefined });
  };

  const closeVoiceModal = () => {
    setVoiceModalOpen(false);
    if (params.action === "voice") router.setParams({ action: undefined });
  };

  const resetTransactionForm = () => {
    reset({
      type: "EXPENSE",
      amount: "",
      category: "food",
      accountId: accounts[0]?.id ?? "",
      description: "",
      date: new Date(),
    });
    clearErrorDialog();
    setInputMethod("MANUAL");
    setVoiceTranscript(null);
    setCalendarOpen(false);
    setScannerOpen(false);
    setVoiceModalOpen(false);
    if (params.action) router.setParams({ action: undefined });
  };

  const applyExtraction = (result: ExtractedTransaction) => {
    const nextType = result.type ?? type;
    const categoryOptions =
      nextType === "INCOME" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
    const validCategory =
      result.category &&
      categoryOptions.some((option) => option.key === result.category);

    if (result.type) setValue("type", result.type);
    if (validCategory && result.category) {
      setValue("category", result.category);
    } else if (result.type && result.type !== type) {
      setValue("category", categoryOptions[0].key);
    }
    if (result.amount !== null) setValue("amount", String(result.amount));
    if (result.description) setValue("description", result.description);
    if (result.date) {
      const extractedDate = parseISO(result.date);
      if (isValid(extractedDate) && !isAfter(extractedDate, new Date())) {
        setValue("date", extractedDate);
      }
    }

    const missing = [
      result.amount === null && "amount",
      !validCategory && "category",
    ].filter(Boolean);
    if (missing.length > 0) {
      Alert.alert(
        "Review before saving",
        `Couldn't confidently read the ${missing.join(" and ")}. Please fill it in.`,
      );
    }
  };

  const handleReceiptCaptured = async (base64: string, mimeType: string) => {
    closeScanner();
    setScanning(true);
    clearErrorDialog();
    try {
      const extracted = await extractTransactionFromReceipt(base64, mimeType);
      applyExtraction(extracted);
      setInputMethod("RECEIPT_SCAN");
      setVoiceTranscript(null);
    } catch (error) {
      console.error("Receipt scan failed:", error);
      showErrorDialog(
        "Receipt scan failed",
        "Couldn't read that receipt. Try again or enter it manually.",
      );
    } finally {
      setScanning(false);
    }
  };

  const handleVoiceExtracted = (result: ExtractedTransaction) => {
    applyExtraction(result);
    setVoiceTranscript(result.transcript);
    setInputMethod("VOICE");
  };

  const onSubmit = async (values: TransactionFormValues) => {
    if (!user) {
      showErrorDialog(
        "Sign in required",
        "Please sign in to save a transaction.",
      );
      return;
    }

    clearErrorDialog();
    const amount = Number.parseFloat(values.amount.replace(/,/g, ""));

    try {
      const result = await createTransaction({
        user_id: user.id,
        account_id: values.accountId,
        type: values.type,
        amount,
        category: values.category,
        description: values.description?.trim() || null,
        date: values.date.toISOString(),
        input_method: inputMethod,
        voice_transcript: inputMethod === "VOICE" ? voiceTranscript : null,
      });

      if (result.error) {
        if (result.transaction) {
          void queryClient.invalidateQueries({ queryKey: ["transactions"] });
          void queryClient.invalidateQueries({ queryKey: ["accounts"] });
          Alert.alert(
            "Transaction recorded",
            "The transaction was saved, but the account balance could not be updated. Refresh your accounts before adding it again.",
            [
              {
                text: "OK",
                onPress: () => {
                  resetTransactionForm();
                  goBack();
                },
              },
            ],
          );
          return;
        }

        showErrorDialog(
          "Couldn't save transaction",
          "Couldn't save this transaction. Please try again.",
        );
        return;
      }

      if (!result.transaction) {
        showErrorDialog(
          "Transaction not confirmed",
          "The transaction could not be confirmed. Please try again.",
        );
        return;
      }

      resetTransactionForm();
      goBack();
    } catch (error) {
      console.error("Error creating transaction:", error);
      showErrorDialog(
        "Couldn't save transaction",
        error instanceof Error
          ? error.message
          : "Couldn't save this transaction. Please try again.",
      );
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={["top"]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        className="flex-1"
      >
        <View className="flex-row items-center px-5 pb-3 pt-2">
          <Pressable
            accessibilityLabel="Go back"
            accessibilityRole="button"
            className="mr-3 h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141822] active:bg-[#202532]"
            onPress={goBack}
          >
            <ArrowLeft color="#F2EFE9" size={20} />
          </Pressable>
          <View>
            <Text className="text-xs font-medium uppercase tracking-[2px] text-brand-text-muted">
              Your money, in focus
            </Text>
            <Text className="mt-1 text-2xl font-semibold text-brand-text-primary">
              New transaction
            </Text>
          </View>
        </View>

        {loadingAccounts ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#1A85FF" />
            <Text className="mt-3 text-sm text-brand-text-secondary">
              Getting your accounts ready…
            </Text>
          </View>
        ) : accountsError ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-lg font-semibold text-brand-text-primary">
              Accounts aren&apos;t available
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-brand-text-secondary">
              Check your connection and try loading them again.
            </Text>
            <Pressable
              className="mt-5 rounded-2xl bg-[#1A85FF] px-5 py-3 active:bg-[#1674DF]"
              onPress={() => void refetchAccounts()}
            >
              <Text className="font-semibold text-white">Try again</Text>
            </Pressable>
          </View>
        ) : accounts.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <View className="h-14 w-14 items-center justify-center rounded-2xl bg-[#141822]">
              <WalletCards color="#8A8D96" size={25} />
            </View>
            <Text className="mt-4 text-center text-lg font-semibold text-brand-text-primary">
              Add an account first
            </Text>
            <Text className="mt-2 text-center text-sm leading-5 text-brand-text-secondary">
              A transaction needs an account to keep your balances up to date.
            </Text>
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 32 }}
            keyboardDismissMode="on-drag"
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View className="mb-4 flex-row gap-2.5">
              <AIActionCard
                colors={AI_GRADIENT}
                icon="camera"
                onPress={() => {
                  setVoiceModalOpen(false);
                  setScannerOpen(true);
                }}
                subtitle="Snap a photo"
                title="Scan receipt"
              />
              <AIActionCard
                colors={AI_GRADIENT_REVERSE}
                icon="mic"
                onPress={() => {
                  setScannerOpen(false);
                  setVoiceModalOpen(true);
                }}
                subtitle="Just say it"
                title="Voice entry"
              />
            </View>

            <View className="mb-5 flex-row rounded-2xl border border-white/10 bg-[#141822] p-1">
              {TYPE_OPTIONS.map((option) => {
                const selected = type === option.key;
                const selectedStyle =
                  option.key === "INCOME" ? "bg-[#1E322A]" : "bg-[#382522]";

                return (
                  <Pressable
                    key={option.key}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    className={`flex-1 items-center rounded-xl py-3 ${
                      selected ? selectedStyle : ""
                    }`}
                    onPress={() => {
                      setValue("type", option.key);
                      setValue(
                        "category",
                        option.key === "INCOME"
                          ? INCOME_CATEGORIES[0].key
                          : EXPENSE_CATEGORIES[0].key,
                      );
                      clearErrorDialog();
                    }}
                  >
                    <Text
                      className={`text-sm font-semibold ${
                        selected
                          ? option.key === "INCOME"
                            ? "text-[#3DDC84]"
                            : "text-[#FF947A]"
                          : "text-brand-text-secondary"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            <View className="mb-6 rounded-[26px] border border-white/10 bg-[#141822] px-5 py-5">
              <View className="mb-3 flex-row items-center justify-between">
                <Text className="text-sm font-medium text-brand-text-secondary">
                  Amount
                </Text>
                <View className="rounded-full bg-white/5 px-3 py-1.5">
                  <Text className="text-xs font-semibold text-brand-text-primary">
                    {currency}
                  </Text>
                </View>
              </View>
              <View className="flex-row items-center">
                <Text
                  className="mr-2 text-3xl font-medium"
                  style={{ color: accentColor }}
                >
                  {currencySymbol}
                </Text>
                <Controller
                  control={control}
                  name="amount"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <TextInput
                      accessibilityLabel="Transaction amount"
                      className="min-w-0 flex-1 py-1 text-4xl font-semibold text-brand-text-primary"
                      keyboardType="decimal-pad"
                      onBlur={onBlur}
                      onChangeText={(nextValue) => {
                        clearErrorDialog();
                        onChange(nextValue);
                      }}
                      placeholder="0"
                      placeholderTextColor="#5C5F68"
                      returnKeyType="done"
                      value={value}
                    />
                  )}
                />
              </View>
              {errors.amount ? (
                <Text className="mt-2 text-xs text-brand-coral">
                  {errors.amount.message}
                </Text>
              ) : (
                <Text className="mt-2 text-xs text-brand-text-muted">
                  Enter the total amount for this transaction
                </Text>
              )}
            </View>

            <View className="mb-6">
              <View className="mb-3 flex-row items-end justify-between">
                <View>
                  <Text className="text-base font-semibold text-brand-text-primary">
                    Category
                  </Text>
                  <Text className="mt-1 text-xs text-brand-text-secondary">
                    Choose where it belongs
                  </Text>
                </View>
                <Text
                  className="text-xs font-medium"
                  style={{ color: accentColor }}
                >
                  {categories.find((item) => item.key === category)?.label}
                </Text>
              </View>
              <PillGroup
                options={categories.map((item) => ({
                  key: item.key,
                  label: item.label,
                  icon: item.icon,
                }))}
                value={category}
                scrollable
                accentColor={accentColor}
                onChange={(key) => {
                  setValue("category", key);
                  clearErrorDialog();
                }}
              />
            </View>

            <View className="mb-6">
              <View className="mb-3">
                <Text className="text-base font-semibold text-brand-text-primary">
                  Account
                </Text>
                <Text className="mt-1 text-xs text-brand-text-secondary">
                  Select the account used
                </Text>
              </View>
              <PillGroup
                options={accounts.map((account) => ({
                  key: account.id,
                  label: account.name,
                  detail: formatPrice(account.balance, currency),
                }))}
                value={accountId}
                scrollable
                onChange={(key) => {
                  setValue("accountId", key);
                  clearErrorDialog();
                }}
              />
              {errors.accountId ? (
                <Text className="mt-2 text-xs text-brand-coral">
                  {errors.accountId.message}
                </Text>
              ) : null}
            </View>

            <View className="mb-5">
              <Text className="mb-3 text-base font-semibold text-brand-text-primary">
                Date
              </Text>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ expanded: calendarOpen }}
                className="flex-row items-center justify-between rounded-2xl border border-white/10 bg-[#141822] px-4 py-4 active:bg-[#202532]"
                onPress={() => setCalendarOpen((open) => !open)}
              >
                <View className="flex-row items-center">
                  <View className="mr-3 h-10 w-10 items-center justify-center rounded-xl bg-[#1A85FF]/15">
                    <CalendarDays color="#70AFFF" size={19} />
                  </View>
                  <View>
                    <Text className="text-sm font-semibold text-brand-text-primary">
                      {format(date, "EEEE, d MMMM yyyy")}
                    </Text>
                    <Text className="mt-1 text-xs text-brand-text-secondary">
                      Transaction date
                    </Text>
                  </View>
                </View>
                <ChevronRight color="#8A8D96" size={18} />
              </Pressable>

              {calendarOpen ? (
                <View className="mt-3 rounded-2xl border border-white/10 bg-[#141822] p-4">
                  <CalendarPicker
                    value={date}
                    maximumDate={new Date()}
                    onChange={(selectedDate) => {
                      setValue("date", selectedDate);
                      setCalendarOpen(false);
                    }}
                  />
                </View>
              ) : null}
            </View>

            <View className="mb-5">
              <Text className="mb-3 text-base font-semibold text-brand-text-primary">
                Note{" "}
                <Text className="font-normal text-brand-text-muted">
                  · Optional
                </Text>
              </Text>
              <Controller
                control={control}
                name="description"
                render={({ field: { value, onChange, onBlur } }) => (
                  <TextInput
                    className="rounded-2xl border border-white/10 bg-[#141822] px-4 py-4 text-sm text-brand-text-primary"
                    onBlur={onBlur}
                    onChangeText={onChange}
                    placeholder="What was this transaction for?"
                    placeholderTextColor="#5C5F68"
                    returnKeyType="done"
                    value={value}
                  />
                )}
              />
            </View>

            <Pressable
              accessibilityRole="button"
              className="mb-2 flex-row items-center justify-center rounded-2xl py-4 active:opacity-80"
              disabled={saving}
              onPress={handleSubmit(onSubmit)}
              style={{
                backgroundColor: accentColor,
                opacity: saving ? 0.7 : 1,
              }}
            >
              {saving ? (
                <ActivityIndicator color="#0B0E14" />
              ) : (
                <Text className="text-base font-bold text-[#0B0E14]">
                  Save {type === "INCOME" ? "income" : "expense"}
                </Text>
              )}
            </Pressable>
          </ScrollView>
        )}
      </KeyboardAvoidingView>

      {scanning ? (
        <View className="absolute inset-0 items-center justify-center bg-black/50">
          <View className="items-center rounded-2xl bg-[#141822] px-6 py-5">
            <ActivityIndicator color="#1A85FF" />
            <Text className="mt-3 text-sm text-brand-text-primary">
              Reading receipt…
            </Text>
          </View>
        </View>
      ) : null}

      <ReceiptScannerModal
        onCaptured={(base64, mimeType) =>
          void handleReceiptCaptured(base64, mimeType)
        }
        onClose={closeScanner}
        visible={scannerOpen}
      />
      <VoiceRecorderModal
        onClose={closeVoiceModal}
        onExtracted={handleVoiceExtracted}
        visible={voiceModalOpen}
      />
      <ErrorDialog
        open={errorDialog.open}
        title={errorDialog.title}
        message={errorDialog.message}
        onOpenChange={(open) =>
          setErrorDialog((current) => ({ ...current, open }))
        }
      />
    </SafeAreaView>
  );
}
