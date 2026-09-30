"use client";

import { useState, type FormEvent } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { CURRENCIES } from "@/lib/currency";
import { productInputSchema } from "@/lib/schemas";
import { MARKETPLACES, type Product } from "@/lib/types";

const NUMERIC = [
  ["product_cost", "Product cost (per unit)"],
  ["default_shipping_cost", "Default shipping cost"],
  ["default_fee", "Default marketplace fee"],
  ["default_ad_cost", "Default ad cost"],
] as const;

export function ProductFormDialog({ open, product, onClose }: { open: boolean; product: Product | null; onClose: () => void }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent title={product ? "Edit product" : "Add product"} description="Costs are used to fill blanks when you import orders.">
        {/* remount the form each time so its state starts fresh */}
        {open && <ProductForm key={product?.id ?? "new"} product={product} onDone={onClose} />}
      </DialogContent>
    </Dialog>
  );
}

function ProductForm({ product, onDone }: { product: Product | null; onDone: () => void }) {
  const { saveProduct, profile, isDemo } = useAppData();
  const currency = isDemo ? "GBP" : profile.currency;
  const [values, setValues] = useState({
    sku: product?.sku ?? "",
    name: product?.name ?? "",
    marketplace: product?.marketplace ?? "Amazon",
    product_cost: String(product?.product_cost ?? ""),
    default_shipping_cost: String(product?.default_shipping_cost ?? ""),
    default_fee: String(product?.default_fee ?? ""),
    default_ad_cost: String(product?.default_ad_cost ?? ""),
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof values) => (e: { target: { value: string } }) => setValues((v) => ({ ...v, [k]: e.target.value }));

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const num = (s: string) => (s.trim() === "" ? 0 : Number(s));
    const parsed = productInputSchema.safeParse({
      ...values,
      product_cost: num(values.product_cost),
      default_shipping_cost: num(values.default_shipping_cost),
      default_fee: num(values.default_fee),
      default_ad_cost: num(values.default_ad_cost),
    });
    if (!parsed.success) {
      setError("Please enter a SKU, a name, and costs of zero or more.");
      return;
    }
    setSaving(true);
    const res = await saveProduct(parsed.data, product?.id);
    setSaving(false);
    if (res.ok) onDone();
    else setError(res.error ?? "Couldn't save the product.");
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div>
        <Label htmlFor="p-name">Product name</Label>
        <Input id="p-name" value={values.name} onChange={set("name")} maxLength={200} required autoFocus />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="p-sku">SKU</Label>
          <Input id="p-sku" value={values.sku} onChange={set("sku")} maxLength={100} required />
        </div>
        <div>
          <Label htmlFor="p-mp">Marketplace</Label>
          <Select id="p-mp" value={values.marketplace} onChange={set("marketplace")}>
            {MARKETPLACES.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {NUMERIC.map(([key, label]) => (
          <div key={key}>
            <Label htmlFor={`p-${key}`}>{label} ({CURRENCIES[currency].symbol})</Label>
            <Input id={`p-${key}`} inputMode="decimal" type="number" min="0" step="0.01" value={values[key]} onChange={set(key)} placeholder="0.00" />
          </div>
        ))}
      </div>
      {error && <p role="alert" className="text-[13px] text-negative">{error}</p>}
      <div className="flex justify-end gap-2 pt-1">
        <Button type="button" variant="outline" onClick={onDone}>Cancel</Button>
        <Button type="submit" loading={saving}>{product ? "Save changes" : "Add product"}</Button>
      </div>
    </form>
  );
}
