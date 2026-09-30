"use client";

import { RefreshCw, Sparkles } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useAskAi, type AiResponse } from "@/hooks/use-ai";

export function AIInsightCard() {
  const { ready, range, custom, currency, analytics } = useAppData();
  const ask = useAskAi();
  const [state, setState] = useState<{ status: "loading" | "ok" | "error"; data?: AiResponse }>({ status: "loading" });
  const hasOrders = analytics.summary.orders > 0;

  const load = useCallback(
    async (signal?: AbortSignal) => {
      setState((s) => ({ status: "loading", data: s.data }));
      try {
        const data = await ask("insights", undefined, [], signal);
        setState({ status: "ok", data });
      } catch (err) {
        if ((err as Error).name === "AbortError") return;
        setState({ status: "error" });
      }
    },
    [ask],
  );

  useEffect(() => {
    if (!ready || !hasOrders) return;
    const controller = new AbortController();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load(controller.signal);
    return () => controller.abort();
    // re-run when the period, currency or underlying data changes
  }, [ready, hasOrders, range, custom, currency, analytics.summary.netProfit, load]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Sparkles className="size-4 text-chart-orders" aria-hidden /> AI insights
        </CardTitle>
        <div className="flex items-center gap-2">
          {state.data?.source === "demo" && <Badge variant="outline" title="Add OPENAI_API_KEY to use the AI model">Demo summary</Badge>}
          <Button variant="ghost" size="icon" aria-label="Refresh insight" disabled={state.status === "loading" || !hasOrders} onClick={() => void load()}>
            <RefreshCw className={state.status === "loading" ? "animate-spin" : ""} />
          </Button>
        </div>
      </CardHeader>
      <div className="px-5 pb-5" aria-live="polite">
        {!hasOrders ? (
          <p className="text-sm text-muted-foreground">No orders in this period. Widen the date range or import your data to get insights.</p>
        ) : state.status === "loading" && !state.data ? (
          <div className="space-y-2" aria-busy="true">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-11/12" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : state.status === "error" ? (
          <p className="text-sm text-muted-foreground">We couldn&apos;t generate an insight right now. <button className="font-medium text-foreground underline" onClick={() => void load()}>Try again</button></p>
        ) : (
          <p className={`text-[15px] leading-relaxed ${state.status === "loading" ? "opacity-50" : ""}`}>{state.data?.answer}</p>
        )}
      </div>
    </Card>
  );
}
