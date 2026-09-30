import { IMPORT_FIELDS } from "./schema";

const SAMPLE_ROWS = [
  ["203-1234567-7654321", "2025-06-01", "Amazon", "PP-WR-001", "No-Drill Wardrobe Rail", "1", "24.99", "7.20", "3.75", "2.85", "1.40", "0.00", "GBP"],
  ["203-2345678-8765432", "2025-06-01", "Amazon", "PP-SS-003", "Electric Spin Scrubber", "2", "39.99", "14.50", "12.00", "4.50", "3.10", "0.00", "GBP"],
  ["12-34567-89012", "2025-06-02", "eBay", "PP-DF-002", "Telescopic Desk Fan", "1", "19.99", "6.40", "2.86", "2.40", "0.00", "19.99", "GBP"],
];

export const CSV_TEMPLATE = [IMPORT_FIELDS.join(","), ...SAMPLE_ROWS.map((r) => r.join(","))].join("\n") + "\n";

/** Prevent spreadsheet formula injection when exporting user-controlled text. */
export function csvSafe(value: string | number): string {
  let s = String(value);
  if (/^[=+\-@\t\r]/.test(s) && Number.isNaN(Number(s))) s = `'${s}`;
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}
