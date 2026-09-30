"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { Select } from "@/components/ui/input";
import { CURRENCIES } from "@/lib/currency";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/types";

export function CurrencySelect({ className }: { className?: string }) {
  const { currency, setCurrency } = useAppData();
  return (
    <Select
      aria-label="Display currency"
      className={className ?? "w-[92px] font-medium"}
      value={currency}
      onChange={(e) => setCurrency(e.target.value as CurrencyCode)}
    >
      {CURRENCY_CODES.map((c) => (
        <option key={c} value={c}>
          {CURRENCIES[c].symbol} {c}
        </option>
      ))}
    </Select>
  );
}
