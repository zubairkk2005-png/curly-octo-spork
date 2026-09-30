"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { Logo } from "./logo";
import { PRIMARY_NAV, SETTINGS_NAV, type NavItem } from "./nav";
import { UserMenu } from "./user-menu";

function NavLink({ item, collapsed }: { item: NavItem; collapsed: boolean }) {
  const pathname = usePathname();
  const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
  return (
    <Link
      href={item.href}
      title={collapsed ? item.label : undefined}
      aria-current={active ? "page" : undefined}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring",
        active && "bg-accent text-foreground",
        collapsed && "justify-center px-0",
      )}
    >
      <item.icon className="size-[18px] shrink-0" aria-hidden />
      <span className={cn(collapsed && "sr-only")}>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  useEffect(() => {
    // tablets start collapsed
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (window.innerWidth < 1024) setCollapsed(true);
  }, []);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 flex-col border-r bg-card/60 py-4 transition-[width] md:flex",
        collapsed ? "w-16 px-2" : "w-60 px-3",
      )}
    >
      <div className={cn("mb-6 flex items-center px-2", collapsed && "justify-center px-0")}>
        <Logo href="/dashboard" showName={!collapsed} />
      </div>
      <nav aria-label="Main" className="flex flex-1 flex-col gap-0.5">
        {PRIMARY_NAV.map((item) => (
          <NavLink key={item.href} item={item} collapsed={collapsed} />
        ))}
      </nav>
      <div className="flex flex-col gap-0.5 border-t pt-3">
        <NavLink item={SETTINGS_NAV} collapsed={collapsed} />
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-muted-foreground hover:bg-accent hover:text-foreground",
            collapsed && "justify-center px-0",
          )}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <PanelLeftOpen className="size-[18px]" /> : <PanelLeftClose className="size-[18px]" />}
          {!collapsed && <span>Collapse</span>}
        </button>
        <UserMenu variant="sidebar" collapsed={collapsed} />
      </div>
    </aside>
  );
}
