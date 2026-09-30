import { AlertTriangle } from "lucide-react";
import type { ReactNode } from "react";

export function ErrorState({ title = "Something went wrong", message, action }: { title?: string; message: string; action?: ReactNode }) {
  return (
    <div role="alert" className="flex flex-col items-center rounded-[var(--radius-card)] border bg-negative-bg/50 px-6 py-10 text-center">
      <AlertTriangle className="mb-3 size-6 text-negative" aria-hidden />
      <h3 className="text-[15px] font-semibold">{title}</h3>
      <p className="mt-1 max-w-md text-sm text-muted-foreground">{message}</p>
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
