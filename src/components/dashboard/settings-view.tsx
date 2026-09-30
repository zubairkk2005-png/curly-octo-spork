"use client";

import { Download, LogOut, Trash2 } from "lucide-react";
import Papa from "papaparse";
import { useState, type FormEvent } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { useTheme, type Theme } from "@/components/providers/theme";
import { PageHeader } from "@/components/common/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input, Label, Select } from "@/components/ui/input";
import { Segmented } from "@/components/ui/segmented";
import { CURRENCIES } from "@/lib/currency";
import { IMPORT_FIELDS } from "@/lib/csv/schema";
import { downloadText } from "@/lib/download";
import { CURRENCY_CODES, type CurrencyCode } from "@/lib/types";

export function SettingsView() {
  const app = useAppData();
  const [theme, setTheme] = useTheme();
  const [business, setBusiness] = useState(app.profile.business_name);
  const [name, setName] = useState(app.profile.full_name);
  const [currency, setCurrency] = useState<CurrencyCode>(app.profile.currency);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  async function onSave(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setMessage(null);
    const res = await app.saveProfile({ full_name: name.trim(), business_name: business.trim(), currency });
    setSaving(false);
    if (res.ok) {
      app.setCurrency(currency);
      setMessage({ ok: true, text: "Settings saved." });
    } else setMessage({ ok: false, text: res.error ?? "Couldn't save your settings." });
  }

  function onExport() {
    const rows = app.orders.map((o) => ({
      order_id: o.external_order_id, order_date: o.order_date, marketplace: o.marketplace, sku: o.sku, product_name: o.product_name,
      quantity: o.quantity, sale_price: o.sale_price, product_cost: o.product_cost, marketplace_fee: o.marketplace_fee,
      shipping_cost: o.shipping_cost, ad_cost: o.ad_cost, refund_amount: o.refund_amount, currency: o.currency,
    }));
    downloadText("profitpilot-orders-export.csv", Papa.unparse({ fields: [...IMPORT_FIELDS], data: rows.map((r) => IMPORT_FIELDS.map((f) => r[f])) }, { escapeFormulae: true }));
  }

  async function onDelete() {
    setDeleting(true);
    setDeleteError(null);
    const res = await app.deleteAllData();
    setDeleting(false);
    if (res.ok) setConfirmDelete(false);
    else setDeleteError(res.error ?? "Couldn't delete your data.");
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader description="Manage your business details, data and appearance." />

      <form onSubmit={onSave}>
        <Card>
          <CardHeader><div><CardTitle>Business</CardTitle><CardDescription>Used across your workspace.</CardDescription></div></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div><Label htmlFor="s-business">Business name</Label><Input id="s-business" value={business} maxLength={100} onChange={(e) => setBusiness(e.target.value)} /></div>
              <div>
                <Label htmlFor="s-currency">Default currency</Label>
                <Select id="s-currency" value={currency} onChange={(e) => setCurrency(e.target.value as CurrencyCode)}>
                  {CURRENCY_CODES.map((c) => <option key={c} value={c}>{c} — {CURRENCIES[c].label}</option>)}
                </Select>
              </div>
            </div>
            <div className="border-t pt-4">
              <h4 className="mb-3 text-sm font-semibold">Profile</h4>
              <div className="grid gap-4 sm:grid-cols-2">
                <div><Label htmlFor="s-name">Name</Label><Input id="s-name" value={name} maxLength={100} onChange={(e) => setName(e.target.value)} /></div>
                <div><Label htmlFor="s-email">Email</Label><Input id="s-email" value={app.profile.email || "demo@profitpilot.app"} readOnly disabled /></div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Button type="submit" loading={saving}>Save changes</Button>
              {message && <span role="status" className={`text-[13px] ${message.ok ? "text-positive" : "text-negative"}`}>{message.text}</span>}
            </div>
          </CardContent>
        </Card>
      </form>

      <Card>
        <CardHeader><div><CardTitle>Data</CardTitle><CardDescription>Export your orders or clear data from ProfitPilot.</CardDescription></div></CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div><div className="text-sm font-medium">Export data</div><div className="text-[13px] text-muted-foreground">Download all orders as a CSV in the import format.</div></div>
            <Button variant="outline" onClick={onExport} disabled={app.orders.length === 0}><Download /> Export CSV</Button>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-4">
            <div>
              <div className="text-sm font-medium">Demo data</div>
              <div className="text-[13px] text-muted-foreground">
                {app.isDemo ? "You're viewing the Demo Store. Hide it to see empty states instead." : app.demoHidden ? "Demo data is hidden. Restore it any time." : "Demo data appears only when you have no data of your own."}
              </div>
            </div>
            {app.isDemo ? (
              <Button variant="outline" onClick={() => app.setDemoHidden(true)}><Trash2 /> Delete demo data</Button>
            ) : app.demoHidden ? (
              <Button variant="outline" onClick={() => app.setDemoHidden(false)}>Restore demo data</Button>
            ) : null}
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-negative/30 p-4">
            <div><div className="text-sm font-medium">Delete all my data</div><div className="text-[13px] text-muted-foreground">Permanently removes your orders and products.</div></div>
            <Button variant="destructive" disabled={!app.orders.length && !app.products.length || app.isDemo} onClick={() => { setDeleteError(null); setConfirmDelete(true); }}>Delete everything</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle>Appearance</CardTitle><CardDescription>Choose how ProfitPilot looks.</CardDescription></div></CardHeader>
        <CardContent>
          <Segmented<Theme> label="Theme" value={theme} onChange={setTheme} options={[{ value: "light", label: "Light" }, { value: "dark", label: "Dark" }, { value: "system", label: "System" }]} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader><div><CardTitle>Account</CardTitle></div></CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => void app.signOut()}><LogOut /> {app.mode === "demo" ? "Exit demo" : "Log out"}</Button>
        </CardContent>
      </Card>

      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent title="Delete all data?" description="This can't be undone.">
          <p className="text-sm">All of your orders and products will be permanently deleted. Your account stays active.</p>
          {deleteError && <p role="alert" className="mt-3 text-[13px] text-negative">{deleteError}</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>Cancel</Button>
            <Button variant="destructive" loading={deleting} onClick={() => void onDelete()}>Delete everything</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
