"use client";

import { useMemo } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { ChartSkeleton } from "@/components/common/loading-skeleton";
import { ProfitBadge } from "@/components/common/profit-badge";
import { useAppData } from "@/components/providers/app-data-provider";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useMounted } from "@/hooks/use-mounted";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/currency";
import { DAY_MS, formatDay, startOfUTCDay } from "@/lib/dates";
import { dailySeries, summarizeOrders } from "@/lib/profit";
import type { Product } from "@/lib/types";

export function ProductDetail({ product, onClose }: { product: Product | null; onClose: () => void }) {
  return (
    <Dialog open={product !== null} onOpenChange={(o) => !o && onClose()}>
      {product && (
        <DialogContent variant="drawer" title={product.name} description={`${product.sku} · ${product.marketplace}`}>
          <Body product={product} />
        </DialogContent>
      )}
    </Dialog>
  );
}

function Body({ product }: { product: Product }) {
  const { analytics, displayOrders, now, currency } = useAppData();
  const mounted = useMounted();

  const s = useMemo(() => summarizeOrders(analytics.orders.filter((o) => o.sku === product.sku)), [analytics.orders, product.sku]);
  const series = useMemo(() => {
    const end = startOfUTCDay(now) + DAY_MS;
    const interval = { start: end - 30 * DAY_MS, end };
    return dailySeries(displayOrders.filter((o) => o.sku === product.sku), interval).map((d) => ({ ts: d.ts, Revenue: d.revenue, "Net profit": d.profit }));
  }, [displayOrders, now, product.sku]);

  const stats: [string, React.ReactNode][] = [
    ["Revenue", <CurrencyDisplay key="r" value={s.revenue} />],
    ["Units sold", formatNumber(s.units)],
    ["Avg selling price", <CurrencyDisplay key="a" value={s.avgSellingPrice} />],
    ["Product costs", <CurrencyDisplay key="c" value={s.productCost} />],
    ["Fees", <CurrencyDisplay key="f" value={s.fees} />],
    ["Shipping", <CurrencyDisplay key="s" value={s.shipping} />],
    ["Ad spend", <CurrencyDisplay key="ad" value={s.adSpend} />],
    ["Refunds", <CurrencyDisplay key="rf" value={s.refunds} />],
  ];

  return (
    <div className="space-y-5">
      <p className="text-xs text-muted-foreground">Figures use the date range selected in the top bar.</p>
      <div className="rounded-xl bg-muted p-4">
        <div className="text-[13px] text-muted-foreground">Net profit</div>
        <div className="mt-1 flex items-baseline gap-3">
          <CurrencyDisplay value={s.netProfit} colored className="text-3xl font-semibold tracking-tight" />
          <ProfitBadge value={s.margin} />
          <span className="text-xs text-muted-foreground">{formatPercent(s.returnRate)} returns</span>
        </div>
      </div>
      <dl className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {stats.map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border-b pb-2">
            <dt className="text-muted-foreground">{label}</dt>
            <dd className="tabular font-medium">{value}</dd>
          </div>
        ))}
      </dl>

      <div>
        <div className="mb-2 flex items-center justify-between">
          <h4 className="text-sm font-semibold">Last 30 days</h4>
          <div className="flex gap-3 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded" style={{ background: "var(--chart-revenue)" }} />Revenue</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-3 rounded" style={{ background: "var(--chart-profit)" }} />Net profit</span>
          </div>
        </div>
        {!mounted ? <ChartSkeleton height={200} /> : (
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis dataKey="ts" tickFormatter={(t: number) => formatDay(t)} tickLine={false} axisLine={false} fontSize={11} minTickGap={24} />
              <YAxis tickFormatter={(v: number) => formatCurrency(v, currency, { compact: true })} tickLine={false} axisLine={false} width={48} fontSize={11} />
              <Tooltip
                formatter={(v) => formatCurrency(Number(v), currency)}
                labelFormatter={(t) => formatDay(Number(t))}
                contentStyle={{ background: "var(--card)", border: "1px solid var(--border)", borderRadius: 8, fontSize: 12 }}
              />
              <Line type="monotone" dataKey="Revenue" stroke="var(--chart-revenue)" strokeWidth={2} dot={false} isAnimationActive={false} />
              <Line type="monotone" dataKey="Net profit" stroke="var(--chart-profit)" strokeWidth={2} dot={false} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
