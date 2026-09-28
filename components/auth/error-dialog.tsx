import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Text } from "@/components/ui/text";

interface ErrorDialogProps {
  open: boolean;
  title?: string;
  message: string;
  onOpenChange: (open: boolean) => void;
}

export function ErrorDialog({
  open,
  title = "Error",
  message,
  onOpenChange,
}: ErrorDialogProps) {
  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>

          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogAction
            className="bg-destructive hover:bg-destructive/90 active:bg-destructive/90"
            onPress={() => onOpenChange(false)}
          >
            <Text className="text-white bg-transparent">OK</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
