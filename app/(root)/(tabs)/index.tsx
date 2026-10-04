import { BudgetModal } from "@/components/BudgetModal";
import { ConfirmDialog } from "@/components/auth/confirm-dialog";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { Button } from "@/components/ui/button";
import { Text as UiText } from "@/components/ui/text";
import { getCategoryConfig, type CategoryKey } from "@/constants/categories";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useBudgetQuery } from "@/hooks/queries/useBudgetQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { useDeleteTransaction } from "@/hooks/mutations/useTransactionMutations";
import { formatPrice, getGreeting, getProgressColor } from "@/lib/utils";
import type { Transaction } from "@/types/transaction";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { format, isSameMonth } from "date-fns";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Camera,
  Mic,
  Pencil,
  Plus,
  Sparkles,
  WalletCards,
} from "lucide-react-native";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { PieChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";
import TransactionListItem from "@/components/home/transaction-list-item";
import DashboardSectionTitle from "@/components/home/DashboardSectionTitle";

const QUICK_ACTIONS = [
  {
    label: "Scan receipt",
    action: "scan",
    Icon: Camera,
    color: "#70AFFF",
    backgroundColor: "#20395B",
  },
  {
    label: "Voice entry",
    action: "voice",
    Icon: Mic,
    color: "#FF947A",
    backgroundColor: "#4A302D",
  },
  {
    label: "Add expense",
    action: "manual",
    Icon: Plus,
    color: "#76DDA6",
    backgroundColor: "#244234",
  },
] as const;

export default function HomeScreen() {
  const { user } = useUser();
  const router = useRouter();
  const currency = useUserStore((state) => state.currency);
  const [budgetModalOpen, setBudgetModalOpen] = useState(false);
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [selectedExpenseCategory, setSelectedExpenseCategory] =
    useState<CategoryKey | null>(null);
  const deleteTransactionMutation = useDeleteTransaction();

  const {
    data: accounts = [],
    isLoading: accountsLoading,
    isRefetching: accountsRefetching,
    refetch: refetchAccounts,
  } = useAccountsQuery();

  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    refetch: refetchTransactions,
  } = useTransactionsQuery();
  const {
    data: budget = null,
    isRefetching: budgetRefetching,
    refetch: refetchBudget,
  } = useBudgetQuery();

  const refreshing =
    accountsRefetching || transactionsRefetching || budgetRefetching;

  const onRefresh = () => {
    void Promise.all([
      refetchAccounts(),
      refetchTransactions(),
      refetchBudget(),
    ]);
  };

  const handleDeleteTransaction = async () => {
    if (!transactionToDelete) return;

    try {
      const result =
        await deleteTransactionMutation.mutateAsync(transactionToDelete);
      if (result.error) {
        setDeleteError(result.error.message);
        return;
      }

      setTransactionToDelete(null);
    } catch (error) {
      console.error("Error deleting transaction:", error);
      setDeleteError(
        error instanceof Error
          ? error.message
          : "Could not delete the transaction. Please try again.",
      );
    }
  };

  const monthTransactions = useMemo(() => {
    const now = new Date();
    return transactions.filter((transaction) =>
      isSameMonth(new Date(transaction.date), now),
    );
  }, [transactions]);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, account) => sum + account.balance, 0),
    [accounts],
  );

  const monthIncome = useMemo(
    () =>
      monthTransactions
        .filter((transaction) => transaction.type === "INCOME")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthTransactions],
  );

  const monthExpense = useMemo(
    () =>
      monthTransactions
        .filter((transaction) => transaction.type === "EXPENSE")
        .reduce((sum, transaction) => sum + transaction.amount, 0),
    [monthTransactions],
  );

  const recentTransactions = useMemo(
    () => transactions.slice(0, 5),
    [transactions],
  );

  const expenseBreakdown = useMemo(() => {
    const amounts = new Map<CategoryKey, number>();

    monthTransactions
      .filter((transaction) => transaction.type === "EXPENSE")
      .forEach((transaction) => {
        amounts.set(
          transaction.category,
          (amounts.get(transaction.category) ?? 0) + transaction.amount,
        );
      });

    return Array.from(amounts, ([category, amount]) => ({
      category,
      amount,
      ...getCategoryConfig(category),
    })).sort((first, second) => second.amount - first.amount);
  }, [monthTransactions]);

  const budgetProgress =
    budget && budget.amount > 0 ? Math.min(monthExpense / budget.amount, 1) : 0;
  const selectedCategory = expenseBreakdown.find(
    ({ category }) => category === selectedExpenseCategory,
  );

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={["top"]}>
      <ScrollView
        className="flex-1 bg-[#F6F5F1]"
        contentContainerClassName="pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        <View className="rounded-b-[30px] bg-brand-bg px-5 pb-6 pt-4">
          <View className="mb-7 flex-row items-center justify-between">
            <View>
              <UiText className="text-xs font-medium text-[#969BA8]">
                {getGreeting()}
              </UiText>
              <UiText className="mt-1 text-xl font-semibold text-white">
                {user?.firstName ? `${user.firstName}'s overview` : "Overview"}
              </UiText>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Open profile"
              onPress={() => router.push("/(root)/(tabs)/profile")}
              className="h-11 w-11 items-center justify-center overflow-hidden rounded-full border border-white/10 bg-[#1A1D26]"
            >
              {user?.imageUrl && user.hasImage ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: 44, height: 44 }}
                  contentFit="cover"
                />
              ) : (
                <Feather name="user" size={19} color="#C7CBD4" />
              )}
            </TouchableOpacity>
          </View>

          <View className="rounded-[24px] border border-white/10 bg-[#141822] p-5">
            <View className="mb-2 flex-row items-center gap-2">
              <WalletCards size={16} color="#8D96A8" />
              <Text className="text-xs font-medium text-[#9CA3B2]">
                Total balance
              </Text>
              <View className="ml-auto rounded-full bg-[#202A32] px-2.5 py-1">
                <Text className="text-[10px] font-medium text-[#AEB7C5]">
                  {accounts.length}{" "}
                  {accounts.length === 1 ? "account" : "accounts"}
                </Text>
              </View>
            </View>
            {accountsLoading ? (
              <View className="h-12 justify-center">
                <ActivityIndicator color="#4A9EFF" />
              </View>
            ) : (
              <Text
                numberOfLines={1}
                adjustsFontSizeToFit
                className="text-[36px] font-semibold tracking-tight text-white"
              >
                {formatPrice(totalBalance, currency)}
              </Text>
            )}
            <View className="mt-4 flex-row gap-3">
              <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-[#1B2723] px-3 py-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#254335]">
                  <ArrowDownRight size={16} color="#55D99B" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[10px] text-[#94A39B]">Income</Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-xs font-semibold text-[#73DDA9]"
                  >
                    {formatPrice(monthIncome, currency)}
                  </Text>
                </View>
              </View>
              <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-[#2D2222] px-3 py-2.5">
                <View className="h-8 w-8 items-center justify-center rounded-full bg-[#49302E]">
                  <ArrowUpRight size={16} color="#FF947A" />
                </View>
                <View className="min-w-0 flex-1">
                  <Text className="text-[10px] text-[#B19A96]">Spent</Text>
                  <Text
                    numberOfLines={1}
                    className="mt-0.5 text-xs font-semibold text-[#FFA18A]"
                  >
                    {formatPrice(monthExpense, currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          <View className="mt-4 flex-row gap-2.5">
            {QUICK_ACTIONS.map(
              ({ label, action, Icon, color, backgroundColor }) => (
                <Button
                  key={action}
                  variant="ghost"
                  onPress={() =>
                    router.push({
                      pathname: "/(root)/(tabs)/add-transaction",
                      params: { action },
                    })
                  }
                  accessibilityLabel={label}
                  className="h-auto flex-1 flex-col gap-2 rounded-2xl border border-white/10 bg-[#141822] px-2 py-3.5 active:bg-[#202532]"
                >
                  <View
                    className="h-9 w-9 items-center justify-center rounded-full"
                    style={{ backgroundColor }}
                  >
                    <Icon size={17} color={color} />
                  </View>
                  <UiText className="text-center text-[10px] font-medium text-[#D0D3DA]">
                    {label}
                  </UiText>
                </Button>
              ),
            )}
          </View>
        </View>

        <View className="px-5 pt-5">
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => router.push("/(root)/(tabs)/assistant")}
            activeOpacity={0.85}
            className="mb-5 flex-row items-center gap-3 rounded-2xl border border-[#DFE8F2] bg-[#EEF5FC] p-4"
          >
            <View className="h-10 w-10 items-center justify-center rounded-full bg-white">
              <Sparkles size={18} color="#1A85FF" />
            </View>
            <View className="min-w-0 flex-1">
              <Text className="text-sm font-semibold text-[#1A1D26]">
                Your money, made clearer
              </Text>
              <Text className="mt-1 text-xs text-[#697586]">
                Ask your AI assistant for insights
              </Text>
            </View>
            <ArrowRight size={17} color="#1A85FF" />
          </TouchableOpacity>

          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => setBudgetModalOpen(true)}
            activeOpacity={0.88}
            className="mb-5 rounded-[22px] border border-[#E7E5DE] bg-white p-4"
          >
            <View className="mb-4 flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-xl bg-[#F2F5F9]">
                  <WalletCards size={18} color="#536174" />
                </View>
                <View>
                  <Text className="text-sm font-semibold text-[#1A1D26]">
                    Monthly budget
                  </Text>
                  <Text className="mt-1 text-xs text-[#858A94]">
                    {format(new Date(), "MMMM yyyy")}
                  </Text>
                </View>
              </View>
              <View className="h-9 w-9 items-center justify-center rounded-full bg-[#F6F5F1]">
                <Pencil size={15} color="#697586" />
              </View>
            </View>

            {budget ? (
              <>
                <View className="mb-2.5 flex-row items-end justify-between">
                  <View className="flex-row items-baseline">
                    <Text
                      numberOfLines={1}
                      className="max-w-[190px] text-[25px] font-semibold tracking-tight text-[#1A1D26]"
                    >
                      {formatPrice(monthExpense, currency)}
                    </Text>
                    <Text className="ml-1 text-xs text-[#858A94]">spent</Text>
                  </View>
                  <Text className="text-xs font-medium text-[#737A86]">
                    of {formatPrice(budget.amount, currency)}
                  </Text>
                </View>
                <View
                  accessibilityRole="progressbar"
                  accessibilityValue={{
                    min: 0,
                    max: 100,
                    now: Math.min(Math.round(budgetProgress * 100), 100),
                  }}
                  className="h-2.5 overflow-hidden rounded-full bg-[#F0EEE7]"
                >
                  <View
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.min(budgetProgress * 100, 100)}%`,
                      backgroundColor: getProgressColor(budgetProgress),
                    }}
                  />
                </View>
                <Text className="mt-2.5 text-xs text-[#737A86]">
                  {Math.round(budgetProgress * 100)}% of your monthly limit
                </Text>
              </>
            ) : (
              <View className="flex-row items-center justify-between rounded-2xl bg-[#F7F8FA] px-3.5 py-3">
                <Text className="flex-1 text-xs leading-5 text-[#697586]">
                  Set a monthly limit to keep your spending on track.
                </Text>
                <Text className="ml-3 text-xs font-semibold text-brand-blue">
                  Set budget
                </Text>
              </View>
            )}
          </TouchableOpacity>

          {expenseBreakdown.length > 0 ? (
            <View className="mb-5 rounded-[22px] border border-[#E7E5DE] bg-white p-4">
              <DashboardSectionTitle title="Spending breakdown" />
              <Text className="-mt-2 text-xs text-[#858A94]">
                By category this month
              </Text>
              <View className="mt-3 flex-row items-center">
                <PieChart
                  data={expenseBreakdown.map((category) => ({
                    value: category.amount,
                    color: category.color,
                    onPress: () =>
                      setSelectedExpenseCategory(category.category),
                  }))}
                  radius={58}
                  innerRadius={39}
                  innerCircleColor="#FFFFFF"
                  showText={false}
                  centerLabelComponent={() => (
                    <View className="items-center justify-center">
                      {selectedCategory ? (
                        <>
                          <Text
                            numberOfLines={1}
                            className="max-w-[68px] text-center text-[9px] font-medium text-[#858A94]"
                          >
                            {selectedCategory.label}
                          </Text>
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            className="mt-0.5 max-w-[74px] text-center text-[10px] font-bold text-[#303641]"
                          >
                            {formatPrice(selectedCategory.amount, currency)}
                          </Text>
                          <Text className="mt-0.5 text-[9px] text-[#858A94]">
                            {monthExpense > 0
                              ? `${Math.round(
                                  (selectedCategory.amount / monthExpense) *
                                    100,
                                )}%`
                              : "0%"}
                          </Text>
                        </>
                      ) : (
                        <>
                          <Text className="text-[9px] font-medium text-[#858A94]">
                            TOTAL SPENT
                          </Text>
                          <Text
                            numberOfLines={1}
                            adjustsFontSizeToFit
                            className="mt-0.5 max-w-[76px] text-center text-[10px] font-bold text-[#303641]"
                          >
                            {formatPrice(monthExpense, currency)}
                          </Text>
                        </>
                      )}
                    </View>
                  )}
                />
                <View className="ml-4 min-w-0 flex-1 gap-3">
                  {expenseBreakdown.slice(0, 6).map((category) => (
                    <Pressable
                      key={category.category}
                      accessibilityRole="button"
                      accessibilityState={{
                        selected: selectedExpenseCategory === category.category,
                      }}
                      onPress={() => {
                        setSelectedExpenseCategory((selected) =>
                          selected === category.category
                            ? null
                            : category.category,
                        );
                      }}
                      className="flex-row items-center gap-2"
                    >
                      <View
                        className="h-2.5 w-2.5 rounded-full border"
                        style={{
                          backgroundColor: category.color,
                          borderColor:
                            selectedExpenseCategory === category.category
                              ? "#303641"
                              : category.color,
                        }}
                      />
                      <Text
                        numberOfLines={1}
                        className={`min-w-0 flex-1 text-[11px] ${
                          selectedExpenseCategory === category.category
                            ? "font-semibold text-[#303641]"
                            : "text-[#697586]"
                        }`}
                      >
                        {category.label}
                      </Text>
                      <Text className="text-[11px] font-semibold text-[#303641]">
                        {formatPrice(category.amount, currency)}
                      </Text>
                    </Pressable>
                  ))}
                  {expenseBreakdown.length > 6 ? (
                    <Text className="text-[10px] text-[#858A94]">
                      +{expenseBreakdown.length - 6} more categories
                    </Text>
                  ) : null}
                </View>
              </View>
            </View>
          ) : null}

          <DashboardSectionTitle
            title="Recent transactions"
            action="See all"
            onAction={() => router.push("/(root)/(tabs)/transactions")}
          />

          {transactionsLoading ? (
            <View className="items-center rounded-[22px] border border-[#E7E5DE] bg-white py-8">
              <ActivityIndicator color="#1A85FF" />
              <Text className="mt-3 text-xs text-[#858A94]">
                Loading transactions…
              </Text>
            </View>
          ) : recentTransactions.length > 0 ? (
            <View className="overflow-hidden rounded-[22px] border border-[#E7E5DE] bg-white px-4">
              {recentTransactions.map((transaction, index) => (
                <TransactionListItem
                  key={transaction.id}
                  transaction={transaction}
                  currency={currency}
                  accountName={
                    accounts.find(
                      (account) => account.id === transaction.account_id,
                    )?.name
                  }
                  showDivider={index < recentTransactions.length - 1}
                  onDelete={() => {
                    setTransactionToDelete(transaction);
                  }}
                />
              ))}
            </View>
          ) : (
            <View className="items-center rounded-[22px] border border-[#E7E5DE] bg-white px-5 py-8">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F2F5F9]">
                <WalletCards size={20} color="#8A94A3" />
              </View>
              <Text className="mt-3 text-sm font-semibold text-[#303641]">
                No transactions yet
              </Text>
              <Text className="mt-1 text-center text-xs leading-5 text-[#858A94]">
                Add your first transaction to see your activity here.
              </Text>
              <Button
                onPress={() =>
                  router.push({
                    pathname: "/(root)/(tabs)/add-transaction",
                    params: { action: "manual" },
                  })
                }
                className="mt-4 rounded-xl bg-brand-bg px-4"
              >
                <UiText className="text-xs font-semibold text-white">
                  Add transaction
                </UiText>
              </Button>
            </View>
          )}
        </View>
      </ScrollView>

      {user ? (
        <BudgetModal
          visible={budgetModalOpen}
          budget={budget}
          onClose={() => setBudgetModalOpen(false)}
          onSaved={() => setBudgetModalOpen(false)}
        />
      ) : null}
      <ConfirmDialog
        open={transactionToDelete !== null}
        title="Delete transaction?"
        message="This transaction will be removed and the account balance will be updated."
        confirmText={
          deleteTransactionMutation.isPending ? "Deleting…" : "Delete"
        }
        confirmClassName="bg-brand-coral"
        onConfirm={() => {
          void handleDeleteTransaction();
        }}
        onOpenChange={(open) => {
          if (!open && !deleteTransactionMutation.isPending) {
            setTransactionToDelete(null);
          }
        }}
      />
      <ErrorDialog
        open={deleteError.length > 0}
        title="Could not delete transaction"
        message={deleteError}
        onOpenChange={(open) => {
          if (!open) setDeleteError("");
        }}
      />
    </SafeAreaView>
  );
}
