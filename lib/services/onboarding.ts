import { CompleteOnboardingParams } from "@/types/onboarding";
export async function completeOnboarding({
  supabase,
  userId,
  currency,
  startingBalance,
}: CompleteOnboardingParams) {
  // 1. Update currency
  const { error: currencyError } = await supabase
    .from("users")
    .update({ currency })
    .eq("clerk_id", userId);

  if (currencyError) throw currencyError;

  // 2. Get default Cash account
  const { data: account, error: accountError } = await supabase
    .from("accounts")
    .select("id, balance")
    .eq("user_id", userId)
    .eq("is_default", true)
    .single();

  if (accountError) throw accountError;

  // 3. Add starting balance transaction
  const { error: transactionError } = await supabase
    .from("transactions")
    .insert({
      user_id: userId,
      account_id: account.id,
      type: "INCOME",
      amount: startingBalance,
      category: "other_income",
      description: "Starting balance",
      date: new Date().toISOString(),
      input_method: "MANUAL",
    });

  if (transactionError) throw transactionError;

  // 4. Update account balance
  const { error: balanceError } = await supabase
    .from("accounts")
    .update({
      balance: account.balance + startingBalance,
    })
    .eq("id", account.id);

  if (balanceError) throw balanceError;

  return {
    currency,
    balance: account.balance + startingBalance,
  };
}
