"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input, Label } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/client";

const credentials = z.object({
  email: z.string().trim().email("Enter a valid email address."),
  password: z.string().min(8, "Use at least 8 characters."),
});

export function AuthForm({ mode, supabaseConfigured, linkError }: { mode: "login" | "signup"; supabaseConfigured: boolean; linkError?: boolean }) {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(linkError ? "That link is invalid or has expired. Please try again." : null);
  const [notice, setNotice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const isSignup = mode === "signup";

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setNotice(null);
    if (!supabaseConfigured) {
      router.push("/dashboard");
      return;
    }
    const parsed = credentials.safeParse({ email, password });
    if (!parsed.success) return setError(parsed.error.issues[0].message);
    setLoading(true);
    try {
      const supabase = createClient();
      if (isSignup) {
        const { data, error: err } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            data: { full_name: fullName.trim().slice(0, 100) },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        });
        if (err) throw err;
        if (!data.session) {
          setNotice("Check your email to confirm your account, then log in.");
          return;
        }
      } else {
        const { error: err } = await supabase.auth.signInWithPassword(parsed.data);
        if (err) throw err;
      }
      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error("[auth]", err instanceof Error ? err.message : err);
      const msg = err instanceof Error ? err.message.toLowerCase() : "";
      setError(
        msg.includes("invalid login") ? "That email and password don't match."
        : msg.includes("already") ? "An account with that email already exists. Try logging in."
        : msg.includes("rate") ? "Too many attempts. Please wait a moment and try again."
        : "We couldn't complete that. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="text-2xl font-semibold tracking-tight">{isSignup ? "Create your account" : "Welcome back"}</h1>
      <p className="mt-1.5 text-sm text-muted-foreground">{isSignup ? "Start seeing your real profit in minutes." : "Log in to your ProfitPilot dashboard."}</p>

      {!supabaseConfigured && (
        <div className="mt-5 rounded-xl border bg-warning-bg/60 p-3.5 text-[13px]">
          <b>Demo Mode.</b> Supabase isn&apos;t configured, so sign-in is skipped and the app runs on sample data saved in this browser.
        </div>
      )}

      <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        {supabaseConfigured && isSignup && (
          <div><Label htmlFor="name">Full name</Label><Input id="name" autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} maxLength={100} /></div>
        )}
        {supabaseConfigured && (
          <>
            <div><Label htmlFor="email">Email</Label><Input id="email" type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} required /></div>
            <div><div className="flex items-center justify-between"><Label htmlFor="password">Password</Label>{!isSignup && <Link href="/forgot-password" className="mb-1.5 text-xs text-muted-foreground hover:text-foreground">Forgot password?</Link>}</div><Input id="password" type="password" autoComplete={isSignup ? "new-password" : "current-password"} value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} /></div>
          </>
        )}
        {error && <p role="alert" className="text-[13px] text-negative">{error}</p>}
        {notice && <p role="status" className="text-[13px] text-positive">{notice}</p>}
        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {!supabaseConfigured ? "Continue to demo" : isSignup ? "Create account" : "Log in"}
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        {isSignup ? <>Already have an account? <Link href="/login" className="font-medium text-foreground underline underline-offset-2">Log in</Link></> : <>New to ProfitPilot? <Link href="/signup" className="font-medium text-foreground underline underline-offset-2">Create an account</Link></>}
      </p>
    </div>
  );
}
