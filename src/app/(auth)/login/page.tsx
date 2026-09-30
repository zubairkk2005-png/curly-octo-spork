import type { Metadata } from "next";
import { AuthForm } from "@/components/layout/auth-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Log in — ProfitPilot" };

export default function Page() {
  return <AuthForm mode="login" supabaseConfigured={isSupabaseConfigured()} />;
}
