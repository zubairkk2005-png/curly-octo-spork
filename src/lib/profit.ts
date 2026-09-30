import { convertAmount, roundMoney, safeNumber } from "./currency";
import { DAY_MS, dayKey, inInterval } from "./dates";
import type { CurrencyCode, DateInterval, Marketplace, Order } from "./types";

/** Fields the engine needs; everything is optional so partial data never yields NaN. */
export type OrderInput = Partial<
  Pick<
    Order,
    | "sale_price"
    | "quantity"
    | "product_cost"
    | "marketplace_fee"
    | "shipping_cost"
    | "ad_cost"
    | "refund_amount"
  >
>;

export interface OrderProfit {
  revenue: number;
  productCost: number;
  marketplaceFee: number;
  shippingCost: number;
  adCost: number;
  refund: number;
  totalCost: number;
  profit: number;
  /** percent, 0 when revenue is 0 */
  margin: number;
}

/**
 * The single source of truth for profit maths.
 * product_cost is per unit; fees, shipping, ads and refunds are order totals.
 * Refunds are treated as a magnitude (a negative refund is the same money leaving).
 */
export function calculateOrderProfit(order: OrderInput): OrderProfit {
  const quantity = Math.max(0, safeNumber(order.quantity));
  const revenue = roundMoney(safeNumber(order.sale_price) * quantity);
  const productCost = roundMoney(safeNumber(order.product_cost) * quantity);
  const marketplaceFee = roundMoney(safeNumber(order.marketplace_fee));
  const shippingCost = roundMoney(safeNumber(order.shipping_cost));
  const adCost = roundMoney(safeNumber(order.ad_cost));
  const refund = roundMoney(Math.abs(safeNumber(order.refund_amount)));
  const totalCost = roundMoney(productCost + marketplaceFee + shippingCost + adCost + refund);
  const profit = roundMoney(revenue - totalCost);
  const margin = revenue > 0 ? (profit / revenue) * 100 : 0;
  return {
    revenue,
    productCost,
    marketplaceFee,
    shippingCost,
    adCost,
    refund,
    totalCost,
    profit,
    margin: Number.isFinite(margin) ? margin : 0,
  };
}

export interface Summary {
  revenue: number;
  orders: number;
  units: number;
  productCost: number;
  fees: number;
  shipping: number;
  adSpend: number;
  refunds: number;
  refundedOrders: number;
  /** percent of orders with a refund */
  returnRate: number;
  totalCost: number;
  netProfit: number;
  margin: number;
  avgProfitPerOrder: number;
  avgSellingPrice: number;
}

export function summarizeOrders(orders: readonly Order[]): Summary {
  let revenue = 0, productCost = 0, fees = 0, shipping = 0, adSpend = 0, refunds = 0;
  let units = 0, refundedOrders = 0;
  for (const o of orders) {
    const p = calculateOrderProfit(o);
    revenue += p.revenue;
    productCost += p.productCost;
    fees += p.marketplaceFee;
    shipping += p.shippingCost;
    adSpend += p.adCost;
    refunds += p.refund;
    units += Math.max(0, safeNumber(o.quantity));
    if (p.refund > 0) refundedOrders += 1;
  }
  revenue = roundMoney(revenue);
  productCost = roundMoney(productCost);
  fees = roundMoney(fees);
  shipping = roundMoney(shipping);
  adSpend = roundMoney(adSpend);
  refunds = roundMoney(refunds);
  const totalCost = roundMoney(productCost + fees + shipping + adSpend + refunds);
  const netProfit = roundMoney(revenue - totalCost);
  const count = orders.length;
  return {
    revenue,
    orders: count,
    units,
    productCost,
    fees,
    shipping,
    adSpend,
    refunds,
    refundedOrders,
    returnRate: count > 0 ? (refundedOrders / count) * 100 : 0,
    totalCost,
    netProfit,
    margin: revenue > 0 ? (netProfit / revenue) * 100 : 0,
    avgProfitPerOrder: count > 0 ? roundMoney(netProfit / count) : 0,
    avgSellingPrice: units > 0 ? roundMoney(revenue / units) : 0,
  };
}

/** Percent change vs a previous value; null when there is no baseline. */
export function pctChange(current: number, previous: number): number | null {
  if (!Number.isFinite(current) || !Number.isFinite(previous) || previous === 0) return null;
  return ((current - previous) / Math.abs(previous)) * 100;
}

/** Convert every money field of an order to `to`. Quantity is untouched. */
export function convertOrder(order: Order, to: CurrencyCode): Order {
  if (order.currency === to) return order;
  const c = (v: number) => convertAmount(v, order.currency, to);
  return {
    ...order,
    sale_price: c(order.sale_price),
    product_cost: c(order.product_cost),
    marketplace_fee: c(order.marketplace_fee),
    shipping_cost: c(order.shipping_cost),
    ad_cost: c(order.ad_cost),
    refund_amount: c(order.refund_amount),
    currency: to,
  };
}

export function orderTime(o: Pick<Order, "order_date">): number {
  const t = Date.parse(o.order_date);
  return Number.isFinite(t) ? t : 0;
}

export function filterByInterval(orders: readonly Order[], interval: DateInterval): Order[] {
  return orders.filter((o) => inInterval(orderTime(o), interval));
}

export interface DailyPoint {
  date: string;
  ts: number;
  revenue: number;
  profit: number;
  orders: number;
  margin: number;
  adSpend: number;
  refunds: number;
  returnRate: number;
}

/** One point per day of `interval`, zero-filled. */
export function dailySeries(orders: readonly Order[], interval: DateInterval): DailyPoint[] {
  const buckets = new Map<string, Order[]>();
  for (const o of orders) {
    const k = dayKey(orderTime(o));
    const list = buckets.get(k);
    if (list) list.push(o);
    else buckets.set(k, [o]);
  }
  const points: DailyPoint[] = [];
  for (let t = interval.start; t < interval.end; t += DAY_MS) {
    const s = summarizeOrders(buckets.get(dayKey(t)) ?? []);
    points.push({
      date: dayKey(t),
      ts: t,
      revenue: s.revenue,
      profit: s.netProfit,
      orders: s.orders,
      margin: s.margin,
      adSpend: s.adSpend,
      refunds: s.refunds,
      returnRate: s.returnRate,
    });
  }
  return points;
}

export interface ProductStats extends Summary {
  sku: string;
  name: string;
  marketplaces: Marketplace[];
}

export function statsBySku(orders: readonly Order[]): ProductStats[] {
  const groups = new Map<string, Order[]>();
  for (const o of orders) {
    const list = groups.get(o.sku);
    if (list) list.push(o);
    else groups.set(o.sku, [o]);
  }
  return [...groups.entries()].map(([sku, list]) => ({
    ...summarizeOrders(list),
    sku,
    name: list[list.length - 1]?.product_name || sku,
    marketplaces: [...new Set(list.map((o) => o.marketplace))],
  }));
}

export interface MarketplaceStats extends Summary {
  marketplace: Marketplace;
}

export function statsByMarketplace(orders: readonly Order[]): MarketplaceStats[] {
  const names: Marketplace[] = ["Amazon", "eBay", "Other"];
  return names.map((marketplace) => ({
    ...summarizeOrders(orders.filter((o) => o.marketplace === marketplace)),
    marketplace,
  }));
}
