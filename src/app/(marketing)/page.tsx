import { ArrowRight, BarChart3, Layers, MessageSquareText, ReceiptText, Upload } from "lucide-react";
import Link from "next/link";
import { currentTime } from "@/lib/dates";
import { DashboardPreview } from "@/components/marketing/dashboard-preview";
import { Logo } from "@/components/layout/logo";
import { Button } from "@/components/ui/button";

const FEATURES = [
  {
    icon: BarChart3,
    title: "Know your real profit",
    body: "Revenue is only the start. ProfitPilot subtracts product costs, marketplace fees, shipping, advertising and refunds so the number you see is the number you keep.",
  },
  {
    icon: ReceiptText,
    title: "Understand every order",
    body: "Open any order to see exactly where the money went — revenue, each cost line, net profit and margin — so a loss-making sale never hides in the average.",
  },
  {
    icon: Layers,
    title: "Find your most profitable products",
    body: "Rank products by profit and margin, not just sales. Spot the ones with high returns or heavy ad spend before they quietly eat your margin.",
  },
  {
    icon: MessageSquareText,
    title: "Ask AI about your business",
    body: "Ask “why did my profit change?” and get an answer built from your own aggregated numbers. The assistant is told to use only the data it's given.",
  },
];

const STEPS = [
  { icon: Upload, title: "Import", body: "Upload a CSV of your orders. Map columns if yours are named differently." },
  { icon: BarChart3, title: "Calculate", body: "Profit is calculated per order with one consistent formula." },
  { icon: MessageSquareText, title: "Ask why", body: "See the dashboard, then ask AI what moved your profit." },
];

export const revalidate = 3600;

export default function LandingPage() {
  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b bg-background/85 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><a href="#how-it-works">How it works</a></Button>
            <Button asChild variant="ghost" size="sm"><Link href="/login">Log in</Link></Button>
            <Button asChild size="sm"><Link href="/signup">Start for free</Link></Button>
          </nav>
        </div>
      </header>

      <main>
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-6xl">Know your real profit.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-balance text-lg text-muted-foreground">
              ProfitPilot turns your Amazon and eBay sales data into a clear picture of revenue, costs, and real profit.
            </p>
            <div className="mt-8 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg"><Link href="/signup">Start for free <ArrowRight /></Link></Button>
              <Button asChild size="lg" variant="outline"><a href="#how-it-works">See how it works</a></Button>
            </div>
          </div>
          <div className="mx-auto mt-14 max-w-4xl"><DashboardPreview now={currentTime()} /></div>
          <p className="mt-3 text-center text-xs text-muted-foreground">Preview uses sample data from the built-in Demo Store.</p>
        </section>

        <section id="how-it-works" className="border-y bg-card/50">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-center text-2xl font-semibold tracking-tight">Import → Calculate → See → Ask why</h2>
            <div className="mt-10 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s, i) => (
                <div key={s.title} className="rounded-2xl border bg-card p-6">
                  <div className="flex items-center gap-3"><span className="flex size-8 items-center justify-center rounded-lg bg-muted"><s.icon className="size-4" /></span><span className="text-xs text-muted-foreground">Step {i + 1}</span></div>
                  <h3 className="mt-4 font-semibold">{s.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="grid gap-x-12 gap-y-12 md:grid-cols-2">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <span className="mt-1 flex size-10 shrink-0 items-center justify-center rounded-xl border bg-card"><f.icon className="size-5" /></span>
                <div>
                  <h3 className="text-lg font-semibold tracking-tight">{f.title}</h3>
                  <p className="mt-2 text-muted-foreground">{f.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 pb-24 sm:px-6">
          <div className="rounded-3xl border bg-muted px-6 py-14 text-center">
            <h2 className="text-3xl font-semibold tracking-tight">See what you actually make.</h2>
            <p className="mx-auto mt-3 max-w-lg text-muted-foreground">Try the Demo Store first, then import your own orders when you&apos;re ready.</p>
            <Button asChild size="lg" className="mt-7"><Link href="/signup">Start for free</Link></Button>
          </div>
        </section>
      </main>

      <footer className="border-t">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-6 text-[13px] text-muted-foreground sm:px-6">
          <span>© {new Date().getFullYear()} ProfitPilot</span>
          <span>Figures are calculated from the data you import. ProfitPilot does not provide tax or financial advice.</span>
        </div>
      </footer>
    </div>
  );
}
