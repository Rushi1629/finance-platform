export type BudgetModalProps = {
  visible: boolean;
  budget: Budget | null;
  onClose: () => void;
  onSaved: () => void;
};

export type Budget = {
  id: string;
  user_id: string;
  amount: number;
  last_alert_sent: string | null;
  created_at: string;
  updated_at: string;
};