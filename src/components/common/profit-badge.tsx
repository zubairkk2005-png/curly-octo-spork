import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatDelta, formatPercent } from "@/lib/currency";

/** Percent margin or period-over-period delta, coloured by sign. */
export function ProfitBadge({
  value,
  kind = "margin",
  invert,
  unit = "%",
}: {
  value: number | null;
  kind?: "margin" | "delta";
  /** when true, an increase is bad (costs, refunds) */
  invert?: boolean;
  unit?: "%" | " pts";
}) {
  if (value === null || !Number.isFinite(value)) return <Badge variant="neutral">—</Badge>;
  const good = invert ? value < 0 : value > 0;
  const bad = invert ? value > 0 : value < 0;
  const variant = kind === "margin" ? (value < 0 ? "negative" : value < 10 ? "warning" : "positive") : good ? "positive" : bad ? "negative" : "neutral";
  const Icon = kind === "delta" ? (value > 0 ? ArrowUpRight : value < 0 ? ArrowDownRight : Minus) : null;
  return (
    <Badge variant={variant}>
      {Icon && <Icon className="size-3" aria-hidden />}
      {kind === "delta" ? formatDelta(value, unit) : formatPercent(value)}
    </Badge>
  );
}
