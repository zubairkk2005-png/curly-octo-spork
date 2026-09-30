"use client";

import { Area, AreaChart, Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ChartSkeleton } from "@/components/common/loading-skeleton";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/currency";
import { formatDay } from "@/lib/dates";
import type { DailyPoint } from "@/lib/profit";

type Format = "money" | "number" | "percent";

export function TrendChart({
  title,
  description,
  dataKey,
  format,
  color,
  variant = "area",
  data,
}: {
  title: string;
  description?: string;
  dataKey: keyof Pick<DailyPoint, "revenue" | "profit" | "margin" | "orders" | "adSpend" | "returnRate">;
  format: Format;
  color: string;
  variant?: "area" | "bar";
  data?: DailyPoint[];
}) {
  const { analytics, currency } = useAppData();
  const mounted = useMounted();
  const series = data ?? analytics.daily;

  const fmt = (v: number, compact = false) =>
    format === "money" ? formatCurrency(v, currency, { compact }) : format === "percent" ? formatPercent(v, 0) : formatNumber(v);
  const fmtFull = (v: number) => (format === "percent" ? formatPercent(v) : fmt(v));

  const common = {
    data: series,
    margin: { top: 8, right: 8, left: 0, bottom: 0 },
  };
  const axes = (
    <>
      <CartesianGrid vertical={false} />
      <XAxis dataKey="ts" tickFormatter={(t: number) => formatDay(t)} tickLine={false} axisLine={false} minTickGap={32} fontSize={11} />
      <YAxis tickFormatter={(v: number) => fmt(v, true)} tickLine={false} axisLine={false} width={50} fontSize={11} />
      <Tooltip
        cursor={variant === "bar" ? { fill: "var(--muted)", opacity: 0.6 } : { stroke: "var(--muted-foreground)", strokeDasharray: "3 3" }}
        content={({ active, payload }) => {
          if (!active || !payload?.length) return null;
          const row = payload[0].payload as DailyPoint;
          return (
            <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-md">
              <div className="font-medium">{formatDay(row.ts)}</div>
              <div className="mt-1 flex items-center gap-2"><span className="size-2 rounded-full" style={{ background: color }} />{title}: <b className="tabular">{fmtFull(row[dataKey])}</b></div>
            </div>
          );
        }}
      />
    </>
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
      </CardHeader>
      <div className="px-2 pb-4 sm:px-4" role="img" aria-label={`${title} by day`}>
        {!mounted ? <ChartSkeleton height={220} /> : (
          <ResponsiveContainer width="100%" height={220}>
            {variant === "bar" ? (
              <BarChart {...common}>
                {axes}
                <Bar dataKey={dataKey} fill={color} radius={[3, 3, 0, 0]} maxBarSize={14} isAnimationActive={false} />
              </BarChart>
            ) : (
              <AreaChart {...common}>
                <defs>
                  <linearGradient id={`g-${dataKey}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.2} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                {axes}
                <Area type="monotone" dataKey={dataKey} stroke={color} strokeWidth={2} fill={`url(#g-${dataKey})`} dot={false} activeDot={{ r: 4, stroke: "var(--card)", strokeWidth: 2 }} isAnimationActive={false} />
              </AreaChart>
            )}
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
