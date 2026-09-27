import { useAuth } from "@clerk/expo";
import { Redirect, Slot, Stack } from "expo-router";

export default function RootLayout() {
  const { isLoaded, isSignedIn } = useAuth();

  if (!isLoaded) {
    return null;
  }

  if (!isSignedIn) {
    return <Redirect href="/sign-in" />;
  }
  return <Slot />;
}
