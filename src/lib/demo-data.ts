import { roundMoney } from "./currency";
import { DAY_MS, startOfUTCDay } from "./dates";
import type { Marketplace, Order, Product } from "./types";

interface DemoProduct {
  sku: string;
  name: string;
  price: number;
  cost: number;
  shipping: number;
  /** relative popularity */
  weight: number;
  /** probability an order is refunded */
  refundRate: number;
  /** multiplier on ad spend intensity */
  adIntensity: number;
}

const DEMO_PRODUCTS: DemoProduct[] = [
  { sku: "PP-WR-001", name: "No-Drill Wardrobe Rail", price: 24.99, cost: 7.2, shipping: 2.85, weight: 30, refundRate: 0.027, adIntensity: 1 },
  { sku: "PP-DF-002", name: "Telescopic Desk Fan", price: 19.99, cost: 6.4, shipping: 2.4, weight: 24, refundRate: 0.04, adIntensity: 1.1 },
  { sku: "PP-SS-003", name: "Electric Spin Scrubber", price: 39.99, cost: 14.5, shipping: 3.9, weight: 18, refundRate: 0.065, adIntensity: 1.3 },
  { sku: "PP-TG-004", name: "Kitchen Teppanyaki Grill", price: 54.99, cost: 22.8, shipping: 6.5, weight: 10, refundRate: 0.035, adIntensity: 1.6 },
  { sku: "PP-WL-005", name: "Retractable Washing Line", price: 16.99, cost: 4.6, shipping: 2.3, weight: 18, refundRate: 0.02, adIntensity: 0.8 },
];

/** Deterministic PRNG so server and client render the same demo store. */
function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function pickWeighted<T extends { weight: number }>(items: T[], r: number): T {
  const total = items.reduce((s, i) => s + i.weight, 0);
  let acc = r * total;
  for (const item of items) {
    acc -= item.weight;
    if (acc <= 0) return item;
  }
  return items[items.length - 1];
}

const HISTORY_DAYS = 180;

/** ~100 orders in the last 30 days, plus earlier history so period comparisons work. */
export function generateDemoOrders(now: number = Date.now()): Order[] {
  const rand = mulberry32(20240517);
  const today = startOfUTCDay(now);
  const orders: Order[] = [];
  let seq = 0;

  for (let d = HISTORY_DAYS - 1; d >= 0; d--) {
    const dayStart = today - d * DAY_MS;
    const dow = new Date(dayStart).getUTCDay();
    const weekend = dow === 0 || dow === 6 ? 0.85 : 1;
    // gentle growth over time
    const growth = 0.75 + 0.5 * ((HISTORY_DAYS - d) / HISTORY_DAYS);
    const expected = 3.3 * weekend * growth;
    let count = Math.floor(expected);
    if (rand() < expected - count) count += 1;

    for (let i = 0; i < count; i++) {
      const p = pickWeighted(DEMO_PRODUCTS, rand());
      const mr = rand();
      const marketplace: Marketplace = mr < 0.6 ? "Amazon" : mr < 0.92 ? "eBay" : "Other";
      const qr = rand();
      const quantity = qr < 0.85 ? 1 : qr < 0.97 ? 2 : 3;
      const promo = rand() < 0.2 ? 0.9 : 1;
      const salePrice = roundMoney(p.price * promo * (0.98 + rand() * 0.04));
      const revenue = salePrice * quantity;

      const feeRate = marketplace === "Amazon" ? 0.15 : marketplace === "eBay" ? 0.128 : 0.08;
      const fee = roundMoney(revenue * feeRate + (marketplace === "eBay" ? 0.3 : 0));
      const shipping = roundMoney(p.shipping * (quantity > 1 ? 1 + 0.6 * (quantity - 1) : 1) * (0.95 + rand() * 0.1));

      // advertising: mostly Amazon sponsored products, rising in the most recent 2 weeks
      const recentBoost = d < 14 ? 1.25 : 1;
      let ad = 0;
      if (marketplace === "Amazon" && rand() < 0.7) {
        ad = roundMoney(revenue * (0.05 + rand() * 0.07) * p.adIntensity * recentBoost);
      } else if (marketplace === "eBay" && rand() < 0.3) {
        ad = roundMoney(revenue * (0.02 + rand() * 0.03));
      }

      let refund = 0;
      if (rand() < p.refundRate) {
        refund = rand() < 0.7 ? roundMoney(revenue) : roundMoney(revenue * 0.5);
      }

      const ts = dayStart + Math.floor((8 + rand() * 14) * 3_600_000);
      seq += 1;
      orders.push({
        id: `demo-${seq}`,
        external_order_id:
          marketplace === "Amazon"
            ? `203-${String(1000000 + Math.floor(rand() * 8999999))}-${String(1000000 + Math.floor(rand() * 8999999))}`
            : `${String(10 + Math.floor(rand() * 89))}-${String(10000 + Math.floor(rand() * 89999))}-${String(10000 + Math.floor(rand() * 89999))}`,
        marketplace,
        order_date: new Date(ts).toISOString(),
        sku: p.sku,
        product_name: p.name,
        quantity,
        sale_price: salePrice,
        product_cost: p.cost,
        marketplace_fee: fee,
        shipping_cost: shipping,
        ad_cost: ad,
        refund_amount: refund,
        currency: "GBP",
      });
    }
  }
  return orders;
}

export function generateDemoProducts(): Product[] {
  return DEMO_PRODUCTS.map((p, i) => ({
    id: `demo-product-${i + 1}`,
    sku: p.sku,
    name: p.name,
    marketplace: "Amazon",
    product_cost: p.cost,
    default_shipping_cost: p.shipping,
    default_fee: roundMoney(p.price * 0.15),
    default_ad_cost: roundMoney(p.price * 0.08 * p.adIntensity),
  }));
}
