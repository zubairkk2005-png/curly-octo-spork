import Papa from "papaparse";
import type { CurrencyCode, Product } from "@/lib/types";
import {
  IMPORT_FIELDS,
  importRowSchema,
  validatedOrderSchema,
  type ImportField,
  type ValidatedOrder,
} from "./schema";

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_ROWS = 5000;

export type ColumnMapping = Partial<Record<ImportField, string>>;

export interface ParsedCsv {
  headers: string[];
  rows: Record<string, string>[];
}

export function validateFile(file: { name: string; size: number; type: string }): string | null {
  if (!/\.csv$/i.test(file.name)) return "Please upload a .csv file.";
  if (file.size === 0) return "That file is empty.";
  if (file.size > MAX_FILE_BYTES) return "That file is larger than 5 MB. Split it into smaller files.";
  const okTypes = ["", "text/csv", "text/plain", "application/csv", "application/vnd.ms-excel"];
  if (!okTypes.includes(file.type)) return "That doesn't look like a CSV file.";
  return null;
}

export function parseCsvText(text: string): ParsedCsv {
  const result = Papa.parse<Record<string, string>>(text.replace(/^﻿/, ""), {
    header: true,
    skipEmptyLines: "greedy",
    transformHeader: (h) => h.trim(),
  });
  const headers = (result.meta.fields ?? []).filter((h) => h !== "");
  if (headers.length === 0) throw new Error("We couldn't find a header row in that file.");
  if (result.data.length === 0) throw new Error("The file has a header row but no orders.");
  if (result.data.length > MAX_ROWS) {
    throw new Error(`That file has more than ${MAX_ROWS.toLocaleString("en-GB")} rows. Split it and import in batches.`);
  }
  return { headers, rows: result.data };
}

export interface RowError {
  /** 1-based line number in the file, counting the header as line 1 */
  line: number;
  messages: string[];
  raw: Record<string, string>;
}

export interface ValidRow {
  line: number;
  data: ValidatedOrder;
}

export interface ValidationResult {
  valid: ValidRow[];
  errors: RowError[];
}

const DEFAULTABLE = [
  ["product_cost", "product_cost"],
  ["marketplace_fee", "default_fee"],
  ["shipping_cost", "default_shipping_cost"],
  ["ad_cost", "default_ad_cost"],
] as const;

const isBlank = (v: string | undefined) => v === undefined || v.trim() === "";

export function validateRows(
  parsed: ParsedCsv,
  mapping: ColumnMapping,
  opts: { defaultCurrency: CurrencyCode; products: readonly Product[] },
): ValidationResult {
  const productBySku = new Map(opts.products.map((p) => [p.sku.toLowerCase(), p]));
  const valid: ValidRow[] = [];
  const errors: RowError[] = [];
  const seen = new Map<string, number>();

  parsed.rows.forEach((row, i) => {
    const line = i + 2;
    const raw: Partial<Record<ImportField, string>> = {};
    for (const f of IMPORT_FIELDS) {
      const col = mapping[f];
      raw[f] = col ? row[col] : undefined;
    }
    // Fill blanks from product defaults when the seller has set them up
    const product = raw.sku ? productBySku.get(raw.sku.trim().toLowerCase()) : undefined;
    if (product) {
      for (const [field, key] of DEFAULTABLE) {
        if (isBlank(raw[field])) raw[field] = String(product[key]);
      }
      if (isBlank(raw.product_name)) raw.product_name = product.name;
    }
    if (isBlank(raw.currency)) raw.currency = opts.defaultCurrency;

    const parsedRow = importRowSchema.safeParse(raw);
    if (!parsedRow.success) {
      const messages = [...new Set(parsedRow.error.issues.map((iss) => iss.message))];
      errors.push({ line, messages, raw: row });
      return;
    }
    const finalRow = validatedOrderSchema.safeParse(parsedRow.data);
    if (!finalRow.success) {
      errors.push({ line, messages: finalRow.error.issues.map((iss) => iss.message), raw: row });
      return;
    }
    const d = finalRow.data;
    const key = `${d.marketplace}|${d.order_id}|${d.sku}`.toLowerCase();
    const firstLine = seen.get(key);
    if (firstLine !== undefined) {
      errors.push({ line, messages: [`Duplicate of line ${firstLine} (same marketplace, order ID and SKU)`], raw: row });
      return;
    }
    seen.set(key, line);
    valid.push({ line, data: d });
  });

  return { valid, errors };
}
