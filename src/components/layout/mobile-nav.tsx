"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { PRIMARY_NAV } from "./nav";

export function MobileNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t bg-card/95 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      {PRIMARY_NAV.map((item) => {
        const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn("flex flex-col items-center gap-1 py-2.5 text-[11px] font-medium text-muted-foreground", active && "text-foreground")}
          >
            <item.icon className="size-5" aria-hidden />
            {item.label.replace(" Data", "")}
          </Link>
        );
      })}
    </nav>
  );
}
