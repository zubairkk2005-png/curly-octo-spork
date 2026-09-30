"use client";

import { CalendarDays, ChevronDown } from "lucide-react";
import { useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input, Label } from "@/components/ui/input";
import { RANGE_LABELS, dayKey } from "@/lib/dates";
import type { DateRangePreset } from "@/lib/types";
import { cn } from "@/lib/utils";

const PRESETS: DateRangePreset[] = ["today", "7d", "30d", "90d"];

export function DateRangePicker() {
  const { range, custom, setRange, now } = useAppData();
  const [open, setOpen] = useState(false);
  const today = dayKey(now);
  const [from, setFrom] = useState(custom?.from ?? dayKey(now - 29 * 86_400_000));
  const [to, setTo] = useState(custom?.to ?? today);
  const invalid = !from || !to || from > to;

  const label = range === "custom" && custom ? `${custom.from} → ${custom.to}` : RANGE_LABELS[range];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger className="inline-flex h-9 items-center gap-2 rounded-lg border border-input bg-card px-3 text-sm font-medium hover:bg-accent focus-visible:outline-2 focus-visible:outline-ring" aria-label="Date range">
          <CalendarDays className="size-4 text-muted-foreground" aria-hidden />
          <span className="max-w-40 truncate">{label}</span>
          <ChevronDown className="size-3.5 text-muted-foreground" aria-hidden />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {PRESETS.map((p) => (
            <DropdownMenuItem key={p} onSelect={() => setRange(p)} className={cn(range === p && "font-semibold")}>
              {RANGE_LABELS[p]}
            </DropdownMenuItem>
          ))}
          <DropdownMenuItem onSelect={() => setOpen(true)} className={cn(range === "custom" && "font-semibold")}>
            Custom…
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent title="Custom date range" description="Dates are in UTC.">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="range-from">From</Label>
              <Input id="range-from" type="date" value={from} max={to || today} onChange={(e) => setFrom(e.target.value)} />
            </div>
            <div>
              <Label htmlFor="range-to">To</Label>
              <Input id="range-to" type="date" value={to} min={from} max={today} onChange={(e) => setTo(e.target.value)} />
            </div>
          </div>
          {invalid && <p className="mt-2 text-[13px] text-negative">Choose a start date on or before the end date.</p>}
          <div className="mt-5 flex justify-end gap-2">
            <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
            <Button
              disabled={invalid}
              onClick={() => {
                setRange("custom", { from, to });
                setOpen(false);
              }}
            >
              Apply
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
