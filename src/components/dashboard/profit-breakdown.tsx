"use client";

import { useAppData } from "@/components/providers/app-data-provider";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { formatPercent } from "@/lib/currency";
import type { Summary } from "@/lib/profit";

interface Row {
  key: string;
  label: string;
  value: number;
  color: string;
}

export function ProfitBreakdown({ summary }: { summary?: Summary }) {
  const app = useAppData();
  const s = summary ?? app.analytics.summary;
  const revenue = s.revenue;
  const pct = (v: number) => (revenue > 0 ? (Math.max(0, v) / revenue) * 100 : 0);

  const costs: Row[] = [
    { key: "product", label: "Product costs", value: s.productCost, color: "var(--chart-cost)" },
    { key: "fees", label: "Marketplace fees", value: s.fees, color: "var(--chart-fees)" },
    { key: "shipping", label: "Shipping", value: s.shipping, color: "var(--chart-shipping)" },
    { key: "ads", label: "Advertising", value: s.adSpend, color: "var(--chart-ads)" },
    { key: "refunds", label: "Refunds", value: s.refunds, color: "var(--chart-refunds)" },
  ];
  const segments = [...costs, { key: "profit", label: "Net profit", value: Math.max(0, s.netProfit), color: "var(--chart-profit)" }];
  const totalSegments = segments.reduce((a, r) => a + r.value, 0) || 1;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Where your revenue goes</CardTitle>
          <CardDescription>Every pound of revenue, split into costs and profit</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex h-3 w-full overflow-hidden rounded-full bg-muted" role="img" aria-label="Revenue split into costs and net profit">
          {segments.map((seg) => (
            <div key={seg.key} style={{ width: `${(seg.value / totalSegments) * 100}%`, background: seg.color, marginRight: 2 }} className="h-full first:rounded-l-full last:mr-0 last:rounded-r-full" title={seg.label} />
          ))}
        </div>

        <dl className="mt-5 divide-y text-sm">
          <div className="flex items-center justify-between py-2.5">
            <dt className="font-medium">Revenue</dt>
            <dd className="flex items-center gap-4"><span className="w-14 text-right text-xs text-muted-foreground tabular">100%</span><CurrencyDisplay value={revenue} className="w-28 text-right font-medium" /></dd>
          </div>
          {costs.map((r) => (
            <div key={r.key} className="flex items-center justify-between py-2.5">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-sm" style={{ background: r.color }} aria-hidden />
                {r.label}
              </dt>
              <dd className="flex items-center gap-4">
                <span className="w-14 text-right text-xs text-muted-foreground tabular">{formatPercent(pct(r.value))}</span>
                <span className="w-28 text-right tabular text-muted-foreground">−<CurrencyDisplay value={r.value} /></span>
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between py-2.5">
            <dt className="flex items-center gap-2 font-semibold">
              <span className="size-2.5 rounded-sm" style={{ background: "var(--chart-profit)" }} aria-hidden />
              Net profit
            </dt>
            <dd className="flex items-center gap-4">
              <span className="w-14 text-right text-xs tabular text-muted-foreground">{formatPercent(s.margin)}</span>
              <CurrencyDisplay value={s.netProfit} colored className="w-28 text-right font-semibold" />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
