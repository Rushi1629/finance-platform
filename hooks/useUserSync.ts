import { useSupabase } from "@/hooks/useSupabase";
import { useUserStore } from "@/store/userStore";
import { useUser } from "@clerk/expo";
import { useEffect, useState } from "react";

export const useUserSync = () => {
  const { user } = useUser();
  const setCurrency = useUserStore((state) => state.setCurrency);
  const setNeedsOnboarding = useUserStore((state) => state.setNeedsOnboarding);
  const authSupabase = useSupabase();

  const [errorDialog, setErrorDialog] = useState({
    open: false,
    title: "",
    message: "",
  });

  const showErrorDialog = (title: string, message: string) => {
    setErrorDialog({
      open: true,
      title,
      message,
    });
  };

  useEffect(() => {
    if (!user) return;

    const syncUser = async () => {
      try {
        const { data: existingUser, error: fetchError } = await authSupabase
          .from("users")
          .select("clerk_id, currency")
          .eq("clerk_id", user.id)
          .single();

        if (fetchError && fetchError.code !== "PGRST116") {
          showErrorDialog("Error", fetchError.message);
          setNeedsOnboarding(true);
          return;
        }

        if (existingUser) {
          setCurrency(existingUser.currency ?? "INR");
          setNeedsOnboarding(!existingUser.currency);
          return;
        }

        const email = user.emailAddresses[0].emailAddress;

        const { data: newUser, error: insertError } = await authSupabase
          .from("users")
          .upsert(
            {
              clerk_id: user.id,
              email,
              name: `${user.firstName ?? ""} ${user.lastName ?? ""}`.trim(),
              image_url: user.imageUrl,
            },
            { onConflict: "clerk_id", ignoreDuplicates: false },
          )
          .select("currency")
          .single();

        if (insertError) {
          showErrorDialog("Error", insertError.message);
          setNeedsOnboarding(true);
          return;
        }

        setCurrency(newUser?.currency ?? "INR");
        setNeedsOnboarding(!newUser?.currency);

        const { error: accountError } = await authSupabase
          .from("accounts")
          .insert({
            user_id: user.id,
            name: "Cash",
            type: "CASH",
            balance: 0,
            is_default: true,
          });

        if (accountError) {
          showErrorDialog("Error", accountError.message);
        }
      } catch (e) {
        console.error("Unexpected sync error:", e);

        showErrorDialog(
          "Error",
          e instanceof Error ? e.message : "An unexpected error occurred.",
        );
        setNeedsOnboarding(true);
      }
    };

    syncUser();
  }, [user?.id]);
};
