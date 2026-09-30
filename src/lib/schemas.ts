import { z } from "zod";
import { CURRENCY_CODES, MARKETPLACES } from "./types";

const money = z.number().finite().min(0).max(10_000_000);
const clean = (max: number) =>
  z
    .string()
    .transform((s) => s.replace(/[\u0000-\u001f\u007f<>]/g, "").trim())
    .pipe(z.string().min(1).max(max));

export const productInputSchema = z.object({
  sku: clean(100),
  name: clean(200),
  marketplace: z.enum(MARKETPLACES),
  product_cost: money,
  default_shipping_cost: money,
  default_fee: money,
  default_ad_cost: money,
});

export const profileInputSchema = z.object({
  full_name: z.string().max(100).transform((s) => s.replace(/[<>]/g, "").trim()),
  business_name: z.string().max(100).transform((s) => s.replace(/[<>]/g, "").trim()),
  currency: z.enum(CURRENCY_CODES),
});

export const orderSchema = z.object({
  id: z.string().max(100),
  external_order_id: z.string().max(100),
  marketplace: z.enum(MARKETPLACES),
  order_date: z.string().max(40),
  sku: z.string().max(100),
  product_name: z.string().max(200),
  quantity: z.number().finite().min(0).max(100_000),
  sale_price: money,
  product_cost: money,
  marketplace_fee: money,
  shipping_cost: money,
  ad_cost: money,
  refund_amount: money,
  currency: z.enum(CURRENCY_CODES),
});
