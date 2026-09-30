"use client";

import { cn } from "@/lib/utils";

export function Segmented<T extends string>({
  value,
  onChange,
  options,
  label,
}: {
  value: T;
  onChange: (v: T) => void;
  options: { value: T; label: string }[];
  label: string;
}) {
  return (
    <div role="tablist" aria-label={label} className="inline-flex rounded-lg bg-muted p-0.5">
      {options.map((o) => (
        <button
          key={o.value}
          role="tab"
          aria-selected={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn(
            "rounded-md px-3 py-1 text-[13px] font-medium text-muted-foreground transition-colors focus-visible:outline-2 focus-visible:outline-ring",
            value === o.value && "bg-card text-foreground shadow-sm",
          )}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
