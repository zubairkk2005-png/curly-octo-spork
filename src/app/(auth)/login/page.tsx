import type { Metadata } from "next";
import { AuthForm } from "@/components/layout/auth-form";
import { isSupabaseConfigured } from "@/lib/env";

export const metadata: Metadata = { title: "Log in — ProfitPilot" };

export default async function Page({ searchParams }: PageProps<"/login">) {
  const { error } = await searchParams;
  return <AuthForm mode="login" supabaseConfigured={isSupabaseConfigured()} linkError={error === "link"} />;
}
