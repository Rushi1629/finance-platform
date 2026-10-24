import { ConfirmDialog } from "@/components/auth/confirm-dialog";
import { ErrorDialog } from "@/components/auth/error-dialog";
import { AccountModal } from "@/components/profile/AccountModal";
import {
  CurrencyPicker,
  type CurrencyEntry,
} from "@/components/onboarding/CurrencyPicker";
import { Button } from "@/components/ui/button";
import { useAccountsQuery } from "@/hooks/queries/useAccountsQuery";
import { useSupabase } from "@/hooks/useSupabase";
import type { Account, AccountType } from "@/types/account";
import { formatPrice } from "@/lib/utils";
import { useUserStore } from "@/store/userStore";
import { useAuth, useUser } from "@clerk/expo";
import { Feather } from "@expo/vector-icons";
import { Image } from "expo-image";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const ACCOUNT_ICON: Record<AccountType, keyof typeof Feather.glyphMap> = {
  CASH: "dollar-sign",
  BANK: "home",
  CREDIT_CARD: "credit-card",
  SAVINGS: "shield",
};

function SectionHeading({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <View className="mb-3 mt-7">
      <Text className="text-base font-semibold text-[#1A1D26]">
        {title}
      </Text>
      <Text className="mt-1 text-xs text-[#5C5F68]">{subtitle}</Text>
    </View>
  );
}

function ProfileRow({
  icon,
  title,
  detail,
  trailing,
  onPress,
  danger = false,
}: {
  icon: keyof typeof Feather.glyphMap;
  title: string;
  detail?: string;
  trailing?: string;
  onPress?: () => void;
  danger?: boolean;
}) {
  const content = (
    <>
      <View
        className={`mr-3 h-10 w-10 items-center justify-center rounded-xl ${
          danger ? "bg-brand-coral/10" : "bg-[#1A85FF]/10"
        }`}
      >
        <Feather name={icon} size={17} color={danger ? "#FF6B4A" : "#1A85FF"} />
      </View>
      <View className="min-w-0 flex-1">
        <Text
          className={`text-sm font-medium ${
            danger ? "text-brand-coral"             : "text-[#1A1D26]"
          }`}
        >
          {title}
        </Text>
        {detail ? (
          <Text
            className="mt-1 text-xs text-[#5C5F68]"
            numberOfLines={1}
          >
            {detail}
          </Text>
        ) : null}
      </View>
      {trailing ? (
        <Text className="mr-2 text-xs font-medium text-[#5C5F68]">
          {trailing}
        </Text>
      ) : null}
      {onPress ? (
        <Feather name="chevron-right" size={17} color="#8A8D96" />
      ) : null}
    </>
  );

  if (!onPress) {
    return (
      <View className="min-h-[68px] flex-row items-center px-4 py-3">
        {content}
      </View>
    );
  }

  return (
    <Pressable
      accessibilityRole="button"
      className="min-h-[68px] flex-row items-center px-4 py-3 active:bg-[#F2F5F9]"
      onPress={onPress}
    >
      {content}
    </Pressable>
  );
}

function AccountCard({
  account,
  currency,
  onPress,
}: {
  account: Account;
  currency: string;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Edit ${account.name} account`}
      onPress={onPress}
      className="mb-2.5 flex-row items-center rounded-2xl border border-[#E7E5DE] bg-white px-4 py-4 active:bg-[#F2F5F9]"
    >
      <View className="mr-3 h-11 w-11 items-center justify-center rounded-xl bg-brand-blue/15">
        <Feather name={ACCOUNT_ICON[account.type]} size={19} color="#1A85FF" />
      </View>
      <View className="min-w-0 flex-1">
        <View className="flex-row items-center gap-2">
          <Text
            className="shrink text-sm font-semibold text-[#1A1D26]"
            numberOfLines={1}
          >
            {account.name}
          </Text>
          {account.is_default ? (
            <View className="rounded-full bg-brand-success/10 px-2 py-1">
              <Text className="text-[10px] font-semibold text-brand-success">
                DEFAULT
              </Text>
            </View>
          ) : null}
        </View>
        <Text className="mt-1 text-xs text-[#5C5F68]">
          {formatPrice(account.balance, currency)}
        </Text>
      </View>
      <Feather name="chevron-right" size={17} color="#8A8D96" />
    </Pressable>
  );
}

export default function ProfileScreen() {
  const { user } = useUser();
  const { signOut } = useAuth();
  const router = useRouter();
  const supabase = useSupabase();
  const currency = useUserStore((state) => state.currency);
  const setCurrency = useUserStore((state) => state.setCurrency);
  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const [showSignOutDialog, setShowSignOutDialog] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: "Something went wrong",
    message: "",
  });

  const {
    data: accounts = [],
    isLoading: loadingAccounts,
    isError: accountsError,
    refetch: refetchAccounts,
  } = useAccountsQuery();

  const showError = (title: string, message: string) => {
    setErrorDialog({ open: true, title, message });
  };

  const closeAccountModal = () => {
    setAccountModalOpen(false);
    setEditingAccount(null);
  };

  const openAccountModal = (account: Account | null) => {
    setEditingAccount(account);
    setAccountModalOpen(true);
  };

  const handlePickAvatar = async () => {
    if (!user || uploadingAvatar) return;

    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        showError(
          "Photo access needed",
          "Allow photo library access to choose a profile picture.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
        base64: true,
      });
      if (result.canceled) return;

      const asset = result.assets[0];
      if (!asset?.base64) {
        showError(
          "Image unavailable",
          "The selected photo couldn't be read. Choose another image.",
        );
        return;
      }

      setUploadingAvatar(true);
      const filename = asset.uri.split("/").pop() || "avatar.jpg";
      const extension = /\.(\w+)$/.exec(filename)?.[1]?.toLowerCase();
      const mimeType = extension ? `image/${extension}` : "image/jpeg";
      await user.setProfileImage({
        file: `data:${mimeType};base64,${asset.base64}`,
      });
    } catch (cause) {
      console.error("Profile image update failed:", cause);
      showError(
        "Photo upload failed",
        cause instanceof Error
          ? cause.message
          : "Couldn't upload your photo. Please try again.",
      );
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace("/(auth)/sign-in");
    } catch (cause) {
      console.error("Sign out failed:", cause);
      showError(
        "Sign out failed",
        cause instanceof Error
          ? cause.message
          : "Couldn't sign you out. Please try again.",
      );
    }
  };

  const handleCurrencySelect = async (selected: CurrencyEntry) => {
    setCurrencyPickerOpen(false);
    if (!user) {
      showError("Sign in required", "Sign in to update your currency.");
      return;
    }

    try {
      const { error } = await supabase
        .from("users")
        .update({ currency: selected.code })
        .eq("clerk_id", user.id);
      if (error) throw error;
      setCurrency(selected.code);
    } catch (cause) {
      console.error("Currency update failed:", cause);
      showError(
        "Currency update failed",
        cause instanceof Error
          ? cause.message
          : "Couldn't update your currency. Please try again.",
      );
    }
  };

  const displayName =
    [user?.firstName, user?.lastName].filter(Boolean).join(" ") ||
    "Your profile";
  const email = user?.emailAddresses?.[0]?.emailAddress ?? "No email address";

  return (
    <SafeAreaView className="flex-1 bg-[#F6F5F1]" edges={["top"]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 110 }}
      >
        <View className="flex-row items-center justify-between pb-5 pt-3">
          <View>
            <Text className="text-xs font-semibold uppercase tracking-[2px] text-brand-blue">
              YOUR MONEY, IN FOCUS
            </Text>
            <Text className="mt-1 text-2xl font-bold text-[#1A1D26]">
              Profile
            </Text>
          </View>
          <View className="h-11 w-11 items-center justify-center rounded-2xl border border-[#E7E5DE] bg-white">
            <Feather name="settings" size={19} color="#5C5F68" />
          </View>
        </View>

        <View className="overflow-hidden rounded-3xl border border-[#E7E5DE] bg-white p-5">
          <View className="flex-row items-center">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Change profile photo"
              accessibilityState={{ disabled: uploadingAvatar }}
              className="mr-4 h-[76px] w-[76px] items-center justify-center overflow-hidden rounded-full border-2 border-brand-blue bg-[#F2F5F9]"
              disabled={uploadingAvatar}
              onPress={() => void handlePickAvatar()}
            >
              {uploadingAvatar ? (
                <ActivityIndicator color="#1A85FF" />
              ) : user?.imageUrl && user.hasImage ? (
                <Image
                  source={{ uri: user.imageUrl }}
                  style={{ width: 72, height: 72 }}
                  contentFit="cover"
                />
              ) : (
                <Feather name="user" size={30} color="#5C5F68" />
              )}
              {!uploadingAvatar ? (
                <View className="absolute bottom-0 h-6 w-full items-center justify-center bg-black/60">
                  <Feather name="camera" size={12} color="#FFFFFF" />
                </View>
              ) : null}
            </Pressable>
            <View className="min-w-0 flex-1">
              <Text
                className="text-lg font-bold text-[#1A1D26]"
                numberOfLines={1}
              >
                {displayName}
              </Text>
              <Text
                className="mt-1 text-xs text-[#5C5F68]"
                numberOfLines={1}
              >
                {email}
              </Text>
              <View className="mt-3 self-start rounded-full bg-brand-blue/10 px-2.5 py-1">
                <Text className="text-[10px] font-semibold uppercase tracking-wide text-brand-blue">
                  Personal account
                </Text>
              </View>
            </View>
          </View>
        </View>

        <SectionHeading
          title="Your accounts"
          subtitle="Manage the places your money lives"
        />
        {loadingAccounts ? (
          <View className="items-center rounded-2xl border border-[#E7E5DE] bg-white py-7">
            <ActivityIndicator color="#1A85FF" />
            <Text className="mt-3 text-xs text-[#5C5F68]">
              Loading accounts…
            </Text>
          </View>
        ) : accountsError ? (
          <View className="items-center rounded-2xl border border-[#E7E5DE] bg-white px-5 py-6">
            <Text className="text-center text-sm text-[#5C5F68]">
              Couldn&apos;t load your accounts.
            </Text>
            <Button
              variant="outline"
              className="mt-4 rounded-xl border-[#E7E5DE] bg-[#F2F5F9]"
              onPress={() => void refetchAccounts()}
            >
              <Text className="text-sm font-semibold text-[#1A1D26]">
                Try again
              </Text>
            </Button>
          </View>
        ) : (
          <>
            {accounts.length > 0 ? (
              accounts.map((account) => (
                <AccountCard
                  key={account.id}
                  account={account}
                  currency={currency}
                  onPress={() => openAccountModal(account)}
                />
              ))
            ) : (
              <View className="rounded-2xl border border-[#E7E5DE] bg-white px-4 py-5">
                <Text className="text-sm font-medium text-[#1A1D26]">
                  No accounts yet
                </Text>
                <Text className="mt-1 text-xs leading-5 text-[#5C5F68]">
                  Add an account to start tracking your transactions.
                </Text>
              </View>
            )}
            <Button
              variant="outline"
              className="h-12 flex-row rounded-2xl border-dashed border-brand-blue/50 bg-brand-blue/5 active:bg-brand-blue/10"
              onPress={() => openAccountModal(null)}
            >
              <Feather name="plus" size={17} color="#1A85FF" />
              <Text className="text-sm font-semibold text-brand-blue">
                Add account
              </Text>
            </Button>
          </>
        )}

        <SectionHeading
          title="Preferences"
          subtitle="Personalize your finance experience"
        />
        <View className="overflow-hidden rounded-2xl border border-[#E7E5DE] bg-white">
          <ProfileRow
            icon="globe"
            title="Currency"
            detail="Used to display account balances"
            trailing={currency}
            onPress={() => setCurrencyPickerOpen(true)}
          />
          <View className="mx-4 h-px bg-[#E7E5DE]" />
          <ProfileRow
            icon="lock"
            title="Biometric lock"
            detail="Biometric security is coming soon"
            trailing="SOON"
          />
        </View>

        <SectionHeading
          title="Account"
          subtitle="Manage your signed-in session"
        />
        <View className="overflow-hidden rounded-2xl border border-[#E7E5DE] bg-white">
          <ProfileRow
            icon="log-out"
            title="Sign out"
            detail="Sign out from this device"
            danger
            onPress={() => setShowSignOutDialog(true)}
          />
        </View>
      </ScrollView>

      {accountModalOpen ? (
        <AccountModal
          visible={accountModalOpen}
          account={editingAccount}
          onClose={closeAccountModal}
          onSaved={closeAccountModal}
          onDeleted={closeAccountModal}
        />
      ) : null}
      <CurrencyPicker
        visible={currencyPickerOpen}
        selectedCode={currency}
        onSelect={(selected) => void handleCurrencySelect(selected)}
        onClose={() => setCurrencyPickerOpen(false)}
      />
      <ConfirmDialog
        open={showSignOutDialog}
        title="Sign out?"
        message="Are you sure you want to sign out of your account?"
        confirmText="Sign out"
        confirmClassName="bg-red-500 active:bg-red-700"
        cancelText="Cancel"
        onConfirm={() => void handleSignOut()}
        onOpenChange={setShowSignOutDialog}
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
