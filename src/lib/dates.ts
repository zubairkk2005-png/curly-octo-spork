import type { CustomRange, DateInterval, DateRangePreset } from "./types";

export const DAY_MS = 86_400_000;

export function startOfUTCDay(d: Date | number): number {
  const date = new Date(d);
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function dayKey(ms: number): string {
  return new Date(ms).toISOString().slice(0, 10);
}

export const RANGE_LABELS: Record<DateRangePreset, string> = {
  today: "Today",
  "7d": "Last 7 days",
  "30d": "Last 30 days",
  "90d": "Last 90 days",
  custom: "Custom",
};

const PRESET_DAYS: Record<Exclude<DateRangePreset, "custom">, number> = {
  today: 1,
  "7d": 7,
  "30d": 30,
  "90d": 90,
};

function parseDay(s: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const t = Date.parse(`${s}T00:00:00Z`);
  return Number.isFinite(t) ? t : null;
}

/** Resolve a preset into a half-open UTC interval ending at the end of `now`'s day. */
export function resolveInterval(
  preset: DateRangePreset,
  custom: CustomRange | null,
  now: number,
): DateInterval {
  const todayStart = startOfUTCDay(now);
  if (preset === "custom" && custom) {
    const from = parseDay(custom.from);
    const to = parseDay(custom.to);
    if (from !== null && to !== null && to >= from) {
      return { start: from, end: to + DAY_MS };
    }
  }
  const days = preset === "custom" ? 30 : PRESET_DAYS[preset];
  return { start: todayStart + DAY_MS - days * DAY_MS, end: todayStart + DAY_MS };
}

/** The equally long interval immediately before `interval`. */
export function previousInterval(interval: DateInterval): DateInterval {
  const len = interval.end - interval.start;
  return { start: interval.start - len, end: interval.start };
}

export function intervalDays(interval: DateInterval): number {
  return Math.max(1, Math.round((interval.end - interval.start) / DAY_MS));
}

export function inInterval(ms: number, interval: DateInterval): boolean {
  return ms >= interval.start && ms < interval.end;
}

export function formatDay(ms: number): string {
  return new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

export function formatDateTime(iso: string): string {
  const t = Date.parse(iso);
  if (!Number.isFinite(t)) return "—";
  return new Date(t).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

/** Wall-clock time; isolated so render code stays lint-clean. */
export function currentTime(): number {
  return Date.now();
}
