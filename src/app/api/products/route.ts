import { NextResponse } from "next/server";
import { productInputSchema } from "@/lib/schemas";
import { apiError, requireSession } from "@/lib/data/server";
import { rowToProduct } from "@/lib/data/mappers";

export async function POST(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const parsed = productInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Please check the product details and try again.");

  const { data, error } = await session.supabase
    .from("products")
    .insert({ ...parsed.data, user_id: session.user.id })
    .select()
    .single();
  if (error) {
    console.error("[products] insert failed", error.message);
    return apiError(error.code === "23505" ? "You already have a product with that SKU." : "Couldn't save the product.", error.code === "23505" ? 409 : 500);
  }
  return NextResponse.json({ product: rowToProduct(data) });
}
