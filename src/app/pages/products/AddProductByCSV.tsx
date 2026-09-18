import { AlertTriangle, Download, Loader2, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router";
import { createProduct, getWarehouses } from "../../services/inventoryService";

const CSV_HEADERS = [
  "serialNumber",
  "name",
  "sku",
  "category",
  "subCategory",
  "brand",
  "model",
  "supplierId",
  "unit",
  "quantity",
  "costPrice",
  "sellingPrice",
  "tax",
  "description",
  "imageUrl",
  "status",
  "alertQty",
] as const;

type CsvHeader = (typeof CSV_HEADERS)[number];

const HEADER_ALIASES: Record<string, CsvHeader> = {
  name: "name",
  productname: "name",
  sku: "sku",
  code: "sku",
  productcode: "sku",
  itemnumber: "sku",
  itemno: "sku",
  item_number: "sku",
  category: "category",
  subcategory: "subCategory",
  sub_category: "subCategory",
  brand: "brand",
  model: "model",
  supplierid: "supplierId",
  supplier_id: "supplierId",
  unit: "unit",
  quantity: "quantity",
  qty: "quantity",
  serialnumber: "serialNumber",
  serialnumbers: "serialNumber",
  serial: "serialNumber",
  serials: "serialNumber",
  serialno: "serialNumber",
  serial_number: "serialNumber",
  sn: "serialNumber",
  costprice: "costPrice",
  cost_price: "costPrice",
  sellingprice: "sellingPrice",
  selling_price: "sellingPrice",
  saleprice: "sellingPrice",
  sale_price: "sellingPrice",
  tax: "tax",
  taxpercent: "tax",
  tax_percent: "tax",
  description: "description",
  imageurl: "imageUrl",
  image_url: "imageUrl",
  status: "status",
  alertqty: "alertQty",
  alert_qty: "alertQty",
};

interface ParsedRow {
  line: number;
  values: Partial<Record<CsvHeader, string>>;
}

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  const src = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < src.length; i++) {
    const ch = src[i];
    if (quoted) {
      if (ch === '"') {
        if (src[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          quoted = false;
        }
      } else {
        cell += ch;
      }
      continue;
    }
    if (ch === '"') {
      quoted = true;
    } else if (ch === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && src[i + 1] === "\n") i++;
      row.push(cell.trim());
      cell = "";
      if (row.some((c) => c.length > 0)) rows.push(row);
      row = [];
    } else {
      cell += ch;
    }
  }
  row.push(cell.trim());
  if (row.some((c) => c.length > 0)) rows.push(row);
  return rows;
}

function taxPercentFromCell(value: string): number {
  const v = value.trim().toLowerCase();
  if (!v || v === "no tax" || v === "vat 0%" || v === "0") return 0;
  if (v.includes("15")) return 15;
  const n = Number(v.replace("%", ""));
  return Number.isFinite(n) ? n : 0;
}

function downloadTemplate() {
  const sample = [
    CSV_HEADERS.join(","),
    "\"SN-111, SN-222\",Receiver 85dB,HA-100,Hearing Aids,RIC,Phonak,Audéo Lumity,,Unit,6,1250,1890,VAT 15%,Demo line,https://example.com/ha-100.jpg,Active,2",
  ].join("\n");
  const blob = new Blob([sample], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "add-product-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export function AddProductByCSV() {
  const navigate = useNavigate();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fileName, setFileName] = useState("");
  const [rows, setRows] = useState<ParsedRow[]>([]);
  const [parseError, setParseError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [progress, setProgress] = useState("");
  const [results, setResults] = useState<{ ok: number; failed: { line: number; sku: string; error: string }[] } | null>(
    null
  );
  const [warehouseId, setWarehouseId] = useState<number | null>(null);

  useEffect(() => {
    getWarehouses()
      .then((whs) => setWarehouseId(whs[0]?.id ?? null))
      .catch(() => setWarehouseId(null));
  }, []);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setResults(null);
    setParseError("");
    setFileName(file.name);
    const text = await file.text();
    const table = parseCsv(text);
    if (table.length < 2) {
      setRows([]);
      setParseError("CSV needs a header row and at least one product row.");
      return;
    }
    const headers = table[0].map((h) => HEADER_ALIASES[h.replace(/\s+/g, "").toLowerCase()]);
    const hasName = headers.includes("name") || headers.includes("description");
    const hasSku = headers.includes("sku");
    if (!hasName || !hasSku) {
      setRows([]);
      setParseError("CSV must include name (or Description) and sku (or Item number).");
      return;
    }
    const parsed: ParsedRow[] = [];
    table.slice(1).forEach((cells, idx) => {
      const values: ParsedRow["values"] = {};
      headers.forEach((key, i) => {
        if (key) values[key] = cells[i] ?? "";
      });
      if (!String(values.name ?? "").trim() && !String(values.sku ?? "").trim()) return;
      parsed.push({ line: idx + 2, values });
    });
    setRows(parsed);
  };

  const importRows = async () => {
    if (rows.length === 0) {
      setParseError("Choose a CSV file first.");
      return;
    }
    setIsSaving(true);
    setResults(null);
    setParseError("");
    let ok = 0;
    const failed: { line: number; sku: string; error: string }[] = [];
    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const name = String(row.values.name ?? "").trim() || String(row.values.description ?? "").trim();
      const sku = String(row.values.sku ?? "").trim();
      setProgress(`Saving ${i + 1} of ${rows.length}…`);
      if (!name || !sku) {
        failed.push({ line: row.line, sku, error: "Name and SKU are required." });
        continue;
      }
      const quantity = Math.max(0, Math.floor(Number(row.values.quantity) || 0));
      try {
        await createProduct({
          name,
          sku,
          category: row.values.category?.trim() || undefined,
          subCategory: row.values.subCategory?.trim() || undefined,
          brand: row.values.brand?.trim() || undefined,
          model: row.values.model?.trim() || undefined,
          supplierId: row.values.supplierId ? Number(row.values.supplierId) : undefined,
          unit: row.values.unit?.trim() || "Unit",
          costPrice: Number(row.values.costPrice) || 0,
          sellingPrice: Number(row.values.sellingPrice) || 0,
          taxPercent: taxPercentFromCell(row.values.tax ?? ""),
          description: row.values.description?.trim() || undefined,
          imageUrl: row.values.imageUrl?.trim() || undefined,
          status: (row.values.status?.trim() || "Active") as "Active" | "Inactive",
          alertQty: Number(row.values.alertQty) || undefined,
          serialNumber: row.values.serialNumber?.trim() || undefined,
          openingStock:
            quantity > 0 && warehouseId
              ? [{ warehouseId, quantity }]
              : undefined,
        });
        ok += 1;
      } catch (e) {
        failed.push({
          line: row.line,
          sku,
          error: e instanceof Error ? e.message : "Failed to create product",
        });
      }
    }
    setProgress("");
    setIsSaving(false);
    setResults({ ok, failed });
    if (ok > 0 && failed.length === 0) {
      setTimeout(() => navigate("/products"), 1200);
    }
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span>
        <span>/</span>
        <span>Products</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">Add Product by CSV</span>
      </div>

      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Add Product by CSV</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Same fields as Add Product. Each row is saved with POST /products and appears on List Products.
          </p>
        </div>
        <Link to="/products/add" className="text-sm text-blue-600 hover:underline shrink-0">
          Add one product
        </Link>
      </div>

      <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-900 space-y-2">
        <p>Keep the first header row. Column order can match the template; aliases like <code>code</code> for SKU are accepted.</p>
        <p>
          First column is <code>serialNumber</code>, then name, sku, category, subCategory, brand, model, supplierId, unit, quantity,
          costPrice, sellingPrice, tax, description, imageUrl, status, alertQty.
        </p>
        <p>
          Serial numbers are optional. Use one value (<code>SN-111</code>) or several in the first cell
          (<code>SN-111, SN-222</code>). Item number maps to SKU.
        </p>
        <p>Use this for 30–40 products at a time. Images must already be a public URL (file upload stays on Add Product).</p>
      </div>

      {parseError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle size={16} />
          {parseError}
        </div>
      )}

      {results && (
        <div className={`mb-4 p-3 rounded-lg border text-sm ${results.failed.length ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-green-50 border-green-200 text-green-700"}`}>
          Saved {results.ok} product{results.ok === 1 ? "" : "s"}
          {results.failed.length ? ` · ${results.failed.length} failed` : ". Redirecting to the product list…"}
          {results.failed.length > 0 && (
            <ul className="mt-2 space-y-1">
              {results.failed.slice(0, 12).map((f) => (
                <li key={`${f.line}-${f.sku}`}>
                  Line {f.line} ({f.sku || "no SKU"}): {f.error}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="border border-gray-200 rounded-lg p-5 space-y-4 max-w-3xl">
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={downloadTemplate}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Download size={15} /> Download CSV template
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-700 hover:bg-gray-50"
          >
            <Upload size={15} /> Choose CSV
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,text/csv"
            className="hidden"
            onChange={(e) => void onFile(e.target.files?.[0])}
          />
        </div>
        <p className="text-sm text-gray-600">{fileName ? `${fileName} — ${rows.length} row(s)` : "No file selected"}</p>
        <button
          type="button"
          disabled={isSaving || rows.length === 0}
          onClick={() => void importRows()}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
        >
          {isSaving && <Loader2 size={16} className="animate-spin" />}
          {isSaving ? progress || "Saving…" : `Import ${rows.length || ""} products`}
        </button>
      </div>
    </div>
  );
}
