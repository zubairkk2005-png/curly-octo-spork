"use client";

import { Package, Pencil, Plus, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { CurrencyDisplay } from "@/components/common/currency-display";
import { EmptyState } from "@/components/common/empty-state";
import { TableSkeleton } from "@/components/common/loading-skeleton";
import { PageHeader } from "@/components/common/page-header";
import { ProfitBadge } from "@/components/common/profit-badge";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TBody, TD, TH, THead, TR } from "@/components/ui/table";
import { formatNumber, formatPercent } from "@/lib/currency";
import { convertAmount } from "@/lib/currency";
import type { Product } from "@/lib/types";
import { ProductDetail } from "./product-detail";
import { ProductFormDialog } from "./product-form";

export function ProductsView() {
  const { ready, products, analytics, deleteProduct, isDemo, currency, profile } = useAppData();
  const baseCurrency = isDemo ? "GBP" : profile.currency;
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Product | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [viewing, setViewing] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const statsBySku = useMemo(() => new Map(analytics.products.map((p) => [p.sku, p])), [analytics.products]);
  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products
      .filter((p) => !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q))
      .map((p) => ({ product: p, stats: statsBySku.get(p.sku) }))
      .sort((a, b) => (b.stats?.netProfit ?? -Infinity) - (a.stats?.netProfit ?? -Infinity) || a.product.name.localeCompare(b.product.name));
  }, [products, statsBySku, query]);

  const openForm = (p: Product | null) => { setEditing(p); setFormOpen(true); };

  async function confirmDelete() {
    if (!deleting) return;
    setDeleteBusy(true);
    setDeleteError(null);
    const res = await deleteProduct(deleting.id);
    setDeleteBusy(false);
    if (res.ok) setDeleting(null);
    else setDeleteError(res.error ?? "Couldn't delete the product.");
  }

  if (!ready) return <Card><TableSkeleton rows={8} /></Card>;

  return (
    <div>
      <PageHeader
        description="Costs and performance for each SKU over the selected date range."
        actions={<Button onClick={() => openForm(null)}><Plus /> Add product</Button>}
      />
      {products.length === 0 ? (
        <EmptyState icon={Package} title="No products yet" description="Add a product manually, or import orders and we'll create products from your SKUs." action={<Button onClick={() => openForm(null)}><Plus /> Add product</Button>} />
      ) : (
        <div className="space-y-4">
          <div className="relative max-w-xs">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            <Input className="pl-9" placeholder="Search name or SKU" aria-label="Search products" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
          {rows.length === 0 ? (
            <EmptyState icon={Search} title="No products match" description="Try a different search." />
          ) : (
            <Card className="overflow-hidden">
              <Table>
                <THead>
                  <TR className="hover:bg-transparent">
                    <TH>Product</TH><TH>SKU</TH><TH>Marketplace</TH>
                    <TH className="text-right">Cost</TH><TH className="text-right">Units sold</TH><TH className="text-right">Revenue</TH>
                    <TH className="text-right">Profit</TH><TH className="text-right">Margin</TH><TH className="text-right">Returns</TH><TH><span className="sr-only">Actions</span></TH>
                  </TR>
                </THead>
                <TBody>
                  {rows.map(({ product: p, stats }) => (
                    <TR key={p.id} className="cursor-pointer hover:bg-accent/50" onClick={() => setViewing(p)}>
                      <TD className="max-w-64 truncate font-medium">
                        <button className="text-left underline-offset-2 hover:underline" onClick={(e) => { e.stopPropagation(); setViewing(p); }}>{p.name}</button>
                      </TD>
                      <TD className="text-muted-foreground">{p.sku}</TD>
                      <TD>{p.marketplace}</TD>
                      <TD className="text-right"><CurrencyDisplay value={convertAmount(p.product_cost, baseCurrency, currency)} /></TD>
                      <TD className="text-right">{formatNumber(stats?.units ?? 0)}</TD>
                      <TD className="text-right"><CurrencyDisplay value={stats?.revenue ?? 0} /></TD>
                      <TD className="text-right"><CurrencyDisplay value={stats?.netProfit ?? 0} colored /></TD>
                      <TD className="text-right">{stats ? <ProfitBadge value={stats.margin} /> : <span className="text-muted-foreground">—</span>}</TD>
                      <TD className="text-right text-muted-foreground">{formatPercent(stats?.returnRate ?? 0)}</TD>
                      <TD className="text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" aria-label={`Edit ${p.name}`} onClick={() => openForm(p)}><Pencil /></Button>
                          <Button variant="ghost" size="icon" aria-label={`Delete ${p.name}`} onClick={() => { setDeleteError(null); setDeleting(p); }}><Trash2 /></Button>
                        </div>
                      </TD>
                    </TR>
                  ))}
                </TBody>
              </Table>
            </Card>
          )}
        </div>
      )}

      <ProductFormDialog open={formOpen} product={editing} onClose={() => setFormOpen(false)} />
      <ProductDetail product={viewing} onClose={() => setViewing(null)} />
      <Dialog open={deleting !== null} onOpenChange={(o) => !o && setDeleting(null)}>
        <DialogContent title="Delete product?" description="Your existing orders stay untouched.">
          <p className="text-sm">This removes <b>{deleting?.name}</b> from your product list. Orders that use its SKU keep their recorded costs.</p>
          {deleteError && <p role="alert" className="mt-3 text-[13px] text-negative">{deleteError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setDeleting(null)}>Cancel</Button>
            <Button variant="destructive" loading={deleteBusy} onClick={() => void confirmDelete()}>Delete</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
