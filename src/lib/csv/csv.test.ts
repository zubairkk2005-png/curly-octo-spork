import { describe, expect, it } from "vitest";
import { parseCsvText, validateRows, validateFile } from "./parse";
import { autoMapColumns, parseDate, parseMoney, sanitizeText } from "./schema";
import { CSV_TEMPLATE, csvSafe } from "./template";

const opts = { defaultCurrency: "GBP" as const, products: [] };

describe("csv validation", () => {
  it("accepts the bundled template", () => {
    const parsed = parseCsvText(CSV_TEMPLATE);
    const res = validateRows(parsed, autoMapColumns(parsed.headers), opts);
    expect(res.errors).toEqual([]);
    expect(res.valid).toHaveLength(3);
    expect(res.valid[2].data.refund_amount).toBe(19.99);
  });

  it("auto-maps differently named columns", () => {
    const m = autoMapColumns(["Order ID", "Item Price", "Qty", "Date", "SKU", "Cost"]);
    expect(m.order_id).toBe("Order ID");
    expect(m.sale_price).toBe("Item Price");
    expect(m.quantity).toBe("Qty");
    expect(m.order_date).toBe("Date");
    expect(m.product_cost).toBe("Cost");
  });

  it("reports bad rows with messages instead of accepting them", () => {
    const csv = [
      "order_id,order_date,sku,quantity,sale_price,product_cost",
      "1,2025-01-01,A,1,10,4",
      "2,not-a-date,A,1,10,4",
      "3,2025-01-01,A,0,10,4",
      "4,2025-01-01,A,1,abc,4",
      "5,2025-01-01,A,1,10,",
      "1,2025-01-01,A,1,10,4",
    ].join("\n");
    const parsed = parseCsvText(csv);
    const res = validateRows(parsed, autoMapColumns(parsed.headers), opts);
    expect(res.valid).toHaveLength(1);
    expect(res.errors.map((e) => e.line)).toEqual([3, 4, 5, 6, 7]);
    expect(res.errors[4].messages[0]).toMatch(/Duplicate/);
  });

  it("fills blank costs from product defaults", () => {
    const parsed = parseCsvText("order_id,order_date,sku,quantity,sale_price,product_cost\n9,2025-01-01,A,1,10,");
    const res = validateRows(parsed, autoMapColumns(parsed.headers), {
      defaultCurrency: "USD",
      products: [{ id: "p", sku: "A", name: "Alpha", marketplace: "Amazon", product_cost: 3, default_shipping_cost: 1, default_fee: 1.5, default_ad_cost: 0 }],
    });
    expect(res.errors).toEqual([]);
    expect(res.valid[0].data).toMatchObject({ product_cost: 3, shipping_cost: 1, marketplace_fee: 1.5, currency: "USD", product_name: "Alpha" });
  });

  it("normalises negative refunds to a magnitude", () => {
    const parsed = parseCsvText("order_id,order_date,sku,quantity,sale_price,product_cost,refund_amount\n9,2025-01-01,A,1,10,2,-10");
    expect(validateRows(parsed, autoMapColumns(parsed.headers), opts).valid[0].data.refund_amount).toBe(10);
  });
});

describe("value parsing & safety", () => {
  it("parses money formats", () => {
    expect(parseMoney("£1,234.50")).toBe(1234.5);
    expect(parseMoney("(12.30)")).toBe(-12.3);
    expect(parseMoney("1.234,50")).toBe(1234.5);
    expect(parseMoney("12,5")).toBe(12.5);
    expect(Number.isNaN(parseMoney("abc"))).toBe(true);
    expect(Number.isNaN(parseMoney(""))).toBe(true);
  });
  it("parses dates", () => {
    expect(parseDate("2025-03-04")).toMatch(/^2025-03-04/);
    expect(parseDate("04/03/2025")).toMatch(/^2025-03-04/);
    expect(parseDate("31/02/2025")).toBeNull();
    expect(parseDate("garbage")).toBeNull();
  });
  it("sanitises text and exports", () => {
    expect(sanitizeText("<script>x</script>\u0000 hi")).toBe("scriptx/script hi");
    expect(csvSafe("=SUM(A1)")).toBe("'=SUM(A1)");
    expect(csvSafe('a,"b"')).toBe('"a,""b"""');
  });
  it("validates files", () => {
    expect(validateFile({ name: "a.exe", size: 10, type: "" })).not.toBeNull();
    expect(validateFile({ name: "a.csv", size: 10, type: "text/csv" })).toBeNull();
    expect(validateFile({ name: "a.csv", size: 6e6, type: "text/csv" })).not.toBeNull();
  });
});
