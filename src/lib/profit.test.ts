import { describe, expect, it } from "vitest";
import { calculateOrderProfit, pctChange, summarizeOrders } from "./profit";
import { generateDemoOrders } from "./demo-data";
import type { Order } from "./types";

const base: Order = {
  id: "1",
  external_order_id: "A1",
  marketplace: "Amazon",
  order_date: "2025-01-10T10:00:00Z",
  sku: "S1",
  product_name: "Thing",
  quantity: 1,
  sale_price: 25,
  product_cost: 8,
  marketplace_fee: 3.75,
  shipping_cost: 2.5,
  ad_cost: 1.5,
  refund_amount: 0,
  currency: "GBP",
};

describe("calculateOrderProfit", () => {
  it("normal profitable order", () => {
    const r = calculateOrderProfit(base);
    expect(r.revenue).toBe(25);
    expect(r.totalCost).toBe(15.75);
    expect(r.profit).toBe(9.25);
    expect(r.margin).toBeCloseTo(37, 5);
  });

  it("loss-making order", () => {
    const r = calculateOrderProfit({ ...base, product_cost: 20, shipping_cost: 6 });
    expect(r.profit).toBe(-6.25);
    expect(r.margin).toBeCloseTo(-25, 5);
  });

  it("refund reduces profit (negative refund treated as magnitude)", () => {
    expect(calculateOrderProfit({ ...base, refund_amount: 25 }).profit).toBe(-15.75);
    expect(calculateOrderProfit({ ...base, refund_amount: -25 }).profit).toBe(-15.75);
  });

  it("multiplies revenue and product cost by quantity only", () => {
    const r = calculateOrderProfit({ ...base, quantity: 3 });
    expect(r.revenue).toBe(75);
    expect(r.productCost).toBe(24);
    expect(r.profit).toBe(75 - 24 - 3.75 - 2.5 - 1.5);
  });

  it("zero revenue gives 0 margin, never NaN", () => {
    const r = calculateOrderProfit({ ...base, sale_price: 0 });
    expect(r.margin).toBe(0);
    expect(Number.isNaN(r.profit)).toBe(false);
  });

  it("missing optional ad cost and other fields", () => {
    const r = calculateOrderProfit({ sale_price: 10, quantity: 1, product_cost: 4 });
    expect(r.profit).toBe(6);
    expect(calculateOrderProfit({}).profit).toBe(0);
    expect(calculateOrderProfit({ sale_price: NaN, quantity: undefined }).revenue).toBe(0);
  });

  it("avoids floating point drift", () => {
    const r = calculateOrderProfit({ sale_price: 0.1, quantity: 3, product_cost: 0.2 });
    expect(r.revenue).toBe(0.3);
    expect(r.profit).toBe(-0.3);
  });
});

describe("summarizeOrders", () => {
  it("aggregates multiple orders", () => {
    const orders = [base, { ...base, id: "2", quantity: 2, refund_amount: 50 }, { ...base, id: "3", ad_cost: 0 }];
    const s = summarizeOrders(orders);
    expect(s.orders).toBe(3);
    expect(s.units).toBe(4);
    expect(s.revenue).toBe(100);
    expect(s.refunds).toBe(50);
    expect(s.refundedOrders).toBe(1);
    expect(s.returnRate).toBeCloseTo(33.333, 2);
    const sum = orders.reduce((a, o) => a + calculateOrderProfit(o).profit, 0);
    expect(s.netProfit).toBeCloseTo(sum, 2);
    expect(s.margin).toBeCloseTo((s.netProfit / 100) * 100, 5);
  });

  it("empty input is all zeros", () => {
    const s = summarizeOrders([]);
    expect(s.netProfit).toBe(0);
    expect(s.margin).toBe(0);
    expect(s.avgProfitPerOrder).toBe(0);
  });
});

describe("pctChange", () => {
  it("handles missing baseline", () => {
    expect(pctChange(10, 0)).toBeNull();
    expect(pctChange(110, 100)).toBeCloseTo(10);
  });
});

describe("demo data", () => {
  it("is consistent and has ~100 orders in the last 30 days", () => {
    const now = Date.parse("2025-06-15T12:00:00Z");
    const orders = generateDemoOrders(now);
    const recent = orders.filter((o) => Date.parse(o.order_date) > now - 30 * 86_400_000);
    expect(recent.length).toBeGreaterThan(80);
    expect(recent.length).toBeLessThan(140);
    for (const o of orders) expect(Number.isFinite(calculateOrderProfit(o).profit)).toBe(true);
  });
});
