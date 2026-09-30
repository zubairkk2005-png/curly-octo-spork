"use client";

import { Send, Sparkles, User } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAskAi, type AiResponse } from "@/hooks/use-ai";
import { SUGGESTED_QUESTIONS } from "@/lib/ai/demo-response";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "assistant";
  content: string;
  highlights?: AiResponse["highlights"];
  followUps?: string[];
  source?: AiResponse["source"];
  error?: boolean;
}

export function AIChat({ className }: { className?: string }) {
  const { ready } = useAppData();
  const ask = useAskAi();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const idRef = useRef(0);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, loading]);

  async function send(question: string) {
    const q = question.trim();
    if (!q || loading) return;
    const history = messages.filter((m) => !m.error).slice(-6).map((m) => ({ role: m.role, content: m.content }));
    setMessages((m) => [...m, { id: ++idRef.current, role: "user", content: q }]);
    setInput("");
    setLoading(true);
    try {
      const r = await ask("chat", q, history);
      setMessages((m) => [...m, { id: ++idRef.current, role: "assistant", content: r.answer, highlights: r.highlights, followUps: r.followUps, source: r.source }]);
    } catch (err) {
      setMessages((m) => [...m, { id: ++idRef.current, role: "assistant", error: true, content: err instanceof Error ? err.message : "Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    void send(input);
  }

  return (
    <Card className={cn("flex min-h-[520px] flex-col", className)}>
      <div className="flex-1 space-y-5 overflow-y-auto p-5" aria-live="polite">
        {messages.length === 0 && (
          <div className="flex h-full flex-col items-center justify-center py-8 text-center">
            <div className="mb-3 flex size-11 items-center justify-center rounded-xl bg-muted"><Sparkles className="size-5 text-chart-orders" /></div>
            <h3 className="text-[15px] font-semibold">Ask about your business</h3>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">Answers use your real numbers for the selected date range — nothing is invented.</p>
            <div className="mt-5 flex max-w-xl flex-wrap justify-center gap-2">
              {SUGGESTED_QUESTIONS.map((q) => (
                <button key={q} disabled={!ready} onClick={() => void send(q)} className="rounded-full border bg-card px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-50">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={cn("flex gap-3", m.role === "user" && "justify-end")}>
            {m.role === "assistant" && <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted"><Sparkles className="size-3.5 text-chart-orders" /></div>}
            <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed", m.role === "user" ? "bg-primary text-primary-foreground" : m.error ? "bg-negative-bg text-negative" : "bg-muted")}>
              <p className="whitespace-pre-wrap">{m.content}</p>
              {m.highlights && m.highlights.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.highlights.map((h) => (
                    <span key={h.label} className="rounded-lg border bg-card px-2.5 py-1 text-xs"><span className="text-muted-foreground">{h.label}</span> <b className="tabular">{h.value}</b></span>
                  ))}
                </div>
              )}
              {m.source === "demo" && <Badge variant="outline" className="mt-3">Demo response — add OPENAI_API_KEY for AI answers</Badge>}
              {m.followUps && m.followUps.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {m.followUps.map((f) => (
                    <button key={f} onClick={() => void send(f)} className="rounded-full border bg-card px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground">{f}</button>
                  ))}
                </div>
              )}
            </div>
            {m.role === "user" && <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted"><User className="size-3.5" /></div>}
          </div>
        ))}
        {loading && (
          <div className="flex gap-3" role="status" aria-label="Thinking">
            <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-full bg-muted"><Sparkles className="size-3.5 text-chart-orders" /></div>
            <div className="flex items-center gap-1 rounded-2xl bg-muted px-4 py-3">
              {[0, 1, 2].map((i) => <span key={i} className="size-1.5 animate-pulse rounded-full bg-muted-foreground" style={{ animationDelay: `${i * 150}ms` }} />)}
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>
      <form onSubmit={onSubmit} className="flex gap-2 border-t p-3">
        <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask e.g. “Why did my profit change?”" maxLength={500} aria-label="Your question" disabled={!ready} />
        <Button type="submit" loading={loading} disabled={!input.trim() || !ready}><Send /> <span className="hidden sm:inline">Ask</span></Button>
      </form>
    </Card>
  );
}
