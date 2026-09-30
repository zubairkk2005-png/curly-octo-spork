import type { Analytics } from "@/lib/analytics";
import { roundMoney } from "@/lib/currency";
import { DAY_MS, dayKey } from "@/lib/dates";
import type { Summary } from "@/lib/profit";

const r2 = (n: number) => Math.round((Number.isFinite(n) ? n : 0) * 100) / 100;

function pack(s: Summary) {
  return {
    revenue: r2(s.revenue),
    orders: s.orders,
    unitsSold: s.units,
    netProfit: r2(s.netProfit),
    marginPercent: r2(s.margin),
    productCosts: r2(s.productCost),
    marketplaceFees: r2(s.fees),
    shipping: r2(s.shipping),
    adSpend: r2(s.adSpend),
    refunds: r2(s.refunds),
    returnRatePercent: r2(s.returnRate),
    averageProfitPerOrder: r2(s.avgProfitPerOrder),
    averageSellingPrice: r2(s.avgSellingPrice),
  };
}

const pct = (v: number | null) => (v === null ? null : r2(v));

/** The only business data the AI ever sees: compact aggregates, no raw orders. */
export function buildAiContext(a: Analytics, storeIsDemo: boolean) {
  const prevBySku = new Map(a.previousProducts.map((p) => [p.sku, p]));
  const topProducts = [...a.products]
    .sort((x, y) => y.netProfit - x.netProfit)
    .slice(0, 10)
    .map((p) => {
      const prev = prevBySku.get(p.sku);
      return {
        name: p.name,
        sku: p.sku,
        unitsSold: p.units,
        revenue: r2(p.revenue),
        netProfit: r2(p.netProfit),
        marginPercent: r2(p.margin),
        adSpend: r2(p.adSpend),
        refunds: r2(p.refunds),
        returnRatePercent: r2(p.returnRate),
        previousPeriodNetProfit: prev ? r2(prev.netProfit) : null,
        netProfitChange: prev ? r2(p.netProfit - prev.netProfit) : null,
      };
    });

  // weekly buckets keep the trend small
  const weeks = new Map<string, { revenue: number; netProfit: number; orders: number }>();
  for (const d of a.daily) {
    const weekIndex = Math.floor((d.ts - a.interval.start) / (7 * DAY_MS));
    const key = dayKey(a.interval.start + weekIndex * 7 * DAY_MS);
    const w = weeks.get(key) ?? { revenue: 0, netProfit: 0, orders: 0 };
    w.revenue += d.revenue;
    w.netProfit += d.profit;
    w.orders += d.orders;
    weeks.set(key, w);
  }

  return {
    currency: a.currency,
    usingDemoData: storeIsDemo,
    period: {
      from: dayKey(a.interval.start),
      to: dayKey(a.interval.end - DAY_MS),
      previousFrom: dayKey(a.previous.start),
      previousTo: dayKey(a.previous.end - DAY_MS),
    },
    current: pack(a.summary),
    previousPeriod: pack(a.previousSummary),
    changeVsPreviousPercent: {
      revenue: pct(a.deltas.revenue),
      orders: pct(a.deltas.orders),
      netProfit: pct(a.deltas.netProfit),
      adSpend: pct(a.deltas.adSpend),
      refunds: pct(a.deltas.refunds),
      marginPercentagePoints: pct(a.deltas.margin),
    },
    topProducts,
    marketplaces: a.marketplaces
      .filter((m) => m.orders > 0)
      .map((m) => ({
        marketplace: m.marketplace,
        revenue: r2(m.revenue),
        orders: m.orders,
        netProfit: r2(m.netProfit),
        marginPercent: r2(m.margin),
      })),
    weeklyTrend: [...weeks.entries()].map(([weekStarting, w]) => ({
      weekStarting,
      revenue: roundMoney(w.revenue),
      netProfit: roundMoney(w.netProfit),
      orders: w.orders,
    })),
  };
}

export type AiContext = ReturnType<typeof buildAiContext>;
