import React from "react";
import { View, Text } from "react-native";
import { useAuth, useUser } from "@clerk/expo";

import { Button } from "@/components/ui/button";
import { ConfirmDialog } from "@/components/auth/confirm-dialog";
import { cn } from "@/lib/utils";

export default function Profile() {
  const { signOut } = useAuth();
  const { user } = useUser();

  const [showSignOutDialog, setShowSignOutDialog] = React.useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <View className="flex-1 p-6">
      <Text>Profile</Text>

      <Text>
        {user?.firstName} {user?.lastName}
      </Text>

      <Text>{user?.emailAddresses[0]?.emailAddress}</Text>

      <Button className={cn("mt-4 bg-primary")} onPress={() => setShowSignOutDialog(true)}>
        <Text className="">Sign Out</Text>
      </Button>

      <ConfirmDialog
        open={showSignOutDialog}
        title="Sign Out"
        message="Are you sure you want to sign out?"
        confirmText="Sign Out"
        cancelText="Cancel"
        confirmClassName="bg-red-500 active:bg-red-700"
        onConfirm={handleSignOut}
        onOpenChange={setShowSignOutDialog}
      />
    </View>
  );
}
