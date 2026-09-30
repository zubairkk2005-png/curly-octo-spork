import {
  dailySeries,
  convertOrder,
  filterByInterval,
  pctChange,
  statsByMarketplace,
  statsBySku,
  summarizeOrders,
  type DailyPoint,
  type MarketplaceStats,
  type ProductStats,
  type Summary,
} from "./profit";
import { previousInterval, resolveInterval } from "./dates";
import type { CurrencyCode, CustomRange, DateInterval, DateRangePreset, Order } from "./types";

export interface Analytics {
  currency: CurrencyCode;
  interval: DateInterval;
  previous: DateInterval;
  /** orders in the current period, converted to the display currency */
  orders: Order[];
  previousOrders: Order[];
  summary: Summary;
  previousSummary: Summary;
  daily: DailyPoint[];
  products: ProductStats[];
  previousProducts: ProductStats[];
  marketplaces: MarketplaceStats[];
  deltas: {
    revenue: number | null;
    orders: number | null;
    netProfit: number | null;
    margin: number | null;
    refunds: number | null;
    adSpend: number | null;
  };
}

export function computeAnalytics(
  allOrders: readonly Order[],
  opts: { range: DateRangePreset; custom: CustomRange | null; currency: CurrencyCode; now: number },
): Analytics {
  const interval = resolveInterval(opts.range, opts.custom, opts.now);
  const previous = previousInterval(interval);
  const converted = allOrders.map((o) => convertOrder(o, opts.currency));
  const orders = filterByInterval(converted, interval);
  const previousOrders = filterByInterval(converted, previous);
  const summary = summarizeOrders(orders);
  const previousSummary = summarizeOrders(previousOrders);
  return {
    currency: opts.currency,
    interval,
    previous,
    orders,
    previousOrders,
    summary,
    previousSummary,
    daily: dailySeries(orders, interval),
    products: statsBySku(orders),
    previousProducts: statsBySku(previousOrders),
    marketplaces: statsByMarketplace(orders),
    deltas: {
      revenue: pctChange(summary.revenue, previousSummary.revenue),
      orders: pctChange(summary.orders, previousSummary.orders),
      netProfit: pctChange(summary.netProfit, previousSummary.netProfit),
      // margin change is in percentage points
      margin: previousSummary.revenue > 0 ? summary.margin - previousSummary.margin : null,
      refunds: pctChange(summary.refunds, previousSummary.refunds),
      adSpend: pctChange(summary.adSpend, previousSummary.adSpend),
    },
  };
}
