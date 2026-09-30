import { NextResponse } from "next/server";
import { z } from "zod";
import { productInputSchema } from "@/lib/schemas";
import { apiError, requireSession } from "@/lib/data/server";
import { rowToProduct } from "@/lib/data/mappers";

const idSchema = z.string().uuid();

export async function PUT(request: Request, ctx: RouteContext<"/api/products/[id]">) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const id = idSchema.safeParse((await ctx.params).id);
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!id.success || !parsed.success) return apiError("Please check the product details and try again.");

  const { data, error } = await session.supabase
    .from("products")
    .update(parsed.data)
    .eq("id", id.data)
    .eq("user_id", session.user.id)
    .select()
    .single();
  if (error) {
    console.error("[products] update failed", error.message);
    return apiError(error.code === "23505" ? "You already have a product with that SKU." : "Couldn't save the product.", error.code === "23505" ? 409 : 500);
  }
  return NextResponse.json({ product: rowToProduct(data) });
}

export async function DELETE(_request: Request, ctx: RouteContext<"/api/products/[id]">) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const id = idSchema.safeParse((await ctx.params).id);
  if (!id.success) return apiError("Unknown product.");
  const { error } = await session.supabase.from("products").delete().eq("id", id.data).eq("user_id", session.user.id);
  if (error) {
    console.error("[products] delete failed", error.message);
    return apiError("Couldn't delete the product.", 500);
  }
  return NextResponse.json({ ok: true });
}
