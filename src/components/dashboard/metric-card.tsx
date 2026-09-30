import type { ReactNode } from "react";
import { ProfitBadge } from "@/components/common/profit-badge";
import { Card } from "@/components/ui/card";

export function MetricCard({
  label,
  value,
  delta,
  invertDelta,
  hint,
  unit,
}: {
  label: string;
  value: ReactNode;
  /** percent change (or percentage points when deltaKind is "points") vs previous period */
  delta: number | null;
  invertDelta?: boolean;
  hint?: string;
  unit?: "%" | " pts";
}) {
  return (
    <Card className="p-4">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className="mt-2 text-2xl font-semibold tracking-tight tabular">{value}</div>
      <div className="mt-2.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        <ProfitBadge kind="delta" value={delta} invert={invertDelta} unit={unit} />
        <span>{hint ?? "vs prior period"}</span>
      </div>
    </Card>
  );
}
