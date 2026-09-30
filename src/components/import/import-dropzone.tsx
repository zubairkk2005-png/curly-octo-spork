"use client";

import { FileSpreadsheet, UploadCloud } from "lucide-react";
import { useRef, useState, type DragEvent } from "react";
import { cn } from "@/lib/utils";

export function ImportDropzone({ onFile, disabled, error }: { onFile: (file: File) => void; disabled?: boolean; error?: string | null }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);

  function onDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    if (file) onFile(file);
  }

  return (
    <div>
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "flex flex-col items-center justify-center rounded-[var(--radius-card)] border-2 border-dashed bg-card px-6 py-14 text-center transition-colors",
          dragging ? "border-ring bg-accent" : "border-input",
          disabled && "opacity-60",
        )}
      >
        <div className="mb-4 flex size-12 items-center justify-center rounded-xl bg-muted">
          {dragging ? <FileSpreadsheet className="size-6" /> : <UploadCloud className="size-6 text-muted-foreground" />}
        </div>
        <p className="text-base font-semibold">Drop your order CSV here</p>
        <p className="mt-1 text-sm text-muted-foreground">or <button type="button" disabled={disabled} className="font-medium text-foreground underline underline-offset-2" onClick={() => inputRef.current?.click()}>browse files</button> · .csv up to 5 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          className="sr-only"
          aria-label="Upload order CSV"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onFile(f);
            e.target.value = "";
          }}
        />
      </div>
      {error && <p role="alert" className="mt-3 text-sm text-negative">{error}</p>}
    </div>
  );
}
