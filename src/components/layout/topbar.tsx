"use client";

import { usePathname } from "next/navigation";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { AskAiDrawer } from "@/components/ai/ask-ai-drawer";
import { Logo } from "./logo";
import { CurrencySelect } from "./currency-select";
import { DateRangePicker } from "./date-range-picker";
import { pageTitle } from "./nav";
import { UserMenu } from "./user-menu";

export function Topbar() {
  const pathname = usePathname();
  const { mode, isDemo } = useAppData();
  return (
    <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-3 md:px-8">
        <div className="mr-auto flex items-center gap-3">
          <div className="md:hidden"><Logo href="/dashboard" showName={false} /></div>
          <h1 className="text-lg font-semibold tracking-tight">{pageTitle(pathname)}</h1>
          {mode === "demo" ? (
            <Badge variant="warning">Demo Mode</Badge>
          ) : isDemo ? (
            <Badge variant="warning">Demo Store</Badge>
          ) : null}
        </div>
        <div className="order-3 flex w-full items-center gap-2 sm:order-none sm:w-auto">
          <DateRangePicker />
          <CurrencySelect />
          <div className="ml-auto sm:ml-0"><AskAiDrawer /></div>
        </div>
        <UserMenu />
      </div>
    </header>
  );
}
