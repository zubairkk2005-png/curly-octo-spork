"use client";

import { Check } from "lucide-react";
import { Select } from "@/components/ui/input";
import { IMPORT_FIELDS, FIELD_LABELS, REQUIRED_FIELDS, type ImportField } from "@/lib/csv/schema";
import type { ColumnMapping } from "@/lib/csv/parse";

export function ColumnMappingEditor({ headers, mapping, onChange }: { headers: string[]; mapping: ColumnMapping; onChange: (m: ColumnMapping) => void }) {
  return (
    <div className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
      {IMPORT_FIELDS.map((field) => {
        const required = REQUIRED_FIELDS.includes(field);
        const value = mapping[field] ?? "";
        return (
          <div key={field} className="flex items-center gap-3">
            <label htmlFor={`map-${field}`} className="w-40 shrink-0 text-[13px]">
              <span className="font-medium">{FIELD_LABELS[field]}</span>
              {required ? <span className="text-negative" title="Required"> *</span> : <span className="text-muted-foreground"> (optional)</span>}
              <span className="block font-mono text-[11px] text-muted-foreground">{field}</span>
            </label>
            <div className="relative min-w-0 flex-1">
              <Select
                id={`map-${field}`}
                value={value}
                onChange={(e) => {
                  const next = { ...mapping };
                  if (e.target.value) next[field as ImportField] = e.target.value;
                  else delete next[field as ImportField];
                  onChange(next);
                }}
              >
                <option value="">— not mapped —</option>
                {headers.map((h) => <option key={h} value={h}>{h}</option>)}
              </Select>
            </div>
            <span className="w-4 shrink-0">{value && <Check className="size-4 text-positive" aria-label="Mapped" />}</span>
          </div>
        );
      })}
    </div>
  );
}
