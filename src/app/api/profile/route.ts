import { NextResponse } from "next/server";
import { profileInputSchema } from "@/lib/schemas";
import { apiError, requireSession } from "@/lib/data/server";

export async function PUT(request: Request) {
  const session = await requireSession();
  if (session instanceof NextResponse) return session;
  const parsed = profileInputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Please check your details and try again.");
  const { error } = await session.supabase
    .from("profiles")
    .upsert({ id: session.user.id, ...parsed.data }, { onConflict: "id" });
  if (error) {
    console.error("[profile] update failed", error.message);
    return apiError("Couldn't save your settings.", 500);
  }
  return NextResponse.json({ ok: true });
}
