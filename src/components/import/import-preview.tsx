"use client";

import { AlertTriangle } from "lucide-react";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatCurrency } from "@/lib/currency";
import { formatDateTime } from "@/lib/dates";
import type { RowError, ValidRow } from "@/lib/csv/parse";
import { calculateOrderProfit } from "@/lib/profit";

export function ImportPreview({ valid }: { valid: ValidRow[] }) {
  const rows = valid.slice(0, 10);
  return (
    <div>
      <div className="mb-2 text-[13px] font-medium">Preview — first {rows.length} valid row{rows.length === 1 ? "" : "s"}</div>
      <div className="overflow-hidden rounded-xl border">
        <Table>
          <THead>
            <TR><TH>Order</TH><TH>Date</TH><TH>Marketplace</TH><TH>SKU</TH><TH className="text-right">Qty</TH><TH className="text-right">Price</TH><TH className="text-right">Cost</TH><TH className="text-right">Fees</TH><TH className="text-right">Ship</TH><TH className="text-right">Ads</TH><TH className="text-right">Refund</TH><TH>Cur.</TH><TH className="text-right">Net profit</TH></TR>
          </THead>
          <TBody>
            {rows.map(({ line, data: d }) => {
              const p = calculateOrderProfit({ ...d });
              return (
                <TR key={line}>
                  <TD className="font-medium">{d.order_id}</TD>
                  <TD className="text-muted-foreground">{formatDateTime(d.order_date)}</TD>
                  <TD>{d.marketplace}</TD>
                  <TD>{d.sku}</TD>
                  <TD className="text-right">{d.quantity}</TD>
                  <TD className="text-right">{formatCurrency(d.sale_price, d.currency)}</TD>
                  <TD className="text-right">{formatCurrency(d.product_cost, d.currency)}</TD>
                  <TD className="text-right">{formatCurrency(d.marketplace_fee, d.currency)}</TD>
                  <TD className="text-right">{formatCurrency(d.shipping_cost, d.currency)}</TD>
                  <TD className="text-right">{formatCurrency(d.ad_cost, d.currency)}</TD>
                  <TD className="text-right">{formatCurrency(d.refund_amount, d.currency)}</TD>
                  <TD>{d.currency}</TD>
                  <TD className="text-right"><CurrencyDisplay value={p.profit} currency={d.currency} colored /></TD>
                </TR>
              );
            })}
          </TBody>
        </Table>
      </div>
    </div>
  );
}

export function ImportErrors({ errors }: { errors: RowError[] }) {
  if (errors.length === 0) return null;
  const shown = errors.slice(0, 50);
  return (
    <div className="rounded-xl border border-negative/30 bg-negative-bg/40">
      <div className="flex items-center gap-2 border-b border-negative/20 px-4 py-2.5 text-sm font-medium text-negative">
        <AlertTriangle className="size-4" aria-hidden /> {errors.length} row{errors.length === 1 ? "" : "s"} need attention
      </div>
      <ul className="max-h-72 divide-y divide-negative/10 overflow-y-auto text-[13px]">
        {shown.map((e) => (
          <li key={e.line} className="px-4 py-2.5">
            <span className="font-medium">Line {e.line}</span>
            <span className="text-muted-foreground"> · {Object.values(e.raw).slice(0, 3).join(" · ")}</span>
            <ul className="mt-0.5 list-disc pl-5 text-negative">{e.messages.map((m) => <li key={m}>{m}</li>)}</ul>
          </li>
        ))}
      </ul>
      {errors.length > shown.length && <div className="border-t border-negative/20 px-4 py-2 text-xs text-muted-foreground">Showing the first {shown.length}. Download the full list below.</div>}
    </div>
  );
}
