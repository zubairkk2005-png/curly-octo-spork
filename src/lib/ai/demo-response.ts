import { formatCurrency, formatPercent } from "@/lib/currency";
import type { AiContext } from "./context";

export interface AiAnswer {
  answer: string;
  highlights: { label: string; value: string }[];
  followUps: string[];
}

export const SUGGESTED_QUESTIONS = [
  "Why did my profit change?",
  "Which products make me the most money?",
  "How much did I make this period?",
  "What is my average profit per order?",
  "Which products have the highest margin?",
  "How much did I spend on advertising?",
  "Which products have the most returns?",
];

const signed = (n: number | null) => (n === null ? "n/a" : `${n > 0 ? "+" : ""}${n.toFixed(1)}%`);

/** Rule-based answers computed from the same aggregated context the model would get. */
export function answerFromContext(question: string, ctx: AiContext): AiAnswer {
  const q = question.toLowerCase();
  const m = (n: number) => formatCurrency(n, ctx.currency);
  const c = ctx.current;
  const prev = ctx.previousPeriod;
  const ch = ctx.changeVsPreviousPercent;
  const period = `${ctx.period.from} to ${ctx.period.to}`;

  if (c.orders === 0) {
    return {
      answer: `There are no orders between ${period}, so there is nothing to analyse yet. Try a wider date range or import your orders.`,
      highlights: [],
      followUps: [],
    };
  }

  const products = ctx.topProducts;
  const has = (...words: string[]) => words.some((w) => q.includes(w));

  if (has("return", "refund")) {
    const byReturns = [...products].sort((a, b) => b.returnRatePercent - a.returnRatePercent);
    const top = byReturns.slice(0, 3);
    return {
      answer: `You refunded ${m(c.refunds)} across ${period} — a return rate of ${formatPercent(c.returnRatePercent)} of orders (${signed(ch.refunds)} in refund value vs the previous period). Highest return rates: ${top.map((p) => `${p.name} (${formatPercent(p.returnRatePercent)}, ${m(p.refunds)} refunded)`).join("; ")}.`,
      highlights: [
        { label: "Refunds", value: m(c.refunds) },
        { label: "Return rate", value: formatPercent(c.returnRatePercent) },
      ],
      followUps: ["Why did my profit change?"],
    };
  }

  if (has("advert", "ad spend", "ads", "ppc")) {
    const byAd = [...products].sort((a, b) => b.adSpend - a.adSpend).slice(0, 3);
    const adShare = c.revenue > 0 ? (c.adSpend / c.revenue) * 100 : 0;
    return {
      answer: `You spent ${m(c.adSpend)} on advertising in ${period} (${formatPercent(adShare)} of revenue), ${signed(ch.adSpend)} vs the previous period (${m(prev.adSpend)}) while revenue moved ${signed(ch.revenue)}. Biggest ad spend: ${byAd.map((p) => `${p.name} (${m(p.adSpend)})`).join("; ")}.`,
      highlights: [
        { label: "Ad spend", value: m(c.adSpend) },
        { label: "Ads / revenue", value: formatPercent(adShare) },
      ],
      followUps: ["Which products have the highest margin?"],
    };
  }

  if (has("margin")) {
    const byMargin = [...products].filter((p) => p.revenue > 0).sort((a, b) => b.marginPercent - a.marginPercent).slice(0, 3);
    return {
      answer: `Your overall margin is ${formatPercent(c.marginPercent)}. Highest-margin products: ${byMargin.map((p) => `${p.name} (${formatPercent(p.marginPercent)} on ${m(p.revenue)} revenue)`).join("; ")}.`,
      highlights: byMargin.map((p) => ({ label: p.name, value: formatPercent(p.marginPercent) })),
      followUps: ["Which products make me the most money?"],
    };
  }

  if (has("average", "per order")) {
    return {
      answer: `Across ${c.orders} orders you made ${m(c.netProfit)} net profit, which is ${m(c.averageProfitPerOrder)} per order on average (net profit ÷ orders). Average selling price per unit is ${m(c.averageSellingPrice)}.`,
      highlights: [{ label: "Avg profit / order", value: m(c.averageProfitPerOrder) }],
      followUps: ["Which products have the highest margin?"],
    };
  }

  if (has("marketplace", "amazon", "ebay")) {
    return {
      answer: ctx.marketplaces
        .map((k) => `${k.marketplace}: ${m(k.revenue)} revenue, ${m(k.netProfit)} profit (${formatPercent(k.marginPercent)} margin) from ${k.orders} orders`)
        .join(". ") + ".",
      highlights: ctx.marketplaces.map((k) => ({ label: k.marketplace, value: m(k.netProfit) })),
      followUps: [],
    };
  }

  if (has("why", "decrease", "drop", "increase", "change", "down", "up", "fell", "grew")) {
    const movers = products
      .filter((p) => p.netProfitChange !== null)
      .sort((a, b) => (a.netProfitChange ?? 0) - (b.netProfitChange ?? 0));
    const worst = movers[0];
    const best = movers[movers.length - 1];
    const direction = ch.netProfit === null ? "changed" : ch.netProfit >= 0 ? "increased" : "decreased";
    const parts: string[] = [
      `Net profit ${direction} ${ch.netProfit === null ? "" : `${Math.abs(ch.netProfit).toFixed(1)}% `}to ${m(c.netProfit)} (from ${m(prev.netProfit)}).`,
      `Revenue moved ${signed(ch.revenue)} and orders ${signed(ch.orders)}. Advertising moved ${signed(ch.adSpend)} and refunds ${signed(ch.refunds)}.`,
    ];
    if (ch.marginPercentagePoints !== null) parts.push(`Margin changed by ${ch.marginPercentagePoints.toFixed(1)} percentage points to ${formatPercent(c.marginPercent)}.`);
    if (best && (best.netProfitChange ?? 0) > 0) parts.push(`Biggest gain: ${best.name} (${m(best.netProfitChange ?? 0)} more profit).`);
    if (worst && (worst.netProfitChange ?? 0) < 0) parts.push(`Biggest drop: ${worst.name} (${m(worst.netProfitChange ?? 0)}).`);
    return {
      answer: parts.join(" "),
      highlights: [
        { label: "Net profit", value: m(c.netProfit) },
        { label: "vs previous", value: signed(ch.netProfit) },
      ],
      followUps: ["How much did I spend on advertising?", "Which products have the most returns?"],
    };
  }

  if (has("most money", "top", "best", "most profitable", "which product")) {
    const top = products.slice(0, 3);
    return {
      answer: `Most profitable products in ${period}: ${top.map((p, i) => `${i + 1}. ${p.name} — ${m(p.netProfit)} profit on ${m(p.revenue)} revenue (${formatPercent(p.marginPercent)} margin)`).join("; ")}.`,
      highlights: top.map((p) => ({ label: p.name, value: m(p.netProfit) })),
      followUps: ["Which products have the highest margin?"],
    };
  }

  if (has("how much", "make", "made", "earn", "profit", "revenue", "sales", "sold")) {
    return {
      answer: `For ${period} you sold ${m(c.revenue)} across ${c.orders} orders and made ${m(c.netProfit)} net profit (${formatPercent(c.marginPercent)} margin) after ${m(c.productCosts)} product costs, ${m(c.marketplaceFees)} fees, ${m(c.shipping)} shipping, ${m(c.adSpend)} ads and ${m(c.refunds)} refunds.`,
      highlights: [
        { label: "Revenue", value: m(c.revenue) },
        { label: "Net profit", value: m(c.netProfit) },
      ],
      followUps: ["Why did my profit change?"],
    };
  }

  return {
    answer: `Here's a quick overview of ${period}: ${m(c.revenue)} revenue from ${c.orders} orders and ${m(c.netProfit)} net profit (${formatPercent(c.marginPercent)} margin). Try asking about profit changes, top products, advertising or returns.`,
    highlights: [{ label: "Net profit", value: m(c.netProfit) }],
    followUps: SUGGESTED_QUESTIONS.slice(0, 3),
  };
}

export function insightFromContext(ctx: AiContext): AiAnswer {
  const m = (n: number) => formatCurrency(n, ctx.currency);
  const c = ctx.current;
  const ch = ctx.changeVsPreviousPercent;
  if (c.orders === 0) {
    return { answer: "No orders in this period yet. Import your data or widen the date range.", highlights: [], followUps: [] };
  }
  const top = ctx.topProducts[0];
  const sentences: string[] = [];
  if (ch.netProfit === null) sentences.push(`You made ${m(c.netProfit)} net profit this period.`);
  else sentences.push(`Your profit ${ch.netProfit >= 0 ? "increased" : "decreased"} ${Math.abs(ch.netProfit).toFixed(1)}% this period to ${m(c.netProfit)}.`);
  if (top) sentences.push(`The biggest contributor was ${top.name}, which generated ${m(top.netProfit)} in net profit.`);
  if (ch.adSpend !== null && ch.revenue !== null) {
    sentences.push(`Advertising costs ${ch.adSpend >= 0 ? "increased" : "decreased"} ${Math.abs(ch.adSpend).toFixed(1)}%, while revenue ${ch.revenue >= 0 ? "increased" : "decreased"} ${Math.abs(ch.revenue).toFixed(1)}%.`);
  }
  return { answer: sentences.join(" "), highlights: [], followUps: [] };
}
