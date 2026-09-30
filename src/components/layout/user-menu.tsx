"use client";

import { LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useAppData } from "@/components/providers/app-data-provider";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

function initials(name: string, email: string): string {
  const source = name.trim() || email.split("@")[0] || "U";
  const parts = source.split(/[\s._-]+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "U") + (parts[1]?.[0] ?? "")).toUpperCase();
}

export function UserMenu({ variant = "topbar", collapsed = false }: { variant?: "topbar" | "sidebar"; collapsed?: boolean }) {
  const { profile, mode, signOut } = useAppData();
  const name = profile.full_name || (mode === "demo" ? "Demo Seller" : "Your account");
  const email = profile.email || (mode === "demo" ? "demo@profitpilot.app" : "");
  const avatar = (
    <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
      {initials(profile.full_name || (mode === "demo" ? "Demo Seller" : ""), profile.email)}
    </span>
  );
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="User menu"
        className={cn(
          "flex items-center gap-2.5 rounded-lg text-left focus-visible:outline-2 focus-visible:outline-ring",
          variant === "sidebar" && "px-2 py-2 hover:bg-accent",
          variant === "sidebar" && collapsed && "justify-center px-0",
        )}
      >
        {avatar}
        {variant === "sidebar" && !collapsed && (
          <span className="min-w-0">
            <span className="block truncate text-[13px] font-medium">{name}</span>
            <span className="block truncate text-xs text-muted-foreground">{email}</span>
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align={variant === "sidebar" ? "start" : "end"} side={variant === "sidebar" ? "top" : "bottom"}>
        <DropdownMenuLabel>{email || name}</DropdownMenuLabel>
        <DropdownMenuItem asChild>
          <Link href="/settings"><Settings /> Settings</Link>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onSelect={() => void signOut()}>
          <LogOut /> {mode === "demo" ? "Exit demo" : "Log out"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
