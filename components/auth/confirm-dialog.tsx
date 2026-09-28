import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Text } from "@/components/ui/text";

interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  confirmClassName?: string;
  cancelText?: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function ConfirmDialog({
  open,
  title = "Confirmation",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmClassName,
  onConfirm,
  onOpenChange,
}: ConfirmDialogProps) {
  const handleConfirm = () => {
    onOpenChange(false);
    onConfirm();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>

          <AlertDialogDescription>{message}</AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>
            <Text>{cancelText}</Text>
          </AlertDialogCancel>

          <AlertDialogAction
            className={
              confirmClassName ??
              "bg-brand-success hover:bg-brand-success/90 active:bg-brand-success/90"
            }
            onPress={handleConfirm}
          >
            <Text className="text-white bg-transparent">{confirmText}</Text>
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
