import { NextResponse } from "next/server";
import { z } from "zod";
import { validatedOrderSchema } from "@/lib/csv/schema";
import { MAX_ROWS } from "@/lib/csv/parse";
import { apiError, requireSession } from "@/lib/data/server";

const bodySchema = z.object({ orders: z.array(z.unknown()).min(1).max(MAX_ROWS) });

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { supabase, user } = session;

  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return apiError("Invalid request.");
  }
  const body = bodySchema.safeParse(json);
  if (!body.success) return apiError("No orders to import.");

  // Never trust the client: re-validate every row on the server.
  const rows: z.infer<typeof validatedOrderSchema>[] = [];
  const rejected: number[] = [];
  const seen = new Set<string>();
  body.data.orders.forEach((raw, i) => {
    const parsed = validatedOrderSchema.safeParse(raw);
    if (!parsed.success) return rejected.push(i);
    const key = `${parsed.data.marketplace}|${parsed.data.order_id}|${parsed.data.sku}`.toLowerCase();
    if (seen.has(key)) return rejected.push(i);
    seen.add(key);
    rows.push(parsed.data);
  });
  if (rows.length === 0) return apiError("None of the rows passed validation.");

  const dbRows = rows.map((r) => ({
    user_id: user.id,
    external_order_id: r.order_id,
    marketplace: r.marketplace,
    order_date: r.order_date,
    sku: r.sku,
    product_name: r.product_name,
    quantity: r.quantity,
    sale_price: r.sale_price,
    product_cost: r.product_cost,
    marketplace_fee: r.marketplace_fee,
    shipping_cost: r.shipping_cost,
    ad_cost: r.ad_cost,
    refund_amount: r.refund_amount,
    currency: r.currency,
  }));

  try {
    for (let i = 0; i < dbRows.length; i += 500) {
      const { error } = await supabase
        .from("orders")
        .upsert(dbRows.slice(i, i + 500), { onConflict: "user_id,marketplace,external_order_id,sku" });
      if (error) throw error;
    }

    // Register products we haven't seen yet, using the file's costs as defaults.
    const { data: existing, error: exErr } = await supabase.from("products").select("sku");
    if (exErr) throw exErr;
    const known = new Set((existing ?? []).map((p) => String(p.sku).toLowerCase()));
    const fresh = new Map<string, (typeof dbRows)[number]>();
    for (const r of dbRows) if (!known.has(r.sku.toLowerCase()) && !fresh.has(r.sku.toLowerCase())) fresh.set(r.sku.toLowerCase(), r);
    if (fresh.size > 0) {
      const { error } = await supabase.from("products").upsert(
        [...fresh.values()].map((r) => ({
          user_id: user.id,
          sku: r.sku,
          name: r.product_name || r.sku,
          marketplace: r.marketplace,
          product_cost: r.product_cost,
          default_shipping_cost: r.shipping_cost,
          default_fee: r.marketplace_fee,
          default_ad_cost: r.ad_cost,
        })),
        { onConflict: "user_id,sku", ignoreDuplicates: true },
      );
      if (error) throw error;
    }
  } catch (err) {
    console.error("[import] failed", err);
    return apiError("We couldn't save your orders. Nothing was lost — please try again.", 500);
  }

  return NextResponse.json({ imported: rows.length, rejected: rejected.length });
}
