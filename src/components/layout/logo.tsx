import Link from "next/link";
import { cn } from "@/lib/utils";

export function LogoMark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground", className)}>
      <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <path d="M4 17l5-5 4 4 7-8" />
        <path d="M15 8h5v5" />
      </svg>
    </span>
  );
}

export function Logo({ href = "/", showName = true }: { href?: string; showName?: boolean }) {
  return (
    <Link href={href} className="flex items-center gap-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring" aria-label="ProfitPilot home">
      <LogoMark />
      {showName && <span className="text-[15px] font-semibold tracking-tight">ProfitPilot</span>}
    </Link>
  );
}
