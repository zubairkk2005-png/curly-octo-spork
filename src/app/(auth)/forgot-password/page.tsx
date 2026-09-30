import type { Metadata } from "next";
import { PasswordForm } from "@/components/layout/password-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Forgot password — ProfitPilot" };

export default function Page() {
  return <PasswordForm mode="forgot" supabaseConfigured={isSupabaseConfigured()} />;
}
