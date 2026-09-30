"use client";

import { formatCurrency } from "@/lib/currency";
import type { CurrencyCode } from "@/lib/types";
import { useAppData } from "@/components/providers/app-data-provider";
import { cn } from "@/lib/utils";

/** Formats an amount that is already in the display currency (or `currency` when given). */
export function CurrencyDisplay({
  value,
  currency,
  compact,
  signed,
  colored,
  className,
}: {
  value: number | null | undefined;
  currency?: CurrencyCode;
  compact?: boolean;
  signed?: boolean;
  colored?: boolean;
  className?: string;
}) {
  const app = useAppData();
  const code = currency ?? app.currency;
  const n = Number.isFinite(value) ? (value as number) : 0;
  return (
    <span className={cn("tabular", colored && n > 0 && "text-positive", colored && n < 0 && "text-negative", className)}>
      {formatCurrency(n, code, { compact, signed })}
    </span>
  );
}
