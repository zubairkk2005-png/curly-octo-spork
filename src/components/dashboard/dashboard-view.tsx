"use client";

import { Upload } from "lucide-react";
import Link from "next/link";
import { AIInsightCard } from "@/components/ai/ai-insight-card";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { EmptyState } from "@/components/common/empty-state";
import { PageSkeleton } from "@/components/common/loading-skeleton";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatNumber, formatPercent } from "@/lib/currency";
import { OutOfRangeNotice } from "./out-of-range-notice";
import { MetricCard } from "./metric-card";
import { ProductTable } from "./product-table";
import { ProfitBreakdown } from "./profit-breakdown";
import { ProfitChart } from "./profit-chart";

export function DashboardView() {
  const { ready, analytics: a, orders } = useAppData();

  if (!ready) return <PageSkeleton />;
  if (orders.length === 0) {
    return (
      <EmptyState
        icon={Upload}
        title="No data yet"
        description="Import your order CSV to see revenue, costs and real profit."
        action={<Button asChild><Link href="/import">Import data</Link></Button>}
      />
    );
  }
  const s = a.summary;

  return (
    <div className="space-y-6 pp-fade-in">
      <OutOfRangeNotice />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-3 xl:grid-cols-6">
        <MetricCard label="Revenue" value={<CurrencyDisplay value={s.revenue} />} delta={a.deltas.revenue} />
        <MetricCard label="Orders" value={formatNumber(s.orders)} delta={a.deltas.orders} />
        <MetricCard label="Net profit" value={<CurrencyDisplay value={s.netProfit} colored />} delta={a.deltas.netProfit} />
        <MetricCard label="Profit margin" value={formatPercent(s.margin)} delta={a.deltas.margin} unit=" pts" hint="vs prior period" />
        <MetricCard label="Returns" value={<CurrencyDisplay value={s.refunds} />} delta={a.deltas.refunds} invertDelta hint={`${formatPercent(s.returnRate)} of orders`} />
        <MetricCard label="Ad spend" value={<CurrencyDisplay value={s.adSpend} />} delta={a.deltas.adSpend} invertDelta />
      </div>

      <AIInsightCard />

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="xl:col-span-2"><ProfitChart /></div>
        <ProfitBreakdown />
      </div>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>Top products</CardTitle>
            <CardDescription>Ranked by net profit for the selected period</CardDescription>
          </div>
          <Button asChild variant="outline" size="sm"><Link href="/products">All products</Link></Button>
        </CardHeader>
        {a.products.length > 0 ? <ProductTable products={a.products} limit={8} /> : <p className="px-5 pb-5 text-sm text-muted-foreground">No sales in this period.</p>}
      </Card>
    </div>
  );
}
