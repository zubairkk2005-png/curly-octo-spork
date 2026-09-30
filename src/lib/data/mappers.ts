import { safeNumber } from "@/lib/currency";
import type { CurrencyCode, Marketplace, Order, Product } from "@/lib/types";

type Row = Record<string, unknown>;

const marketplace = (v: unknown): Marketplace => (v === "Amazon" || v === "eBay" ? v : "Other");
const currency = (v: unknown): CurrencyCode => (v === "USD" || v === "EUR" || v === "PKR" ? v : "GBP");

export function rowToOrder(r: Row): Order {
  return {
    id: String(r.id),
    external_order_id: String(r.external_order_id ?? ""),
    marketplace: marketplace(r.marketplace),
    order_date: String(r.order_date ?? ""),
    sku: String(r.sku ?? ""),
    product_name: String(r.product_name ?? ""),
    quantity: safeNumber(r.quantity),
    sale_price: safeNumber(r.sale_price),
    product_cost: safeNumber(r.product_cost),
    marketplace_fee: safeNumber(r.marketplace_fee),
    shipping_cost: safeNumber(r.shipping_cost),
    ad_cost: safeNumber(r.ad_cost),
    refund_amount: safeNumber(r.refund_amount),
    currency: currency(r.currency),
  };
}

export function rowToProduct(r: Row): Product {
  return {
    id: String(r.id),
    sku: String(r.sku ?? ""),
    name: String(r.name ?? ""),
    marketplace: marketplace(r.marketplace),
    product_cost: safeNumber(r.product_cost),
    default_shipping_cost: safeNumber(r.default_shipping_cost),
    default_fee: safeNumber(r.default_fee),
    default_ad_cost: safeNumber(r.default_ad_cost),
  };
}
