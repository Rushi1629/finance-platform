import { ConfirmDialog } from "@/components/auth/confirm-dialog";
import { ErrorDialog } from "@/components/auth/error-dialog";
import TransactionListItem from "@/components/home/transaction-list-item";
import { getCategoryConfig } from "@/constants/categories";
import { useDeleteTransaction } from "@/hooks/mutations/useTransactionMutations";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useTransactionsQuery } from "@/hooks/queries/useTransactionsQuery";
import { formatPrice } from "@/lib/utils";
import { exportTransactionsToCsv } from "@/lib/utils/exportTransactions";
import type { Transaction } from "@/types/transaction";
import { useUserStore } from "@/store/userStore";
import { Feather } from "@expo/vector-icons";
import {
  eachDayOfInterval,
  format,
  isSameMonth,
  isToday,
  isYesterday,
  parseISO,
  startOfDay,
  startOfMonth,
} from "date-fns";
import { useRouter } from "expo-router";
import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BarChart } from "react-native-gifted-charts";
import { SafeAreaView } from "react-native-safe-area-context";

const FILTERS = [
  { label: "All", value: "ALL" },
  { label: "Income", value: "INCOME" },
  { label: "Expenses", value: "EXPENSE" },
] as const;

type TransactionFilter = (typeof FILTERS)[number]["value"];

// Use friendly labels for transaction dates in the activity list.
function getDateHeading(date: string) {
  const parsedDate = parseISO(date);
  if (isToday(parsedDate)) return "Today";
  if (isYesterday(parsedDate)) return "Yesterday";
  return format(parsedDate, "EEEE, MMM d");
}

// Build chart labels from the first day of this month through today.
function getCurrentMonthDays() {
  const today = startOfDay(new Date());
  return eachDayOfInterval({
    start: startOfMonth(today),
    end: today,
  }).map((date) => ({
    key: format(date, "yyyy-MM-dd"),
    label: format(date, "d MMM"),
  }));
}

export default function TransactionsScreen() {
  const router = useRouter();
  const currency = useUserStore((state) => state.currency);
  const [activeFilter, setActiveFilter] = useState<TransactionFilter>("ALL");
  const [activeAccountId, setActiveAccountId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [transactionToDelete, setTransactionToDelete] =
    useState<Transaction | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [exporting, setExporting] = useState(false);

  const typeFilter = activeFilter === "ALL" ? null : activeFilter;

  // The activity list query follows the selected type and account filters.
  const {
    data: transactions = [],
    isLoading: transactionsLoading,
    isRefetching: transactionsRefetching,
    isError: transactionsError,
    refetch: refetchTransactions,
  } = useTransactionsQuery({
    type: typeFilter,
    accountId: activeAccountId,
  });

  // The chart needs both transaction types, so it only applies the account filter.
  const {
    data: chartTransactions = [],
    isLoading: chartTransactionsLoading,
    isRefetching: chartTransactionsRefetching,
    isError: chartTransactionsError,
    refetch: refetchChartTransactions,
  } = useTransactionsQuery({ accountId: activeAccountId });

  const {
    data: accounts = [],
    isRefetching: accountsRefetching,
    refetch: refetchAccounts,
  } = useAccountsQuery();

  const deleteTransactionMutation = useDeleteTransaction();

  // Calculate this month's summary and chart from the account-scoped transactions.
  const monthlyTransactions = useMemo(
    () =>
      chartTransactions.filter((transaction) =>
        isSameMonth(parseISO(transaction.date), new Date()),
      ),
    [chartTransactions],
  );

  const monthlyIncome = useMemo(
    () =>
      monthlyTransactions
        .filter((transaction) => transaction.type === "INCOME")
        .reduce((total, transaction) => total + transaction.amount, 0),
    [monthlyTransactions],
  );
  const monthlyExpenses = useMemo(
    () =>
      monthlyTransactions
        .filter((transaction) => transaction.type === "EXPENSE")
        .reduce((total, transaction) => total + transaction.amount, 0),
    [monthlyTransactions],
  );

  const dailyIncomeExpense = useMemo(() => {
    const totalsByDay = new Map<string, { income: number; expenses: number }>();

    monthlyTransactions.forEach((transaction) => {
      const key = format(parseISO(transaction.date), "yyyy-MM-dd");
      const totals = totalsByDay.get(key) ?? { income: 0, expenses: 0 };
      if (transaction.type === "INCOME") {
        totals.income += transaction.amount;
      } else {
        totals.expenses += transaction.amount;
      }
      totalsByDay.set(key, totals);
    });

    // Include zero-value days so the chart keeps a continuous timeline.
    return getCurrentMonthDays().flatMap(({ key, label }) => {
      const totals = totalsByDay.get(key) ?? { income: 0, expenses: 0 };
      return [
        { value: totals.income, label, frontColor: "#55D99B" },
        { value: totals.expenses, frontColor: "#FF947A", label: "" },
      ];
    });
  }, [monthlyTransactions]);

  const visibleTransactions = useMemo(() => {
    const query = search.trim().toLowerCase();

    // The query already applies type/account filters; search narrows those results.
    return transactions.filter((transaction) => {
      if (!query) return true;

      const category = getCategoryConfig(transaction.category);
      const accountName = accounts.find(
        (account) => account.id === transaction.account_id,
      )?.name;
      return [transaction.description, category.label, accountName].some(
        (value) => value?.toLowerCase().includes(query),
      );
    });
  }, [transactions, accounts, search]);

  // Group filtered transactions by calendar day for the activity list.
  const groupedTransactions = useMemo(() => {
    const groups = new Map<string, Transaction[]>();

    visibleTransactions.forEach((transaction) => {
      const key = format(parseISO(transaction.date), "yyyy-MM-dd");
      const group = groups.get(key);
      if (group) group.push(transaction);
      else groups.set(key, [transaction]);
    });

    return Array.from(groups, ([date, items]) => ({
      date,
      heading: getDateHeading(date),
      transactions: items,
    }));
  }, [visibleTransactions]);

  const refreshing =
    transactionsRefetching || chartTransactionsRefetching || accountsRefetching;

  // Refresh both transaction datasets and accounts together.
  const onRefresh = () => {
    void Promise.all([
      refetchTransactions(),
      refetchChartTransactions(),
      refetchAccounts(),
    ]);
  };

  // Export the currently visible transactions and report any export errors.
  const handleExport = async () => {
    if (visibleTransactions.length === 0) {
      Alert.alert("Nothing to export", "There are no matching transactions.");
      return;
    }

    setExporting(true);
    try {
      const result = await exportTransactionsToCsv(visibleTransactions);
      Alert.alert(
        "Export ready",
        result.count
          ? `${result.count} transaction${result.count === 1 ? "" : "s"} from the last 30 days included.`
          : "No matching transactions from the last 30 days were found.",
      );
    } catch (error) {
      console.error("Error exporting transactions:", error);
      Alert.alert(
        "Export failed",
        error instanceof Error
          ? error.message
          : "Could not export your transactions. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };

  // Keep the dialog open on failure so the user can see the error and retry.
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

  return (
    <SafeAreaView className="flex-1 bg-brand-bg" edges={["top"]}>
      <ScrollView
        className="flex-1 bg-[#F6F5F1]"
        contentContainerClassName="pb-8"
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Screen title and current-month income/expense summary. */}
        <View className="rounded-b-[30px] bg-brand-bg px-5 pb-6 pt-4">
          <View className="mb-6 flex-row items-center justify-between">
            <View>
              <Text className="text-xs font-medium text-[#969BA8]">
                Your activity
              </Text>
              <Text className="mt-1 text-2xl font-semibold text-white">
                Transactions
              </Text>
            </View>
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Export transactions from the last 30 days"
              disabled={exporting}
              onPress={() => void handleExport()}
              className="h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-[#141822]"
            >
              {exporting ? (
                <ActivityIndicator color="#C7CBD4" size="small" />
              ) : (
                <Feather name="download" size={18} color="#C7CBD4" />
              )}
            </TouchableOpacity>
          </View>

          <View className="rounded-[24px] border border-white/10 bg-[#141822] p-5">
            <View className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-2">
                <Feather name="calendar" size={14} color="#9CA3B2" />
                <Text className="text-xs font-medium text-[#9CA3B2]">
                  {format(new Date(), "MMMM yyyy")}
                </Text>
              </View>

              {chartTransactionsLoading ? (
                <ActivityIndicator size="small" color="#55D99B" />
              ) : (
                <View className="rounded-full bg-[#202A32] px-2.5 py-1">
                  <Text className="text-[10px] font-medium text-[#AEB7C5]">
                    {monthlyTransactions.length}{" "}
                    {monthlyTransactions.length === 1
                      ? "transaction"
                      : "transactions"}
                  </Text>
                </View>
              )}
            </View>

            {chartTransactionsLoading ? (
              <View className="my-5 items-center justify-center py-3">
                <ActivityIndicator size="large" color="#55D99B" />
                <Text className="mt-3 text-xs text-[#9CA3B2]">
                  Loading monthly summary...
                </Text>
              </View>
            ) : chartTransactionsError ? (
              <View className="my-5 items-center py-3">
                <Text className="text-xs text-[#FF947A]">
                  Couldn’t load monthly summary.
                </Text>
                <TouchableOpacity
                  onPress={() => void refetchChartTransactions()}
                  className="mt-2 rounded-lg bg-[#202A32] px-3 py-2"
                >
                  <Text className="text-xs font-semibold text-white">
                    Try again
                  </Text>
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text className="mb-4 mt-2 text-[30px] font-semibold tracking-tight text-white">
                  {formatPrice(monthlyExpenses, currency)}
                </Text>

                <View className="flex-row gap-3">
                  <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-[#1B2723] px-3 py-2.5">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-[#254335]">
                      <Feather
                        name="arrow-down-left"
                        size={16}
                        color="#55D99B"
                      />
                    </View>

                    <View className="min-w-0 flex-1">
                      <Text className="text-[10px] text-[#94A39B]">Income</Text>
                      <Text
                        numberOfLines={1}
                        className="mt-0.5 text-xs font-semibold text-[#73DDA9]"
                      >
                        {formatPrice(monthlyIncome, currency)}
                      </Text>
                    </View>
                  </View>

                  <View className="flex-1 flex-row items-center gap-2 rounded-2xl bg-[#2D2222] px-3 py-2.5">
                    <View className="h-8 w-8 items-center justify-center rounded-full bg-[#49302E]">
                      <Feather
                        name="arrow-up-right"
                        size={16}
                        color="#FF947A"
                      />
                    </View>

                    <View className="min-w-0 flex-1">
                      <Text className="text-[10px] text-[#B19A96]">
                        Expenses
                      </Text>
                      <Text
                        numberOfLines={1}
                        className="mt-0.5 text-xs font-semibold text-[#FFA18A]"
                      >
                        {formatPrice(monthlyExpenses, currency)}
                      </Text>
                    </View>
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        <View className="px-5 pt-5">
          {/* Daily chart compares income and expenses for the selected account. */}
          {chartTransactionsError ? (
            <View className="mb-4 rounded-[22px] border border-[#E7E5DE] bg-white px-4 py-3">
              <Text className="text-xs text-[#858A94]">
                Couldn’t load chart data. Pull to refresh and try again.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void refetchChartTransactions()}
                className="mt-2 self-start rounded-lg bg-[#F2F5F9] px-3 py-2"
              >
                <Text className="text-xs font-semibold text-[#303641]">
                  Retry chart
                </Text>
              </TouchableOpacity>
            </View>
          ) : chartTransactionsLoading ? (
            <View className="mb-4 items-center rounded-[22px] border border-[#E7E5DE] bg-white py-8">
              <ActivityIndicator color="#1A85FF" />
              <Text className="mt-2 text-xs text-[#858A94]">
                Loading chart…
              </Text>
            </View>
          ) : chartTransactions.length > 0 ? (
            <View className="mb-4 overflow-hidden rounded-[22px] border border-[#E7E5DE] bg-white p-4">
              <View className="mb-3 flex-row items-center justify-between">
                <View>
                  <Text className="text-sm font-semibold text-[#303641]">
                    Daily income vs. expenses
                  </Text>
                  <Text className="mt-0.5 text-[10px] text-[#858A94]">
                    {format(new Date(), "MMMM")} activity
                  </Text>
                </View>
                <View className="flex-row gap-3">
                  <View className="flex-row items-center gap-1">
                    <View className="h-2 w-2 rounded-full bg-[#55D99B]" />
                    <Text className="text-[10px] text-[#697586]">Income</Text>
                  </View>
                  <View className="flex-row items-center gap-1">
                    <View className="h-2 w-2 rounded-full bg-[#FF947A]" />
                    <Text className="text-[10px] text-[#697586]">Expense</Text>
                  </View>
                </View>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ paddingRight: 8 }}
              >
                <BarChart
                  data={dailyIncomeExpense}
                  width={Math.max(dailyIncomeExpense.length * 9, 280)}
                  height={120}
                  barWidth={6}
                  spacing={4}
                  hideYAxisText
                  xAxisColor="#E7E5DE"
                  yAxisColor="transparent"
                  rulesColor="#F0EEE7"
                  noOfSections={3}
                  xAxisLabelTextStyle={{ color: "#858A94", fontSize: 7 }}
                  isThreeD={false}
                  roundedTop
                />
              </ScrollView>
            </View>
          ) : null}

          {/* Search, account selection, and type filters control the activity list. */}
          <View className="mb-4 flex-row items-center rounded-2xl border border-[#E7E5DE] bg-white px-4">
            <Feather name="search" size={17} color="#858A94" />
            <TextInput
              accessibilityLabel="Search transactions"
              value={search}
              onChangeText={setSearch}
              placeholder="Search transactions"
              placeholderTextColor="#9A9EA6"
              returnKeyType="search"
              className="h-12 min-w-0 flex-1 px-3 text-sm text-[#303641]"
            />
            {search.length > 0 ? (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel="Clear search"
                onPress={() => setSearch("")}
                className="h-8 w-8 items-center justify-center"
              >
                <Feather name="x" size={16} color="#858A94" />
              </TouchableOpacity>
            ) : null}
          </View>

          {accounts.length > 0 ? (
            <ScrollView
              horizontal
              className="mb-4"
              contentContainerClassName="gap-2"
              showsHorizontalScrollIndicator={false}
            >
              {[{ id: null, name: "All accounts" }, ...accounts].map(
                (account) => {
                  const selected = activeAccountId === account.id;
                  return (
                    <TouchableOpacity
                      key={account.id ?? "all"}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      onPress={() => setActiveAccountId(account.id)}
                      className={`rounded-full border px-4 py-2.5 ${
                        selected
                          ? "border-brand-bg bg-brand-bg"
                          : "border-[#E7E5DE] bg-white"
                      }`}
                    >
                      <Text
                        className={`text-xs font-medium ${
                          selected ? "text-white" : "text-[#697586]"
                        }`}
                      >
                        {account.name}
                      </Text>
                    </TouchableOpacity>
                  );
                },
              )}
            </ScrollView>
          ) : null}

          <View className="mb-5 flex-row rounded-2xl bg-[#EAE9E3] p-1">
            {FILTERS.map(({ label, value }) => {
              const selected = activeFilter === value;
              return (
                <TouchableOpacity
                  key={value}
                  accessibilityRole="button"
                  accessibilityState={{ selected }}
                  onPress={() => setActiveFilter(value)}
                  className={`flex-1 items-center rounded-xl px-3 py-2.5 ${
                    selected ? "bg-white" : ""
                  }`}
                  style={
                    selected
                      ? {
                          shadowColor: "#18202C",
                          shadowOpacity: 0.06,
                          shadowRadius: 5,
                          shadowOffset: { width: 0, height: 2 },
                          elevation: 1,
                        }
                      : undefined
                  }
                >
                  <Text
                    className={`text-xs font-semibold ${
                      selected ? "text-[#303641]" : "text-[#858A94]"
                    }`}
                  >
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View className="mb-3 flex-row items-center justify-between">
            <Text className="text-base font-semibold text-[#303641]">
              All activity
            </Text>
            <Text className="text-xs text-[#858A94]">
              {visibleTransactions.length}{" "}
              {visibleTransactions.length === 1 ? "result" : "results"}
            </Text>
          </View>

          {/* Show loading/error states before rendering the grouped results or empty state. */}
          {transactionsLoading ? (
            <View className="items-center rounded-[22px] border border-[#E7E5DE] bg-white py-10">
              <ActivityIndicator color="#1A85FF" />
              <Text className="mt-3 text-xs text-[#858A94]">
                Loading transactions…
              </Text>
            </View>
          ) : transactionsError ? (
            <View className="items-center rounded-[22px] border border-[#E7E5DE] bg-white px-5 py-8">
              <Text className="text-sm font-semibold text-[#303641]">
                Couldn’t load your transactions
              </Text>
              <Text className="mt-1 text-center text-xs leading-5 text-[#858A94]">
                Check your connection and try again.
              </Text>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => void refetchTransactions()}
                className="mt-4 rounded-xl bg-brand-bg px-4 py-3"
              >
                <Text className="text-xs font-semibold text-white">
                  Try again
                </Text>
              </TouchableOpacity>
            </View>
          ) : groupedTransactions.length > 0 ? (
            groupedTransactions.map((group) => (
              <View key={group.date} className="mb-5">
                <View className="mb-2 flex-row items-center justify-between px-1">
                  <Text className="text-xs font-semibold text-[#697586]">
                    {group.heading}
                  </Text>
                  <Text className="text-[10px] text-[#9A9EA6]">
                    {format(parseISO(group.date), "MMM d")}
                  </Text>
                </View>
                <View className="overflow-hidden rounded-[22px] border border-[#E7E5DE] bg-white px-4">
                  {group.transactions.map((transaction, index) => (
                    <TransactionListItem
                      key={transaction.id}
                      transaction={transaction}
                      currency={currency}
                      accountName={
                        accounts.find(
                          (account) => account.id === transaction.account_id,
                        )?.name
                      }
                      showDivider={index < group.transactions.length - 1}
                      onDelete={() => setTransactionToDelete(transaction)}
                    />
                  ))}
                </View>
              </View>
            ))
          ) : (
            <View className="items-center rounded-[22px] border border-[#E7E5DE] bg-white px-5 py-9">
              <View className="h-12 w-12 items-center justify-center rounded-full bg-[#F2F5F9]">
                <Feather name="inbox" size={20} color="#8A94A3" />
              </View>
              <Text className="mt-3 text-sm font-semibold text-[#303641]">
                {chartTransactions.length === 0
                  ? "No transactions yet"
                  : "No matching transactions"}
              </Text>
              <Text className="mt-1 text-center text-xs leading-5 text-[#858A94]">
                {chartTransactions.length === 0
                  ? "Add your first transaction to see your activity here."
                  : "Try changing your filters or search for something else."}
              </Text>
              {chartTransactions.length === 0 ? (
                <TouchableOpacity
                  accessibilityRole="button"
                  onPress={() =>
                    router.push({
                      pathname: "/(root)/(tabs)/add-transaction",
                      params: { action: "manual" },
                    })
                  }
                  className="mt-4 flex-row items-center gap-2 rounded-xl bg-brand-bg px-4 py-3"
                >
                  <Feather name="plus" size={15} color="#FFFFFF" />
                  <Text className="text-xs font-semibold text-white">
                    Add transaction
                  </Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Confirm deletion, then surface mutation errors in a separate dialog. */}
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
