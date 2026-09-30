export const CURRENCY_CODES = ["GBP", "USD", "EUR", "PKR"] as const;
export type CurrencyCode = (typeof CURRENCY_CODES)[number];

export const MARKETPLACES = ["Amazon", "eBay", "Other"] as const;
export type Marketplace = (typeof MARKETPLACES)[number];

/** One order line. Cost fields other than product_cost are order-level totals. */
export interface Order {
  id: string;
  external_order_id: string;
  marketplace: Marketplace;
  /** ISO 8601 timestamp */
  order_date: string;
  sku: string;
  product_name: string;
  quantity: number;
  /** price per unit */
  sale_price: number;
  /** cost per unit */
  product_cost: number;
  marketplace_fee: number;
  shipping_cost: number;
  ad_cost: number;
  refund_amount: number;
  currency: CurrencyCode;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  marketplace: Marketplace;
  product_cost: number;
  default_shipping_cost: number;
  default_fee: number;
  default_ad_cost: number;
}

export type ProductInput = Omit<Product, "id">;

export interface Profile {
  full_name: string;
  business_name: string;
  currency: CurrencyCode;
  email: string;
}

export type DateRangePreset = "today" | "7d" | "30d" | "90d" | "custom";

export interface CustomRange {
  /** YYYY-MM-DD */
  from: string;
  to: string;
}

export interface DateInterval {
  /** inclusive start (UTC ms) */
  start: number;
  /** exclusive end (UTC ms) */
  end: number;
}
