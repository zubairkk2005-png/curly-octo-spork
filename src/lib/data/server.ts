import type { SupabaseClient, User } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { isSupabaseConfigured } from "@/lib/env";
import { createClient } from "@/lib/supabase/server";
import type { CurrencyCode, Order, Product, Profile } from "@/lib/types";
import { rowToOrder, rowToProduct } from "./mappers";

const PAGE = 1000;
const MAX_ORDERS = 20_000;

export interface Session {
  supabase: SupabaseClient;
  user: User;
}

/** Returns the signed-in user, or null (also null when Supabase isn't configured). */
export async function getSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = await createClient();
    const { data } = await supabase.auth.getUser();
    return data.user ? { supabase, user: data.user } : null;
  } catch (err) {
    console.error("[auth] getSession failed", err instanceof Error ? err.message : err);
    return null;
  }
}

export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** For API routes: a Session or a ready-to-return error response. */
export async function requireSession(): Promise<Session | NextResponse> {
  if (!isSupabaseConfigured()) {
    return apiError("Supabase isn't configured, so this action is only available in demo mode.", 503);
  }
  const session = await getSession();
  return session ?? apiError("Please sign in again.", 401);
}

export async function fetchOrders(supabase: SupabaseClient): Promise<Order[]> {
  const orders: Order[] = [];
  for (let from = 0; from < MAX_ORDERS; from += PAGE) {
    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .order("order_date", { ascending: true })
      .range(from, from + PAGE - 1);
    if (error) throw error;
    orders.push(...(data ?? []).map(rowToOrder));
    if (!data || data.length < PAGE) break;
  }
  return orders;
}

export async function fetchProducts(supabase: SupabaseClient): Promise<Product[]> {
  const { data, error } = await supabase.from("products").select("*").order("name");
  if (error) throw error;
  return (data ?? []).map(rowToProduct);
}

export async function fetchProfile(session: Session): Promise<Profile> {
  const { supabase, user } = session;
  const { data } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  const currency = (["GBP", "USD", "EUR", "PKR"] as const).find((c) => c === data?.currency) ?? "GBP";
  return {
    full_name: String(data?.full_name ?? user.user_metadata?.full_name ?? ""),
    business_name: String(data?.business_name ?? ""),
    currency: currency as CurrencyCode,
    email: user.email ?? "",
  };
}
