"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { ChartSkeleton } from "@/components/common/loading-skeleton";
import { ProfitBadge } from "@/components/common/profit-badge";
import { useAppData } from "@/components/providers/app-data-provider";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency, formatNumber } from "@/lib/currency";

export function MarketplaceComparison() {
  const { analytics, currency } = useAppData();
  const mounted = useMounted();
  const data = analytics.marketplaces.map((m) => ({ name: m.marketplace, Revenue: m.revenue, "Net profit": m.netProfit }));

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Marketplace comparison</CardTitle>
          <CardDescription>Amazon, eBay and everything else</CardDescription>
        </div>
        <div className="flex gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--chart-revenue)" }} />Revenue</span>
          <span className="flex items-center gap-1.5"><span className="size-2.5 rounded-sm" style={{ background: "var(--chart-profit)" }} />Net profit</span>
        </div>
      </CardHeader>
      <div className="grid gap-2 lg:grid-cols-2">
        <div className="px-2 pb-4 sm:px-4" role="img" aria-label="Revenue and net profit by marketplace">
          {!mounted ? <ChartSkeleton height={220} /> : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }} barGap={2}>
                <CartesianGrid vertical={false} />
                <XAxis dataKey="name" tickLine={false} axisLine={false} fontSize={12} />
                <YAxis tickFormatter={(v: number) => formatCurrency(v, currency, { compact: true })} tickLine={false} axisLine={false} width={50} fontSize={11} />
                <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} cursor={{ fill: "var(--muted)", opacity: 0.6 }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Revenue" fill="var(--chart-revenue)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
                <Bar dataKey="Net profit" fill="var(--chart-profit)" radius={[4, 4, 0, 0]} maxBarSize={36} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <Table>
          <THead>
            <TR><TH>Marketplace</TH><TH className="text-right">Revenue</TH><TH className="text-right">Orders</TH><TH className="text-right">Profit</TH><TH className="text-right">Margin</TH></TR>
          </THead>
          <TBody>
            {analytics.marketplaces.map((m) => (
              <TR key={m.marketplace}>
                <TD className="font-medium">{m.marketplace}</TD>
                <TD className="text-right"><CurrencyDisplay value={m.revenue} /></TD>
                <TD className="text-right">{formatNumber(m.orders)}</TD>
                <TD className="text-right"><CurrencyDisplay value={m.netProfit} colored /></TD>
                <TD className="text-right">{m.orders > 0 ? <ProfitBadge value={m.margin} /> : <span className="text-muted-foreground">—</span>}</TD>
              </TR>
            ))}
          </TBody>
        </Table>
      </div>
    </Card>
  );
}
