"use client";

import { CheckCircle2, Download, FileSpreadsheet, RotateCcw } from "lucide-react";
import Link from "next/link";
import Papa from "papaparse";
import { useMemo, useState } from "react";
import { useAppData } from "@/components/providers/app-data-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { autoMapColumns, missingRequiredFields, FIELD_LABELS } from "@/lib/csv/schema";
import { parseCsvText, validateFile, validateRows, type ColumnMapping, type ParsedCsv, type RowError } from "@/lib/csv/parse";
import { CSV_TEMPLATE } from "@/lib/csv/template";
import { downloadText } from "@/lib/download";
import { ColumnMappingEditor } from "./column-mapping";
import { ImportDropzone } from "./import-dropzone";
import { ImportErrors, ImportPreview } from "./import-preview";

type Stage =
  | { name: "upload" }
  | { name: "review"; fileName: string; parsed: ParsedCsv; mapping: ColumnMapping }
  | { name: "importing"; count: number }
  | { name: "done"; imported: number; errors: RowError[]; fileName: string };

export function ImportWizard() {
  const { products, currency, importOrders, ready } = useAppData();
  const [stage, setStage] = useState<Stage>({ name: "upload" });
  const [error, setError] = useState<string | null>(null);
  const [showMapping, setShowMapping] = useState(false);

  async function handleFile(file: File) {
    setError(null);
    const problem = validateFile(file);
    if (problem) return setError(problem);
    try {
      const parsed = parseCsvText(await file.text());
      const mapping = autoMapColumns(parsed.headers);
      setShowMapping(missingRequiredFields(mapping).length > 0);
      setStage({ name: "review", fileName: file.name, parsed, mapping });
    } catch (err) {
      setError(err instanceof Error ? err.message : "We couldn't read that file. Is it a valid CSV?");
    }
  }

  const reset = () => { setStage({ name: "upload" }); setError(null); };

  return (
    <div className="space-y-6">
      {stage.name === "upload" && (
        <>
          <ImportDropzone onFile={(f) => void handleFile(f)} error={error} disabled={!ready} />
          <Card>
            <CardHeader>
              <div>
                <CardTitle>Not sure about the format?</CardTitle>
                <CardDescription>Download the template, paste in your orders, and upload it. Other column names can be mapped in the next step.</CardDescription>
              </div>
              <Button variant="outline" onClick={() => downloadText("profitpilot-orders-template.csv", CSV_TEMPLATE)}><Download /> Download CSV template</Button>
            </CardHeader>
            <CardContent>
              <p className="text-[13px] text-muted-foreground">
                Columns: <span className="font-mono text-xs">order_id, order_date, marketplace, sku, product_name, quantity, sale_price, product_cost, marketplace_fee, shipping_cost, ad_cost, refund_amount, currency</span>.
                Product cost and sale price are per unit; fees, shipping, ads and refunds are totals for the order line.
              </p>
            </CardContent>
          </Card>
        </>
      )}

      {stage.name === "review" && (
        <Review
          stage={stage}
          showMapping={showMapping}
          setShowMapping={setShowMapping}
          onMapping={(mapping) => setStage({ ...stage, mapping })}
          products={products}
          currency={currency}
          onCancel={reset}
          onImport={async (valid, errors) => {
            setStage({ name: "importing", count: valid.length });
            const res = await importOrders(valid.map((v) => v.data));
            if (res.ok) setStage({ name: "done", imported: res.imported ?? valid.length, errors, fileName: stage.fileName });
            else {
              setError(res.error ?? "The import failed. Please try again.");
              setStage(stage);
            }
          }}
          error={error}
        />
      )}

      {stage.name === "importing" && (
        <Card className="px-6 py-14 text-center" role="status" aria-live="polite">
          <div className="mx-auto h-1.5 w-64 max-w-full overflow-hidden rounded-full bg-muted"><div className="pp-skeleton h-full w-full" /></div>
          <p className="mt-5 text-[15px] font-semibold">Importing {stage.count.toLocaleString("en-GB")} orders…</p>
          <p className="mt-1 text-sm text-muted-foreground">Please keep this page open.</p>
        </Card>
      )}

      {stage.name === "done" && <Done stage={stage} onAnother={reset} />}
    </div>
  );
}

function Review({ stage, showMapping, setShowMapping, onMapping, products, currency, onCancel, onImport, error }: {
  stage: Extract<Stage, { name: "review" }>;
  showMapping: boolean;
  setShowMapping: (v: boolean) => void;
  onMapping: (m: ColumnMapping) => void;
  products: ReturnType<typeof useAppData>["products"];
  currency: ReturnType<typeof useAppData>["currency"];
  onCancel: () => void;
  onImport: (valid: ReturnType<typeof validateRows>["valid"], errors: RowError[]) => Promise<void>;
  error: string | null;
}) {
  const { parsed, mapping, fileName } = stage;
  const [busy, setBusy] = useState(false);
  const missing = missingRequiredFields(mapping);
  const result = useMemo(
    () => (missing.length === 0 ? validateRows(parsed, mapping, { defaultCurrency: currency, products }) : { valid: [], errors: [] as RowError[] }),
    [parsed, mapping, currency, products, missing.length],
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-lg bg-muted"><FileSpreadsheet className="size-5" /></div>
            <div>
              <CardTitle>{fileName}</CardTitle>
              <CardDescription>{parsed.rows.length.toLocaleString("en-GB")} rows · {parsed.headers.length} columns</CardDescription>
            </div>
          </div>
          <Button variant="ghost" size="sm" onClick={onCancel}><RotateCcw /> Choose another file</Button>
        </CardHeader>
        <CardContent>
          <button className="text-[13px] font-medium underline underline-offset-2" onClick={() => setShowMapping(!showMapping)}>
            {showMapping ? "Hide column mapping" : "Review column mapping"}
          </button>
          {missing.length > 0 && (
            <p role="alert" className="mt-2 text-[13px] text-negative">Map these required fields to continue: {missing.map((f) => FIELD_LABELS[f]).join(", ")}.</p>
          )}
          {showMapping && (
            <div className="mt-4 rounded-xl border p-4">
              <ColumnMappingEditor headers={parsed.headers} mapping={mapping} onChange={onMapping} />
            </div>
          )}
        </CardContent>
      </Card>

      {missing.length === 0 && (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Ready to import" value={result.valid.length} tone="positive" />
            <Stat label="Need attention" value={result.errors.length} tone={result.errors.length ? "negative" : "neutral"} />
            <Stat label="Total rows" value={parsed.rows.length} tone="neutral" />
          </div>
          {result.valid.length > 0 && <ImportPreview valid={result.valid} />}
          <ImportErrors errors={result.errors} />
          {error && <p role="alert" className="text-sm text-negative">{error}</p>}
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[13px] text-muted-foreground">
              {result.errors.length > 0 ? `Rows that need attention will be skipped. Existing orders with the same marketplace, order ID and SKU are updated.` : `Existing orders with the same marketplace, order ID and SKU are updated.`}
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={onCancel}>Cancel</Button>
              <Button loading={busy} disabled={result.valid.length === 0} onClick={async () => { setBusy(true); await onImport(result.valid, result.errors); setBusy(false); }}>
                Import {result.valid.length.toLocaleString("en-GB")} order{result.valid.length === 1 ? "" : "s"}
              </Button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

function Stat({ label, value, tone }: { label: string; value: number; tone: "positive" | "negative" | "neutral" }) {
  const color = tone === "positive" ? "text-positive" : tone === "negative" ? "text-negative" : "";
  return (
    <Card className="p-4">
      <div className="text-[13px] text-muted-foreground">{label}</div>
      <div className={`mt-1 text-2xl font-semibold tabular ${color}`}>{value.toLocaleString("en-GB")}</div>
    </Card>
  );
}

function Done({ stage, onAnother }: { stage: Extract<Stage, { name: "done" }>; onAnother: () => void }) {
  const { imported, errors } = stage;
  const partial = errors.length > 0;
  return (
    <div className="space-y-6">
      <Card className="px-6 py-10 text-center" role="status">
        <CheckCircle2 className="mx-auto size-10 text-positive" aria-hidden />
        <h3 className="mt-4 text-lg font-semibold">
          {partial ? `${imported.toLocaleString("en-GB")} imported successfully, ${errors.length.toLocaleString("en-GB")} row${errors.length === 1 ? "" : "s"} need attention` : `Successfully imported ${imported.toLocaleString("en-GB")} orders.`}
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">Your dashboard now reflects this data.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <Button asChild><Link href="/dashboard">View dashboard</Link></Button>
          <Button variant="outline" onClick={onAnother}>Import another file</Button>
        </div>
      </Card>
      {partial && (
        <>
          <ImportErrors errors={errors} />
          <Button
            variant="outline"
            onClick={() =>
              downloadText(
                "profitpilot-rows-needing-attention.csv",
                Papa.unparse(errors.map((e) => ({ line: e.line, problems: e.messages.join("; "), ...e.raw })), { escapeFormulae: true }),
              )
            }
          >
            <Download /> Download rows that need attention
          </Button>
        </>
      )}
    </div>
  );
}
