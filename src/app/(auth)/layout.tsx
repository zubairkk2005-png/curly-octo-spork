import Link from "next/link";
import type { ReactNode } from "react";
import { Logo } from "@/components/layout/logo";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col px-6 py-6 sm:px-12">
        <Logo />
        <div className="flex flex-1 items-center justify-center py-12">{children}</div>
        <Link href="/" className="text-[13px] text-muted-foreground hover:text-foreground">← Back to home</Link>
      </div>
      <div className="hidden flex-col justify-center border-l bg-muted px-16 lg:flex">
        <p className="text-3xl font-semibold leading-tight tracking-tight">Know your real profit.</p>
        <p className="mt-4 max-w-md text-muted-foreground">Import your orders, see revenue, costs and net profit side by side, and ask AI what changed — using only your own numbers.</p>
      </div>
    </div>
  );
}
