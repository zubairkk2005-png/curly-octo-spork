"use client";

import { CalendarRange } from "lucide-react";
import { useMemo } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { dayKey } from "@/lib/dates";
import { orderTime } from "@/lib/profit";

/** Shown when the workspace has orders but none fall inside the selected range. */
export function OutOfRangeNotice() {
  const { orders, analytics, setRange } = useAppData();
  const span = useMemo(() => {
    const times = orders.map(orderTime).filter((t) => t > 0);
    return times.length ? { from: dayKey(Math.min(...times)), to: dayKey(Math.max(...times)) } : null;
  }, [orders]);

  if (!span || analytics.summary.orders > 0) return null;
  return (
    <div role="status" className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-warning-bg/60 px-4 py-3 text-sm">
      <span className="flex items-center gap-2"><CalendarRange className="size-4" aria-hidden />No orders in the selected period. Your data spans {span.from} to {span.to}.</span>
      <Button size="sm" variant="outline" onClick={() => setRange("custom", span)}>Show my data</Button>
    </div>
  );
}
