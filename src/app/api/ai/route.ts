import { NextResponse } from "next/server";
import { z } from "zod";
import { computeAnalytics } from "@/lib/analytics";
import { buildAiContext } from "@/lib/ai/context";
import { answerFromContext, insightFromContext, type AiAnswer } from "@/lib/ai/demo-response";
import { askOpenAI } from "@/lib/ai/openai";
import { generateDemoOrders } from "@/lib/demo-data";
import { apiError, fetchOrders, getSession } from "@/lib/data/server";
import { isOpenAIConfigured, isSupabaseConfigured } from "@/lib/env";
import { rateLimit } from "@/lib/rate-limit";
import { orderSchema } from "@/lib/schemas";
import { CURRENCY_CODES, type Order } from "@/lib/types";

const bodySchema = z.object({
  mode: z.enum(["chat", "insights"]),
  question: z.string().trim().max(500).optional(),
  history: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().max(1500) }))
    .max(6)
    .default([]),
  range: z.enum(["today", "7d", "30d", "90d", "custom"]),
  custom: z.object({ from: z.string().max(10), to: z.string().max(10) }).nullable().optional(),
  currency: z.enum(CURRENCY_CODES),
  /** Only honoured in demo mode (no Supabase), where the server can't see the browser's local data. */
  orders: z.array(orderSchema).max(20_000).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return apiError("Please ask a shorter question (up to 500 characters).");
  const body = parsed.data;
  if (body.mode === "chat" && !body.question) return apiError("Please type a question.");

  // 1. authenticate + 2. retrieve the user's data
  let orders: Order[];
  try {
    if (isSupabaseConfigured()) {
      const session = await getSession();
      if (!session) return apiError("Please sign in again.", 401);
      if (!rateLimit(`ai:${session.user.id}`)) return apiError("You're asking too quickly. Please wait a moment.", 429);
      orders = await fetchOrders(session.supabase);
    } else {
      const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
      if (!rateLimit(`ai:${ip}`, 60)) return apiError("You're asking too quickly. Please wait a moment.", 429);
      orders = body.orders ?? [];
    }
  } catch (err) {
    console.error("[ai] failed to load orders", err);
    return apiError("We couldn't load your data just now. Please try again.", 500);
  }
  const usingDemoData = orders.length === 0;
  if (usingDemoData) orders = generateDemoOrders();

  // 3. aggregate + 4. build structured context
  const analytics = computeAnalytics(orders, {
    range: body.range,
    custom: body.custom ?? null,
    currency: body.currency,
    now: Date.now(),
  });
  const context = buildAiContext(analytics, usingDemoData);
  const question = body.question ?? "";

  // 5. send only the aggregates to the model; fall back to local answers
  const fallback = (): AiAnswer =>
    body.mode === "insights" ? insightFromContext(context) : answerFromContext(question, context);

  if (!isOpenAIConfigured()) {
    return NextResponse.json({ ...fallback(), source: "demo", usingDemoData });
  }
  try {
    const answer = await askOpenAI({ mode: body.mode, question, history: body.history, context });
    return NextResponse.json({ ...answer, source: "openai", usingDemoData });
  } catch (err) {
    console.error("[ai] OpenAI call failed", err instanceof Error ? err.message : err);
    return NextResponse.json({ ...fallback(), source: "demo", usingDemoData });
  }
}
