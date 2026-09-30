"use client";

import * as Primitive from "@radix-ui/react-dropdown-menu";
import * as React from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Primitive.Root;
export const DropdownMenuTrigger = Primitive.Trigger;

export function DropdownMenuContent({ className, sideOffset = 6, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Content>) {
  return (
    <Primitive.Portal>
      <Primitive.Content
        sideOffset={sideOffset}
        className={cn("z-50 min-w-48 rounded-xl border bg-card p-1 shadow-lg", className)}
        {...props}
      />
    </Primitive.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Item>) {
  return (
    <Primitive.Item
      className={cn("flex cursor-pointer items-center gap-2 rounded-lg px-2.5 py-2 text-sm outline-none data-[highlighted]:bg-accent [&_svg]:size-4 [&_svg]:text-muted-foreground", className)}
      {...props}
    />
  );
}

export function DropdownMenuLabel({ className, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Label>) {
  return <Primitive.Label className={cn("px-2.5 py-1.5 text-xs text-muted-foreground", className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }: React.ComponentPropsWithoutRef<typeof Primitive.Separator>) {
  return <Primitive.Separator className={cn("my-1 h-px bg-border", className)} {...props} />;
}
