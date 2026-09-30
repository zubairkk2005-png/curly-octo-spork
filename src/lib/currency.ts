import type { CurrencyCode } from "./types";

export const CURRENCIES: Record<
  CurrencyCode,
  { label: string; symbol: string; locale: string; perGBP: number }
> = {
  GBP: { label: "British Pound", symbol: "£", locale: "en-GB", perGBP: 1 },
  USD: { label: "US Dollar", symbol: "$", locale: "en-US", perGBP: 1.27 },
  EUR: { label: "Euro", symbol: "€", locale: "en-IE", perGBP: 1.17 },
  PKR: { label: "Pakistani Rupee", symbol: "Rs", locale: "en-PK", perGBP: 355 },
};

/** Indicative static rates (units of currency per 1 GBP). Replace with live FX for production. */
export function convertAmount(amount: number, from: CurrencyCode, to: CurrencyCode): number {
  if (!Number.isFinite(amount)) return 0;
  if (from === to) return amount;
  return (amount / CURRENCIES[from].perGBP) * CURRENCIES[to].perGBP;
}

export function safeNumber(value: unknown): number {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

export function roundMoney(value: number): number {
  return Math.round((safeNumber(value) + Number.EPSILON) * 100) / 100;
}

export function formatCurrency(
  value: number | null | undefined,
  currency: CurrencyCode,
  opts: { compact?: boolean; decimals?: number; signed?: boolean } = {},
): string {
  const n = safeNumber(value);
  const { compact = false, decimals, signed = false } = opts;
  const fmt = new Intl.NumberFormat(CURRENCIES[currency].locale, {
    style: "currency",
    currency,
    notation: compact ? "compact" : "standard",
    minimumFractionDigits: decimals ?? (compact ? 0 : currency === "PKR" ? 0 : 2),
    maximumFractionDigits: decimals ?? (compact ? 1 : currency === "PKR" ? 0 : 2),
  });
  const out = fmt.format(Math.abs(n) < 0.005 ? 0 : n);
  return signed && n > 0 ? `+${out}` : out;
}

export function formatNumber(value: number | null | undefined): string {
  return new Intl.NumberFormat("en-GB").format(safeNumber(value));
}

export function formatPercent(value: number | null | undefined, decimals = 1): string {
  const n = safeNumber(value);
  return `${n.toFixed(decimals)}%`;
}

export function formatDelta(value: number | null, unit: "%" | " pts" = "%"): string {
  if (value === null || !Number.isFinite(value)) return "—";
  if (Math.abs(value) > 999) return `${value > 0 ? ">+" : "<-"}999${unit}`;
  return `${value > 0 ? "+" : ""}${value.toFixed(1)}${unit}`;
}
