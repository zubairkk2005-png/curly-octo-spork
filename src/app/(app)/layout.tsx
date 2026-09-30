import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { AppDataProvider } from "@/components/providers/app-data-provider";
import { fetchOrders, fetchProducts, fetchProfile, getSession } from "@/lib/data/server";
import { isSupabaseConfigured } from "@/lib/env";
import type { Order, Product, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

const DEMO_PROFILE: Profile = { full_name: "", business_name: "Demo Store", currency: "GBP", email: "" };

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!isSupabaseConfigured()) {
    return (
      <AppDataProvider mode="demo" initialOrders={[]} initialProducts={[]} initialProfile={DEMO_PROFILE}>
        <DashboardLayout>{children}</DashboardLayout>
      </AppDataProvider>
    );
  }

  const session = await getSession();
  if (!session) redirect("/login");

  let orders: Order[] = [];
  let products: Product[] = [];
  let profile: Profile = { ...DEMO_PROFILE, business_name: "", email: session.user.email ?? "" };
  try {
    [orders, products, profile] = await Promise.all([
      fetchOrders(session.supabase),
      fetchProducts(session.supabase),
      fetchProfile(session),
    ]);
  } catch (err) {
    // Most likely the migration hasn't been run yet; log details server-side, show demo data.
    console.error("[app] failed to load workspace", err);
  }

  return (
    <AppDataProvider mode="supabase" initialOrders={orders} initialProducts={products} initialProfile={profile}>
      <DashboardLayout>{children}</DashboardLayout>
    </AppDataProvider>
  );
}
