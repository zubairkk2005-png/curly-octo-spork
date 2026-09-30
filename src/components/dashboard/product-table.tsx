"use client";

import { ArrowDown, ArrowUp, ChevronsUpDown } from "lucide-react";
import { useMemo, useState } from "react";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { ProfitBadge } from "@/components/common/profit-badge";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatNumber, formatPercent } from "@/lib/currency";
import type { ProductStats } from "@/lib/profit";
import { cn } from "@/lib/utils";

type SortKey = "name" | "units" | "revenue" | "netProfit" | "margin" | "returnRate";

const COLUMNS: { key: SortKey; label: string; numeric: boolean }[] = [
  { key: "name", label: "Product", numeric: false },
  { key: "units", label: "Units", numeric: true },
  { key: "revenue", label: "Revenue", numeric: true },
  { key: "netProfit", label: "Net profit", numeric: true },
  { key: "margin", label: "Margin", numeric: true },
  { key: "returnRate", label: "Returns", numeric: true },
];

export function ProductTable({ products, limit }: { products: ProductStats[]; limit?: number }) {
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "netProfit", dir: "desc" });

  const rows = useMemo(() => {
    const sorted = [...products].sort((a, b) => {
      const av = a[sort.key];
      const bv = b[sort.key];
      const cmp = typeof av === "string" && typeof bv === "string" ? av.localeCompare(bv) : Number(av) - Number(bv);
      return sort.dir === "asc" ? cmp : -cmp;
    });
    return limit ? sorted.slice(0, limit) : sorted;
  }, [products, sort, limit]);

  const toggle = (key: SortKey) =>
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: key === "name" ? "asc" : "desc" }));

  return (
    <Table>
      <THead>
        <TR className="hover:bg-transparent">
          {COLUMNS.map((c) => {
            const active = sort.key === c.key;
            return (
              <TH key={c.key} className={cn(c.numeric && "text-right")} aria-sort={active ? (sort.dir === "asc" ? "ascending" : "descending") : "none"}>
                <button onClick={() => toggle(c.key)} className={cn("inline-flex items-center gap-1 hover:text-foreground", active && "text-foreground")}>
                  {c.label}
                  {active ? sort.dir === "asc" ? <ArrowUp className="size-3" /> : <ArrowDown className="size-3" /> : <ChevronsUpDown className="size-3 opacity-50" />}
                </button>
              </TH>
            );
          })}
        </TR>
      </THead>
      <TBody>
        {rows.map((p) => (
          <TR key={p.sku} className="hover:bg-accent/50">
            <TD className="max-w-64 truncate font-medium" title={p.name}>{p.name}</TD>
            <TD className="text-right">{formatNumber(p.units)}</TD>
            <TD className="text-right"><CurrencyDisplay value={p.revenue} /></TD>
            <TD className="text-right"><CurrencyDisplay value={p.netProfit} colored /></TD>
            <TD className="text-right"><ProfitBadge value={p.margin} /></TD>
            <TD className="text-right text-muted-foreground">{formatPercent(p.returnRate)}</TD>
          </TR>
        ))}
      </TBody>
    </Table>
  );
}
