"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { EmptyState } from "@/components/common/empty-state";
import { ChartSkeleton, PageSkeleton } from "@/components/common/loading-skeleton";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency } from "@/lib/currency";
import { OutOfRangeNotice } from "./out-of-range-notice";
import { MarketplaceComparison } from "./marketplace-comparison";
import { ProductTable } from "./product-table";
import { TrendChart } from "./trend-chart";

export function AnalyticsView() {
  const { ready, analytics: a, orders, currency } = useAppData();
  const mounted = useMounted();
  if (!ready) return <PageSkeleton />;
  if (orders.length === 0) {
    return <EmptyState icon={Upload} title="No data yet" description="Import your orders to unlock trends and comparisons." action={<Button asChild><Link href="/import">Import data</Link></Button>} />;
  }

  const byProfit = [...a.products].sort((x, y) => y.netProfit - x.netProfit).map((p) => ({ name: p.name, "Net profit": p.netProfit }));

  return (
    <div className="space-y-6 pp-fade-in">
      <OutOfRangeNotice />
      <div className="grid gap-6 lg:grid-cols-2">
        <TrendChart title="Revenue trend" description="Daily revenue" dataKey="revenue" format="money" color="var(--chart-revenue)" />
        <TrendChart title="Profit trend" description="Daily net profit" dataKey="profit" format="money" color="var(--chart-profit)" />
        <TrendChart title="Profit margin trend" description="Daily net margin" dataKey="margin" format="percent" color="var(--chart-profit)" />
        <TrendChart title="Orders trend" description="Orders per day" dataKey="orders" format="number" color="var(--chart-orders)" variant="bar" />
        <TrendChart title="Advertising spend" description="Daily ad spend" dataKey="adSpend" format="money" color="var(--chart-ads)" variant="bar" />
        <TrendChart title="Return rate" description="Share of orders refunded each day" dataKey="returnRate" format="percent" color="var(--chart-refunds)" variant="bar" />
      </div>

      <MarketplaceComparison />

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Product profitability</CardTitle>
            <CardDescription>Net profit by product for the selected period</CardDescription>
          </div>
        </CardHeader>
        <div className="px-2 pb-4 sm:px-4" role="img" aria-label="Net profit by product">
          {!mounted ? <ChartSkeleton height={240} /> : (
            <ResponsiveContainer width="100%" height={Math.max(160, byProfit.length * 44 + 30)}>
              <BarChart data={byProfit} layout="vertical" margin={{ top: 4, right: 16, left: 8, bottom: 0 }}>
                <CartesianGrid horizontal={false} />
                <XAxis type="number" tickFormatter={(v: number) => formatCurrency(v, currency, { compact: true })} tickLine={false} axisLine={false} fontSize={11} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={150} fontSize={12} />
                <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} cursor={{ fill: "var(--muted)", opacity: 0.6 }} contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }} />
                <Bar dataKey="Net profit" fill="var(--chart-profit)" radius={[0, 4, 4, 0]} maxBarSize={22} isAnimationActive={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <ProductTable products={a.products} />
      </Card>
    </div>
  );
}
