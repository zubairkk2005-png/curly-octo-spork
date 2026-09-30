"use client";

import { CurrencyDisplay } from "@/components/common/currency-display";
import { ProfitBadge } from "@/components/common/profit-badge";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { formatDateTime } from "@/lib/dates";
import { calculateOrderProfit } from "@/lib/profit";
import type { Order } from "@/lib/types";

export function OrderDetail({ order, onClose }: { order: Order | null; onClose: () => void }) {
  const p = order ? calculateOrderProfit(order) : null;
  return (
    <Dialog open={order !== null} onOpenChange={(o) => !o && onClose()}>
      {order && p && (
        <DialogContent variant="drawer" title={`Order ${order.external_order_id}`} description={`${order.marketplace} · ${formatDateTime(order.order_date)}`}>
          <div className="space-y-5">
            <div>
              <div className="font-medium">{order.product_name}</div>
              <div className="text-[13px] text-muted-foreground">{order.sku} · {order.quantity} × <CurrencyDisplay value={order.sale_price} /></div>
            </div>

            <div className="rounded-xl bg-muted p-4">
              <div className="text-[13px] text-muted-foreground">Net profit</div>
              <div className="mt-1 flex items-baseline gap-3">
                <CurrencyDisplay value={p.profit} colored className="text-3xl font-semibold tracking-tight" />
                <ProfitBadge value={p.margin} />
              </div>
            </div>

            <dl className="divide-y text-sm">
              <Row label="Revenue" hint={`${order.quantity} × sale price`} value={p.revenue} strong />
              <Row label="Product cost" hint={`${order.quantity} × unit cost`} value={-p.productCost} />
              <Row label="Marketplace fee" value={-p.marketplaceFee} />
              <Row label="Shipping" value={-p.shippingCost} />
              <Row label="Advertising" value={-p.adCost} />
              <Row label="Refund" value={-p.refund} />
              <Row label="Total costs" value={-p.totalCost} strong />
              <Row label="Net profit" value={p.profit} strong colored />
            </dl>
            <p className="text-xs text-muted-foreground">Net profit = revenue − (product cost + fees + shipping + advertising + refunds).</p>
          </div>
        </DialogContent>
      )}
    </Dialog>
  );
}

function Row({ label, hint, value, strong, colored }: { label: string; hint?: string; value: number; strong?: boolean; colored?: boolean }) {
  return (
    <div className="flex items-center justify-between py-2.5">
      <dt className={strong ? "font-medium" : "text-muted-foreground"}>
        {label}
        {hint && <span className="ml-2 text-xs text-muted-foreground">{hint}</span>}
      </dt>
      <dd className={strong ? "font-medium" : ""}><CurrencyDisplay value={value} colored={colored} /></dd>
    </div>
  );
}
