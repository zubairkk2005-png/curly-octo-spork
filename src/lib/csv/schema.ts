import { z } from "zod";
import { CURRENCY_CODES, type CurrencyCode, type Marketplace } from "@/lib/types";

export const IMPORT_FIELDS = [
  "order_id",
  "order_date",
  "marketplace",
  "sku",
  "product_name",
  "quantity",
  "sale_price",
  "product_cost",
  "marketplace_fee",
  "shipping_cost",
  "ad_cost",
  "refund_amount",
  "currency",
] as const;
export type ImportField = (typeof IMPORT_FIELDS)[number];

export const REQUIRED_FIELDS: readonly ImportField[] = [
  "order_id",
  "order_date",
  "sku",
  "quantity",
  "sale_price",
];

export const FIELD_LABELS: Record<ImportField, string> = {
  order_id: "Order ID",
  order_date: "Order date",
  marketplace: "Marketplace",
  sku: "SKU",
  product_name: "Product name",
  quantity: "Quantity",
  sale_price: "Sale price (per unit)",
  product_cost: "Product cost (per unit)",
  marketplace_fee: "Marketplace fee",
  shipping_cost: "Shipping cost",
  ad_cost: "Ad cost",
  refund_amount: "Refund amount",
  currency: "Currency",
};

const ALIASES: Record<ImportField, string[]> = {
  order_id: ["orderid", "order", "ordernumber", "orderno", "externalorderid", "amazonorderid", "salesrecordnumber", "id"],
  order_date: ["orderdate", "date", "purchasedate", "solddate", "saledate", "createdat", "datesold"],
  marketplace: ["marketplace", "channel", "platform", "saleschannel", "store"],
  sku: ["sku", "itemsku", "productsku", "customlabel", "sellersku", "customlabelsku"],
  product_name: ["productname", "name", "title", "itemtitle", "producttitle", "itemname", "product"],
  quantity: ["quantity", "qty", "units", "quantitypurchased", "unitssold"],
  sale_price: ["saleprice", "price", "itemprice", "unitprice", "sellingprice", "soldfor", "itemsubtotal"],
  product_cost: ["productcost", "cost", "cogs", "unitcost", "costofgoods", "costprice", "itemcost"],
  marketplace_fee: ["marketplacefee", "fee", "fees", "referralfee", "finalvaluefee", "commission", "channelfee", "totalfees"],
  shipping_cost: ["shippingcost", "shipping", "postage", "postagecost", "deliverycost", "shippingfee"],
  ad_cost: ["adcost", "ads", "adspend", "advertising", "advertisingcost", "ppc", "promotedlistingfee"],
  refund_amount: ["refundamount", "refund", "refunds", "returnamount", "refunded"],
  currency: ["currency", "currencycode", "curr"],
};

const normalizeHeader = (h: string) => h.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Guess a mapping of internal field -> CSV header. */
export function autoMapColumns(headers: readonly string[]): Partial<Record<ImportField, string>> {
  const mapping: Partial<Record<ImportField, string>> = {};
  const used = new Set<string>();
  // exact internal-name matches first, then aliases
  for (const pass of ["exact", "alias"] as const) {
    for (const field of IMPORT_FIELDS) {
      if (mapping[field]) continue;
      const found = headers.find((h) => {
        if (used.has(h)) return false;
        const n = normalizeHeader(h);
        return pass === "exact" ? n === normalizeHeader(field) : ALIASES[field].includes(n);
      });
      if (found) {
        mapping[field] = found;
        used.add(found);
      }
    }
  }
  return mapping;
}

export function missingRequiredFields(mapping: Partial<Record<ImportField, string>>): ImportField[] {
  return REQUIRED_FIELDS.filter((f) => !mapping[f]);
}

// ---- value sanitising / parsing ----

/** Strip control chars and angle brackets, collapse whitespace, cap length. */
export function sanitizeText(value: unknown, max = 200): string {
  if (value === null || value === undefined) return "";
  return String(value)
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/[<>]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/** Parses "£1,234.50", "(12.30)", "-4", "1.234,50" (EU) into a number; NaN when not numeric. */
export function parseMoney(value: unknown): number {
  if (typeof value === "number") return value;
  let s = sanitizeText(value, 40);
  if (s === "") return NaN;
  let negative = false;
  if (/^\(.*\)$/.test(s)) {
    negative = true;
    s = s.slice(1, -1);
  }
  s = s.replace(/[£$€]|Rs\.?|PKR|GBP|USD|EUR/gi, "").replace(/\s/g, "");
  if (s.startsWith("-")) {
    negative = !negative;
    s = s.slice(1);
  }
  if (/^\d{1,3}(\.\d{3})+,\d+$/.test(s)) s = s.replace(/\./g, "").replace(",", ".");
  else if (/^\d+,\d{1,2}$/.test(s)) s = s.replace(",", ".");
  else s = s.replace(/,/g, "");
  if (!/^\d*\.?\d+$|^\d+\.$/.test(s)) return NaN;
  const n = Number(s);
  return negative ? -n : n;
}

/** Accepts ISO dates/timestamps and DD/MM/YYYY (optionally with time). Returns ISO string or null. */
export function parseDate(value: unknown): string | null {
  const s = sanitizeText(value, 40);
  if (!s) return null;
  const dmy = s.match(/^(\d{1,2})[/.-](\d{1,2})[/.-](\d{4})(?:[ T](\d{1,2}):(\d{2}))?/);
  let t: number;
  if (dmy) {
    const [, d, m, y, hh = "0", mm = "0"] = dmy;
    t = Date.UTC(Number(y), Number(m) - 1, Number(d), Number(hh), Number(mm));
    const check = new Date(t);
    if (check.getUTCMonth() !== Number(m) - 1 || check.getUTCDate() !== Number(d)) return null;
  } else if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    t = Date.parse(/^\d{4}-\d{2}-\d{2}$/.test(s) ? `${s}T12:00:00Z` : /(Z|[+-]\d{2}:?\d{2})$/.test(s) ? s : `${s.replace(" ", "T")}Z`);
  } else {
    return null;
  }
  if (!Number.isFinite(t)) return null;
  const year = new Date(t).getUTCFullYear();
  if (year < 2000 || t > Date.now() + 2 * 86_400_000) return null;
  return new Date(t).toISOString();
}

export function normalizeMarketplace(value: unknown): Marketplace {
  const s = sanitizeText(value, 40).toLowerCase();
  if (s.includes("amazon")) return "Amazon";
  if (s.includes("ebay")) return "eBay";
  return "Other";
}

// ---- Zod row schema ----

const money = (label: string, opts: { min?: number } = {}) =>
  z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? undefined : parseMoney(v)),
    z
      .number({ error: `${label} must be a number` })
      .refine((n) => Number.isFinite(n), `${label} must be a number`)
      .min(opts.min ?? 0, `${label} cannot be negative`)
      .max(10_000_000, `${label} is unrealistically large`),
  );

const optionalMoney = (label: string) =>
  z.preprocess(
    (v) => (v === undefined || v === null || (typeof v === "string" && v.trim() === "") ? 0 : parseMoney(v)),
    z
      .number({ error: `${label} must be a number` })
      .refine((n) => Number.isFinite(n), `${label} must be a number`)
      .min(0, `${label} cannot be negative`)
      .max(10_000_000, `${label} is unrealistically large`),
  );

export const importRowSchema = z.object({
  order_id: z.preprocess((v) => sanitizeText(v, 100), z.string().min(1, "Order ID is required")),
  order_date: z.preprocess(
    (v) => parseDate(v),
    z.string({ error: "Order date is missing or invalid (use YYYY-MM-DD or DD/MM/YYYY)" }),
  ),
  marketplace: z.preprocess((v) => normalizeMarketplace(v), z.enum(["Amazon", "eBay", "Other"])),
  sku: z.preprocess((v) => sanitizeText(v, 100), z.string().min(1, "SKU is required")),
  product_name: z.preprocess((v) => sanitizeText(v, 200), z.string()),
  quantity: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : parseMoney(v)),
    z
      .number({ error: "Quantity must be a whole number" })
      .int("Quantity must be a whole number")
      .min(1, "Quantity must be at least 1")
      .max(100_000, "Quantity is unrealistically large"),
  ),
  sale_price: money("Sale price"),
  product_cost: money("Product cost"),
  marketplace_fee: optionalMoney("Marketplace fee"),
  shipping_cost: optionalMoney("Shipping cost"),
  ad_cost: optionalMoney("Ad cost"),
  // Some exports list refunds as negatives; store the magnitude.
  refund_amount: z.preprocess(
    (v) => {
      if (v === undefined || v === null || (typeof v === "string" && v.trim() === "")) return 0;
      const n = parseMoney(v);
      return Number.isFinite(n) ? Math.abs(n) : n;
    },
    z.number({ error: "Refund amount must be a number" }).refine(Number.isFinite, "Refund amount must be a number").max(10_000_000),
  ),
  currency: z.preprocess(
    (v) => {
      const s = sanitizeText(v, 10).toUpperCase();
      return s === "" ? undefined : s;
    },
    z.enum(CURRENCY_CODES, { error: "Currency must be GBP, USD, EUR or PKR" }).optional(),
  ),
});

export type ImportRow = z.infer<typeof importRowSchema>;

/** Row as sent to the server: currency resolved, product name defaulted. */
export const validatedOrderSchema = importRowSchema
  .extend({ currency: z.enum(CURRENCY_CODES) })
  .transform((r) => ({ ...r, product_name: r.product_name || r.sku }));
export type ValidatedOrder = z.infer<typeof validatedOrderSchema>;

export function isCurrency(v: string): v is CurrencyCode {
  return (CURRENCY_CODES as readonly string[]).includes(v);
}
