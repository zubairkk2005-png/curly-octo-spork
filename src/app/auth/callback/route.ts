import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";

/** Completes email confirmation and password-recovery links. */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const next = url.searchParams.get("next") ?? "/dashboard";
  // only allow same-site relative redirects
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/dashboard";

  if (isSupabaseConfigured() && code) {
    try {
      const supabase = await createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
      console.error("[auth/callback]", error.message);
    } catch (err) {
      console.error("[auth/callback]", err instanceof Error ? err.message : err);
    }
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
