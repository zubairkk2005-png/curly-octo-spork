"use client";

import { useCallback } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import type { AiAnswer } from "@/lib/ai/demo-response";

export interface AiResponse extends AiAnswer {
  source: "openai" | "demo";
  usingDemoData: boolean;
}

/** Returns a function that asks the server-side /api/ai route about the current range/currency. */
export function useAskAi() {
  const app = useAppData();
  const { mode, range, custom, currency, isDemo, orders } = app;

  return useCallback(
    async (
      mode_: "chat" | "insights",
      question?: string,
      history: { role: "user" | "assistant"; content: string }[] = [],
      signal?: AbortSignal,
    ): Promise<AiResponse> => {
      const res = await fetch("/api/ai", {
        method: "POST",
        signal,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: mode_,
          question,
          history,
          range,
          custom,
          currency,
          // Without Supabase the server can't see this browser's data, so send it along.
          orders: mode === "demo" && !isDemo ? orders : undefined,
        }),
      });
      const json = (await res.json().catch(() => ({}))) as Partial<AiResponse> & { error?: string };
      if (!res.ok || typeof json.answer !== "string") throw new Error(json.error ?? "The assistant couldn't answer just now.");
      return {
        answer: json.answer,
        highlights: json.highlights ?? [],
        followUps: json.followUps ?? [],
        source: json.source ?? "demo",
        usingDemoData: Boolean(json.usingDemoData),
      };
    },
    [mode, range, custom, currency, isDemo, orders],
  );
}
