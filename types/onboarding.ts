import { SupabaseClient } from "@supabase/supabase-js";

export type CompleteOnboardingParams = {
  supabase: SupabaseClient;
  userId: string;
  currency: string;
  startingBalance: number;
};