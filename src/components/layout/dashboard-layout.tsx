"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { MobileNav } from "./mobile-nav";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

function DemoBanner() {
  const { mode, isDemo } = useAppData();
  if (!isDemo) return null;
  return (
    <div className="border-b bg-warning-bg/60 px-4 py-2 text-[13px] md:px-8">
      <span className="font-medium">{mode === "demo" ? "Demo Mode" : "Demo Store"}:</span>{" "}
      you&apos;re looking at sample data.{" "}
      <Link href="/import" className="font-medium underline underline-offset-2">Import your orders</Link> to see your real profit.
      {mode === "demo" && " Supabase isn't configured, so changes are saved in this browser only."}
    </div>
  );
}

export function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col pb-16 md:pb-0">
        <Topbar />
        <DemoBanner />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-6 md:px-8">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
