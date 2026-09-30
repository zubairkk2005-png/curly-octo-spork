import { NextResponse } from "next/server";
import { apiError, requireSession } from "@/lib/data/server";

/** Deletes all of the signed-in user's orders and products. */
export async function DELETE() {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const { supabase, user } = session;
  const orders = await supabase.from("orders").delete().eq("user_id", user.id);
  const products = await supabase.from("products").delete().eq("user_id", user.id);
  if (orders.error || products.error) {
    console.error("[data] delete failed", orders.error?.message, products.error?.message);
    return apiError("Couldn't delete your data. Please try again.", 500);
  }
  return NextResponse.json({ ok: true });
}
