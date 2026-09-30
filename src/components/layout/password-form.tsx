"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

export function PasswordForm({ mode, supabaseConfigured }: { mode: "forgot" | "reset"; supabaseConfigured: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const forgot = mode === "forgot";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (forgot && !/^\S+@\S+\.\S+$/.test(value.trim())) return setError("Enter a valid email address.");
    if (!forgot && value.length < 8) return setError("Use at least 8 characters.");
    setLoading(true);
    try {
      const supabase = createClient();
      if (forgot) {
        const { error: err } = await supabase.auth.resetPasswordForEmail(value.trim(), {
          redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
        });
        if (err) throw err;
        setNotice("If an account exists for that email, a reset link is on its way.");
      } else {
        const { error: err } = await supabase.auth.updateUser({ password: value });
        if (err) throw err;
        router.push("/dashboard");
        router.refresh();
      }
    } catch (err) {
      console.error("[password]", err instanceof Error ? err.message : err);
      setError("We couldn't complete that. Please try again, or request a new link.");
    } finally {
      setLoading(false);
    }
  }

  if (!supabaseConfigured) {
    return (
      <div className="w-full max-w-sm text-sm text-muted-foreground">
        Password reset needs Supabase. In Demo Mode there are no accounts. <Link href="/login" className="font-medium text-foreground underline">Back to login</Link>
      </div>
    );
  }
  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{forgot ? "Reset your password" : "Choose a new password"}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{forgot ? "We'll email you a link to set a new one." : "Use at least 8 characters."}</p>
      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="v">{forgot ? "Email" : "New password"}</Label>
          <Input id="v" type={forgot ? "email" : "password"} autoComplete={forgot ? "email" : "new-password"} value={value} onChange={(e) => setValue(e.target.value)} required />
        </div>
        {error && <p role="alert" className="text-[13px] text-negative">{error}</p>}
        {notice && <p role="status" className="text-[13px] text-positive">{notice}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>{forgot ? "Send reset link" : "Update password"}</Button>
      </form>
      <p className="mt-6 text-center text-sm text-muted-foreground"><Link href="/login" className="font-medium text-foreground underline underline-offset-2">Back to login</Link></p>
    </div>
  );
}
