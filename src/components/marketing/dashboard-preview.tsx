import { computeAnalytics } from "@/lib/analytics";
import { formatCurrency, formatDelta, formatNumber, formatPercent } from "@/lib/currency";
import { generateDemoOrders } from "@/lib/demo-data";

/** A static preview rendered from the same demo data + engine as the real dashboard. */
export function DashboardPreview({ now }: { now: number }) {
  const a = computeAnalytics(generateDemoOrders(now), { range: "30d", custom: null, currency: "GBP", now });
  const s = a.summary;
  const kpis = [
    { label: "Revenue", value: formatCurrency(s.revenue, "GBP", { decimals: 0 }), delta: a.deltas.revenue },
    { label: "Net profit", value: formatCurrency(s.netProfit, "GBP", { decimals: 0 }), delta: a.deltas.netProfit },
    { label: "Margin", value: formatPercent(s.margin), delta: null },
    { label: "Orders", value: formatNumber(s.orders), delta: a.deltas.orders },
  ];

  const pts = a.daily.map((d) => d.profit);
  const max = Math.max(...pts, 1);
  const min = Math.min(...pts, 0);
  const w = 600, h = 140;
  const x = (i: number) => (i / Math.max(1, pts.length - 1)) * w;
  const y = (v: number) => h - 8 - ((v - min) / (max - min || 1)) * (h - 16);
  const line = pts.map((v, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const top = [...a.products].sort((p, q) => q.netProfit - p.netProfit).slice(0, 3);

  return (
    <div className="rounded-2xl border bg-card p-3 shadow-[0_24px_60px_-24px_rgba(0,0,0,0.25)] sm:p-4" aria-label="Dashboard preview built from sample data">
      <div className="mb-3 flex items-center gap-1.5 px-1"><span className="size-2.5 rounded-full bg-border" /><span className="size-2.5 rounded-full bg-border" /><span className="size-2.5 rounded-full bg-border" /><span className="ml-3 text-xs text-muted-foreground">Demo Store · Last 30 days</span></div>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {kpis.map((k) => (
          <div key={k.label} className="rounded-xl border p-3.5">
            <div className="text-xs text-muted-foreground">{k.label}</div>
            <div className="mt-1.5 text-xl font-semibold tracking-tight tabular">{k.value}</div>
            <div className={`mt-1 text-xs tabular ${k.delta === null ? "text-muted-foreground" : k.delta >= 0 ? "text-positive" : "text-negative"}`}>{k.delta === null ? " " : `${formatDelta(k.delta)} vs previous`}</div>
          </div>
        ))}
      </div>
      <div className="mt-2.5 grid gap-2.5 lg:grid-cols-5">
        <div className="rounded-xl border p-3.5 lg:col-span-3">
          <div className="text-[13px] font-medium">Net profit per day</div>
          <svg viewBox={`0 0 ${w} ${h}`} className="mt-2 h-32 w-full" preserveAspectRatio="none" role="img" aria-label="Net profit per day">
            <path d={`${line} L${w},${h} L0,${h} Z`} fill="var(--chart-profit)" opacity="0.12" />
            <path d={line} fill="none" stroke="var(--chart-profit)" strokeWidth="2" vectorEffect="non-scaling-stroke" />
          </svg>
        </div>
        <div className="rounded-xl border p-3.5 lg:col-span-2">
          <div className="text-[13px] font-medium">Top products</div>
          <ul className="mt-2 divide-y text-[13px]">
            {top.map((p) => (
              <li key={p.sku} className="flex items-center justify-between gap-3 py-2"><span className="truncate">{p.name}</span><span className="tabular font-medium text-positive">{formatCurrency(p.netProfit, "GBP", { decimals: 0 })}</span></li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
