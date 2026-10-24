import { ConfirmDialog } from "@/components/auth/confirm-dialog";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Text } from "@/components/ui/text";
import {
  useCreateAccount,
  useDeleteAccount,
  useSetDefaultAccount,
  useUpdateAccount,
} from "@/hooks/mutations/useAccountMutations";
import type { Account, AccountType } from "@/types/account";
import { Feather } from "@expo/vector-icons";
import { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";

const ACCOUNT_TYPES: {
  value: AccountType;
  label: string;
  icon: keyof typeof Feather.glyphMap;
}[] = [
  { value: "BANK", label: "Bank", icon: "home" },
  { value: "CASH", label: "Cash", icon: "dollar-sign" },
  { value: "CREDIT_CARD", label: "Credit card", icon: "credit-card" },
  { value: "SAVINGS", label: "Savings", icon: "shield" },
];

type AccountModalProps = {
  visible: boolean;
  account: Account | null;
  onClose: () => void;
  onSaved: () => void;
  onDeleted: () => void;
};

export function AccountModal({
  visible,
  account,
  onClose,
  onSaved,
  onDeleted,
}: AccountModalProps) {
  const [name, setName] = useState(account?.name ?? "");
  const [type, setType] = useState<AccountType>(account?.type ?? "BANK");
  const [errorMessage, setErrorMessage] = useState("");
  const [deleteConfirmation, setDeleteConfirmation] = useState<number | null>(
    null,
  );
  const createAccount = useCreateAccount();
  const updateAccount = useUpdateAccount();
  const deleteAccount = useDeleteAccount();
  const setDefaultAccount = useSetDefaultAccount();
  const saving = createAccount.isPending || updateAccount.isPending;
  const deleting = deleteAccount.isPending;
  const updatingDefault = setDefaultAccount.isPending;

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      setErrorMessage("Enter a name for this account.");
      return;
    }

    setErrorMessage("");
    try {
      if (account) {
        await updateAccount.mutateAsync({
          accountId: account.id,
          payload: { name: trimmedName, type },
        });
      } else {
        await createAccount.mutateAsync({ name: trimmedName, type });
      }
      onSaved();
    } catch (cause) {
      console.error("Account save failed:", cause);
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "Couldn't save this account. Please try again.",
      );
    }
  };

  const handleSetDefault = async () => {
    if (!account || account.is_default) return;

    setErrorMessage("");
    try {
      await setDefaultAccount.mutateAsync(account.id);
      onSaved();
    } catch (cause) {
      console.error("Setting default account failed:", cause);
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "Couldn't set this as the default account.",
      );
    }
  };

  const handleDelete = async (force = false) => {
    if (!account) return;

    setErrorMessage("");
    try {
      const result = await deleteAccount.mutateAsync({
        accountId: account.id,
        force,
      });
      if (!result.deleted) {
        setDeleteConfirmation(result.transactionCount);
        return;
      }
      setDeleteConfirmation(null);
      onDeleted();
    } catch (cause) {
      console.error("Account deletion failed:", cause);
      setErrorMessage(
        cause instanceof Error
          ? cause.message
          : "Couldn't delete this account. Please try again.",
      );
    }
  };

  return (
    <>
      <Dialog
        open={visible}
        onOpenChange={(open) => {
          if (!open) onClose();
        }}
      >
        <DialogContent className="w-full max-w-[calc(100%-2rem)] gap-5 rounded-3xl border-[#E7E5DE] bg-white p-6">
          <View className="gap-2 pr-8">
            <DialogTitle className="text-xl font-bold text-[#1A1D26]">
              {account ? "Account details" : "Add account"}
            </DialogTitle>
            <DialogDescription className="text-sm leading-5 text-[#5C5F68]">
              {account
                ? "Update the account name or type."
                : "Add an account to keep your finances organized."}
            </DialogDescription>
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-black">
              Account name
            </Text>
            <Input
              autoCapitalize="words"
              maxLength={50}
              onChangeText={setName}
              placeholder="e.g. Everyday checking"
              placeholderTextColor="#5C5F68"
              value={name}
              className="h-12 rounded-xl border-[#5d6371] bg-white text-[#1A1D26] dark:bg-white dark:text-black"
            />
          </View>

          <View className="gap-2">
            <Text className="text-sm font-medium text-[#1A1D26]">
              Account type
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {ACCOUNT_TYPES.map((option) => {
                const selected = type === option.value;
                return (
                  <Pressable
                    key={option.value}
                    accessibilityRole="button"
                    accessibilityState={{ selected }}
                    onPress={() => setType(option.value)}
                    className={`min-h-10 flex-row items-center gap-2 rounded-xl border px-3 ${
                      selected
                        ? "border-brand-blue bg-brand-blue/15"
                        : "border-[#E7E5DE] bg-[#F6F5F1]"
                    }`}
                  >
                    <Feather
                      name={option.icon}
                      size={14}
                      color={selected ? "#1A85FF" : "#5C5F68"}
                    />
                    <Text
                      className={`text-xs font-medium ${
                        selected ? "text-[#1A1D26]" : "text-[#5C5F68]"
                      }`}
                    >
                      {option.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          <View className="gap-3">
            <Button
              className="h-12 rounded-xl bg-brand-blue active:bg-brand-blue/90"
              disabled={saving || deleting || updatingDefault}
              onPress={() => void handleSave()}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text className="font-semibold text-white">
                  {account ? "Save changes" : "Add account"}
                </Text>
              )}
            </Button>
            {account ? (
              <View className="flex-row gap-2">
                <Button
                  className={`flex-1 rounded-xl border ${
                    account.is_default
                      ? "border-[#B8E3C7] bg-[#E8F7EE] dark:border-[#B8E3C7] dark:bg-[#E8F7EE]"
                      : "border-[#B8E3C7] bg-[#E8F7EE] dark:border-[#B8E3C7] dark:bg-[#E8F7EE] active:bg-[#D5F0DF] dark:active:bg-[#D5F0DF]"
                  }`}
                  disabled={
                    account.is_default || saving || deleting || updatingDefault
                  }
                  onPress={() => void handleSetDefault()}
                  variant="outline"
                >
                  {updatingDefault ? (
                    <ActivityIndicator color="#18864B" />
                  ) : (
                    <Text
                      className={`text-xs font-semibold ${
                        account.is_default
                          ? "text-[#18864B] dark:text-[#18864B] hover:text-[#18864B]"
                          : "text-[#18864B] dark:text-[#18864B] hover:text-[#18864B]"
                      }`}
                    >
                      {account.is_default ? "Default account" : "Make default"}
                    </Text>
                  )}
                </Button>
                <Button
                  className={`flex-1 rounded-xl border ${
                    account.is_default
                      ? "border-[#F3C4B8] bg-[#FFF0EC] dark:border-[#F3C4B8] dark:bg-[#FFF0EC]"
                      : "border-[#F3C4B8] bg-[#FFF0EC] dark:border-[#F3C4B8] dark:bg-[#FFF0EC] active:bg-[#FBE0D9] dark:active:bg-[#FBE0D9]"
                  }`}
                  disabled={
                    account.is_default || saving || deleting || updatingDefault
                  }
                  onPress={() => void handleDelete()}
                  variant="outline"
                >
                  {deleting ? (
                    <ActivityIndicator color="#C8462A" />
                  ) : (
                    <Text className="text-xs font-semibold text-[#C8462A]">
                      {account.is_default ? "Set Another Default" : "Delete"}
                    </Text>
                  )}
                </Button>
              </View>
            ) : null}
          </View>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmation !== null}
        title="Delete account?"
        message={`This will also delete ${
          deleteConfirmation ?? 0
        } linked transaction${
          deleteConfirmation === 1 ? "" : "s"
        }. This action cannot be undone.`}
        confirmText="Delete account"
        confirmClassName="bg-red-500 active:bg-red-700"
        cancelText="Keep account"
        onConfirm={() => void handleDelete(true)}
        onOpenChange={(open) => {
          if (!open) setDeleteConfirmation(null);
        }}
      />

      <ErrorDialog
        open={Boolean(errorMessage)}
        title="Account error"
        message={errorMessage}
        onOpenChange={(open) => {
          if (!open) setErrorMessage("");
        }}
      />
    </>
  );
}
