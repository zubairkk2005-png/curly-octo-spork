import { cva, type VariantProps } from "class-variance-authority";
import * as React from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva("inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-xs font-medium tabular", {
  variants: {
    variant: {
      neutral: "bg-muted text-muted-foreground",
      positive: "bg-positive-bg text-positive",
      negative: "bg-negative-bg text-negative",
      warning: "bg-warning-bg text-warning",
      outline: "border text-muted-foreground",
    },
  },
  defaultVariants: { variant: "neutral" },
});

export function Badge({ className, variant, ...props }: React.HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
