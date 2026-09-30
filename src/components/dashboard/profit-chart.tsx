"use client";

import { useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { useAppData } from "@/components/providers/app-data-provider";
import { ChartSkeleton } from "@/components/common/loading-skeleton";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency, formatNumber } from "@/lib/currency";
import { formatDay } from "@/lib/dates";
import { dailySeries } from "@/lib/profit";
import type { CurrencyCode } from "@/lib/types";

type Metric = "revenue" | "profit" | "orders";

const METRICS: Record<Metric, { label: string; color: string; money: boolean }> = {
  revenue: { label: "Revenue", color: "var(--chart-revenue)", money: true },
  profit: { label: "Net profit", color: "var(--chart-profit)", money: true },
  orders: { label: "Orders", color: "var(--chart-orders)", money: false },
};

function fmt(metric: Metric, v: number, currency: CurrencyCode, compact = false) {
  return METRICS[metric].money ? formatCurrency(v, currency, { compact }) : formatNumber(v);
}

export function ProfitChart() {
  const { analytics, currency } = useAppData();
  const [metric, setMetric] = useState<Metric>("profit");
  const mounted = useMounted();
  const { color, label } = METRICS[metric];

  const data = useMemo(() => {
    const prev = dailySeries(analytics.previousOrders, analytics.previous);
    return analytics.daily.map((d, i) => ({
      ts: d.ts,
      current: d[metric],
      previous: prev[i]?.[metric] ?? 0,
    }));
  }, [analytics, metric]);

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{label} over time</CardTitle>
          <CardDescription>Daily, compared with the previous period (dashed)</CardDescription>
        </div>
        <Segmented
          label="Chart metric"
          value={metric}
          onChange={setMetric}
          options={[
            { value: "revenue", label: "Revenue" },
            { value: "profit", label: "Net profit" },
            { value: "orders", label: "Orders" },
          ]}
        />
      </CardHeader>
      <div className="px-2 pb-4 sm:px-4" role="img" aria-label={`${label} by day`}>
        {!mounted ? (
          <ChartSkeleton height={300} />
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id={`fill-${metric}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={color} stopOpacity={0.22} />
                  <stop offset="100%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="ts" tickFormatter={(t: number) => formatDay(t)} tickLine={false} axisLine={false} minTickGap={28} fontSize={12} />
              <YAxis tickFormatter={(v: number) => fmt(metric, v, currency, true)} tickLine={false} axisLine={false} width={56} fontSize={12} />
              <Tooltip
                cursor={{ stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const row = payload[0].payload as (typeof data)[number];
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
                      <div className="mb-1 font-medium">{formatDay(row.ts)}</div>
                      <div className="flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: color }} />{label}: <b className="tabular">{fmt(metric, row.current, currency)}</b></div>
                      <div className="mt-0.5 flex items-center gap-2 text-muted-foreground"><span className="size-2 rounded-full bg-muted-foreground/50" />Previous: <span className="tabular">{fmt(metric, row.previous, currency)}</span></div>
                    </div>
                  );
                }}
              />
              <Area type="monotone" dataKey="previous" stroke="var(--muted-foreground)" strokeOpacity={0.6} strokeDasharray="4 4" strokeWidth={1.5} fill="none" dot={false} activeDot={false} isAnimationActive={false} />
              <Area type="monotone" dataKey="current" stroke={color} strokeWidth={2} fill={`url(#fill-${metric})`} dot={false} activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }} isAnimationActive={false} />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
