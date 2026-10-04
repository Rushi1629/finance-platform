import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/auth/form-field";
import { Text as UiText } from "@/components/ui/text";
import { useUpsertBudget } from "@/hooks/mutations/useBudgetMutations";
import { useUserStore } from "@/store/userStore";
import type { Budget } from "@/types/budget";
import { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  View,
} from "react-native";

type BudgetModalProps = {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
  onSaved: () => void;
};

export function BudgetModal({
  visible,
  budget,
  onClose,
  onSaved,
}: BudgetModalProps) {
  const currency = useUserStore((state) => state.currency);
  const formKey = visible
    ? `${budget?.id ?? "new"}:${budget?.amount ?? ""}`
    : "closed";

  return (
    <BudgetModalForm
      key={formKey}
      visible={visible}
      budget={budget}
      currency={currency}
      onClose={onClose}
      onSaved={onSaved}
    />
  );
}

function BudgetModalForm({
  visible,
  budget,
  currency,
  onClose,
  onSaved,
}: BudgetModalProps & { currency: string }) {
  const [amount, setAmount] = useState(budget ? String(budget.amount) : "");
  const [error, setError] = useState("");
  const { mutateAsync: upsertBudget, isPending: saving } = useUpsertBudget();

  const handleSave = async () => {
    const parsedAmount = parseFloat(amount.replace(/,/g, "").trim());

    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Enter a valid monthly budget.");
      return;
    }

    setError("");
    try {
      await upsertBudget(parsedAmount);
      onSaved();
    } catch (saveError) {
      console.error("Error saving budget:", saveError);
      setError("Something went wrong. Please try again.");
    }
  };

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent
        overlayClassName="items-end px-3 pb-3 pt-0"
        className="mx-0 max-w-none rounded-[28px] border-0 bg-brand-body px-5 pb-8 pt-5 shadow-2xl shadow-black/20"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            className="h-1.5 w-10 self-center rounded-full bg-[#D9D8D2]"
          />
          <DialogHeader>
            <DialogTitle className="mb-1 mr-12 text-2xl tracking-tight">
              {budget ? "Adjust your budget" : "Set your budget"}
            </DialogTitle>
            <DialogDescription>
              Choose a monthly spending limit that feels right for you.
            </DialogDescription>
          </DialogHeader>

          <View className="mt-6 rounded-2xl border border-[#E8E6DF] bg-white px-4 pt-4">
            <FormField
              label="Monthly spending limit"
              placeholder="0"
              value={amount}
              onChangeText={(value) => {
                setError("");
                setAmount(value);
              }}
              error={error}
              keyboardType="decimal-pad"
              autoFocus
              rightIcon={
                <View className="rounded-lg bg-[#EAF3FF] px-2.5 py-1.5">
                  <Text className="text-xs font-bold text-brand-blue">
                    {currency}
                  </Text>
                </View>
              }
            />
          </View>

          <Button
            onPress={handleSave}
            disabled={saving}
            accessibilityState={{ disabled: saving, busy: saving }}
            className="mt-6 h-14 rounded-2xl bg-brand-blue active:bg-[#4e77ef]"
          >
            <UiText className="text-sm font-semibold text-white">
              {saving ? "Saving…" : "Save budget"}
            </UiText>
          </Button>

          <DialogClose asChild>
            <Pressable
              accessibilityRole="button"
              className="mt-3 items-center rounded-xl py-3 active:bg-black/5"
            >
              <Text className="text-sm font-medium text-brand-text-secondary">
                Cancel
              </Text>
            </Pressable>
          </DialogClose>
        </KeyboardAvoidingView>
      </DialogContent>
    </Dialog>
  );
}
