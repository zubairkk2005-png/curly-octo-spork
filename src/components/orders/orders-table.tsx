"use client";

import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, ReceiptText, Search } from "lucide-react";
import { useMemo, useState } from "react";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { EmptyState } from "@/components/common/empty-state";
import { ProfitBadge } from "@/components/common/profit-badge";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { calculateOrderProfit, orderTime } from "@/lib/profit";
import { MARKETPLACES, type Order } from "@/lib/types";
import { cn } from "@/lib/utils";
import { OrderDetail } from "./order-detail";

const PAGE_SIZE = 20;

type SortKey = "external_order_id" | "order_date" | "marketplace" | "product_name" | "quantity" | "revenue" | "productCost" | "marketplace_fee" | "shipping_cost" | "ad_cost" | "refund_amount" | "profit" | "margin";

interface Row {
  order: Order;
  revenue: number;
  productCost: number;
  profit: number;
  margin: number;
  ts: number;
}

const COLUMNS: { key: SortKey; label: string; numeric?: boolean }[] = [
  { key: "external_order_id", label: "Order ID" },
  { key: "order_date", label: "Date" },
  { key: "marketplace", label: "Marketplace" },
  { key: "product_name", label: "Product" },
  { key: "quantity", label: "Qty", numeric: true },
  { key: "revenue", label: "Revenue", numeric: true },
  { key: "productCost", label: "Product cost", numeric: true },
  { key: "marketplace_fee", label: "Fees", numeric: true },
  { key: "shipping_cost", label: "Shipping", numeric: true },
  { key: "ad_cost", label: "Ads", numeric: true },
  { key: "refund_amount", label: "Refund", numeric: true },
  { key: "profit", label: "Net profit", numeric: true },
  { key: "margin", label: "Margin", numeric: true },
];

export function OrdersTable() {
  const { displayOrders } = useAppData();
  const [query, setQuery] = useState("");
  const [marketplace, setMarketplace] = useState("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "order_date", dir: "desc" });
  const [page, setPage] = useState(0);
  const [selected, setSelected] = useState<Order | null>(null);

  const rows = useMemo<Row[]>(
    () =>
      displayOrders.map((order) => {
        const p = calculateOrderProfit(order);
        return { order, revenue: p.revenue, productCost: p.productCost, profit: p.profit, margin: p.margin, ts: orderTime(order) };
      }),
    [displayOrders],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const fromMs = from ? Date.parse(`${from}T00:00:00Z`) : -Infinity;
    const toMs = to ? Date.parse(`${to}T23:59:59.999Z`) : Infinity;
    const list = rows.filter((r) => {
      if (marketplace !== "all" && r.order.marketplace !== marketplace) return false;
      if (r.ts < fromMs || r.ts > toMs) return false;
      if (!q) return true;
      return [r.order.external_order_id, r.order.product_name, r.order.sku].some((v) => v.toLowerCase().includes(q));
    });
    const value = (r: Row): string | number => {
      switch (sort.key) {
        case "order_date": return r.ts;
        case "revenue": return r.revenue;
        case "productCost": return r.productCost;
        case "profit": return r.profit;
        case "margin": return r.margin;
        default: return r.order[sort.key];
      }
    };
    return list.sort((a, b) => {
      const av = value(a), bv = value(b);
      const cmp = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : Number(av) - Number(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
  }, [rows, query, marketplace, from, to, sort]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const current = Math.min(page, pages - 1);
  const visible = filtered.slice(current * PAGE_SIZE, (current + 1) * PAGE_SIZE);

  const toggle = (key: SortKey) => {
    setPage(0);
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "desc" }));
  };
  const reset = <T,>(set: (v: T) => void) => (v: T) => { set(v); setPage(0); };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1 sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input className="pl-9" placeholder="Search order, product or SKU" aria-label="Search orders" value={query} onChange={(e) => reset(setQuery)(e.target.value)} />
        </div>
        <Select aria-label="Marketplace" className="w-36" value={marketplace} onChange={(e) => reset(setMarketplace)(e.target.value)}>
          <option value="all">All marketplaces</option>
          {MARKETPLACES.map((m) => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input type="date" aria-label="From date" className="w-[9.5rem]" value={from} max={to || undefined} onChange={(e) => reset(setFrom)(e.target.value)} />
        <span className="text-muted-foreground">→</span>
        <Input type="date" aria-label="To date" className="w-[9.5rem]" value={to} min={from || undefined} onChange={(e) => reset(setTo)(e.target.value)} />
        {(query || marketplace !== "all" || from || to) && (
          <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setMarketplace("all"); setFrom(""); setTo(""); setPage(0); }}>Clear</Button>
        )}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={ReceiptText} title="No orders match" description="Try a different search or clear the filters." />
      ) : (
        <Card className="overflow-hidden">
          <Table>
            <THead>
              <TR className="hover:bg-transparent">
                {COLUMNS.map((c) => {
                  const active = sort.key === c.key;
                  return (
                    <TH key={c.key} className={cn(c.numeric && "text-right")} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                      <button onClick={() => toggle(c.key)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
                        {c.label}
                        {active ? sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-40" />}
                      </button>
                    </TH>
                  );
                })}
              </TR>
            </THead>
            <TBody>
              {visible.map((r) => (
                <TR key={r.order.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setSelected(r.order)}>
                  <TD className="font-medium">
                    <button className="text-left underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-ring" onClick={(e) => { e.stopPropagation(); setSelected(r.order); }}>
                      {r.order.external_order_id}
                    </button>
                  </TD>
                  <TD className="text-muted-foreground">{formatDateTime(r.order.order_date)}</TD>
                  <TD>{r.order.marketplace}</TD>
                  <TD className="max-w-56 truncate" title={r.order.product_name}>{r.order.product_name}</TD>
                  <TD className="text-right">{r.order.quantity}</TD>
                  <TD className="text-right"><CurrencyDisplay value={r.revenue} /></TD>
                  <TD className="text-right text-muted-foreground"><CurrencyDisplay value={r.productCost} /></TD>
                  <TD className="text-right text-muted-foreground"><CurrencyDisplay value={r.order.marketplace_fee} /></TD>
                  <TD className="text-right text-muted-foreground"><CurrencyDisplay value={r.order.shipping_cost} /></TD>
                  <TD className="text-right text-muted-foreground"><CurrencyDisplay value={r.order.ad_cost} /></TD>
                  <TD className="text-right text-muted-foreground"><CurrencyDisplay value={r.order.refund_amount} /></TD>
                  <TD className="text-right"><CurrencyDisplay value={r.profit} colored className="font-medium" /></TD>
                  <TD className="text-right"><ProfitBadge value={r.margin} /></TD>
                </TR>
              ))}
            </TBody>
          </Table>
          <div className="flex items-center justify-between border-t px-5 py-3 text-[13px] text-muted-foreground">
            <span>{filtered.length.toLocaleString("en-GB")} orders · page {current + 1} of {pages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="icon" aria-label="Previous page" disabled={current === 0} onClick={() => setPage(current - 1)}><ChevronLeft /></Button>
              <Button variant="outline" size="icon" aria-label="Next page" disabled={current >= pages - 1} onClick={() => setPage(current + 1)}><ChevronRight /></Button>
            </div>
          </div>
        </Card>
      )}
      <OrderDetail order={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
