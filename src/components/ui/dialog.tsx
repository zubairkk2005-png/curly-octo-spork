"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import * as React from "react";
import { cn } from "@/lib/utils";

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

interface ContentProps extends React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  title: string;
  description?: string;
  /** "center" modal or right-hand "drawer" */
  variant?: "center" | "drawer";
}

export function DialogContent({ title, description, variant = "center", className, children, ...props }: ContentProps) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-black/40 backdrop-blur-[1px]" />
      <DialogPrimitive.Content
        className={cn(
          "fixed z-50 flex flex-col border bg-card shadow-xl outline-none",
          variant === "center"
            ? "left-1/2 top-1/2 max-h-[90vh] w-[calc(100vw-2rem)] max-w-lg -translate-x-1/2 -translate-y-1/2 rounded-2xl"
            : "inset-y-0 right-0 w-full max-w-md border-y-0 border-r-0 sm:max-w-lg",
          className,
        )}
        {...props}
      >
        <div className="flex items-start justify-between gap-4 border-b px-5 py-4">
          <div>
            <DialogPrimitive.Title className="text-base font-semibold tracking-tight">{title}</DialogPrimitive.Title>
            <DialogPrimitive.Description className={cn("mt-0.5 text-[13px] text-muted-foreground", !description && "sr-only")}>
              {description ?? title}
            </DialogPrimitive.Description>
          </div>
          <DialogPrimitive.Close className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Close">
            <X className="size-4" />
          </DialogPrimitive.Close>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-5">{children}</div>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
}
