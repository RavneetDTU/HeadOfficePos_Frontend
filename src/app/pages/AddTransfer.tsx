import {
  AlertCircle,
  ArrowRight,
  CheckCircle,
  ChevronDown,
  Loader2,
  Package,
  Plus,
  Trash2,
  Truck,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { apiFetch } from "../lib/api";
import {
  createStore,
  createTransfer,
  getMasterData,
  getStoreInventory,
  getStores,
  getWarehouseInventory,
  getWarehouses,
} from "../services/inventoryService";
import type {
  CreateTransferPayload,
  Warehouse,
  WarehouseInventoryItem,
} from "../types/inventory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtZAR(val: number) {
  return `R ${val.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function printTransferInvoice(opts: {
  invoiceNo: string;
  date: string;
  fromWarehouse: string;
  toStore: string;
  biller: string;
  lines: { sku: string; name: string; qty: number; price: number }[];
}) {
  const total = opts.lines.reduce((acc, l) => acc + l.qty * l.price, 0);
  const rows = opts.lines
    .map(
      (l, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td>${l.sku || "—"}</td>
        <td>${l.name}</td>
        <td style="text-align:center">${l.qty}</td>
        <td style="text-align:right">R ${l.price.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right">R ${(l.qty * l.price).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sales Invoice ${opts.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
    body { padding: 40px; color: #111; background: #fff; font-size: 13px; }
    .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 32px; border-bottom: 2px solid #1d4ed8; padding-bottom: 20px; }
    .brand h1 { font-size: 22px; font-weight: 700; color: #1d4ed8; }
    .brand p { color: #555; font-size: 12px; margin-top: 2px; }
    .invoice-meta { text-align: right; }
    .invoice-meta h2 { font-size: 24px; font-weight: 800; color: #111; text-transform: uppercase; }
    .invoice-meta p { color: #555; font-size: 12px; margin-top: 4px; }
    .parties { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin-bottom: 28px; }
    .party-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; }
    .party-box h3 { font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #64748b; margin-bottom: 6px; }
    .party-box p { font-size: 13px; font-weight: 600; color: #111; }
    .party-box span { font-size: 12px; color: #555; display: block; margin-top: 2px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 24px; }
    thead tr { background: #1d4ed8; color: #fff; }
    thead th { padding: 10px 12px; text-align: left; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    tbody tr.even { background: #fff; }
    tbody tr.odd { background: #f8fafc; }
    tbody td { padding: 9px 12px; border-bottom: 1px solid #e2e8f0; font-size: 13px; }
    .totals { display: flex; justify-content: flex-end; margin-bottom: 32px; }
    .totals-table { width: 280px; }
    .totals-table tr td { padding: 6px 12px; font-size: 13px; }
    .totals-table tr td:first-child { color: #555; }
    .totals-table tr td:last-child { text-align: right; font-weight: 600; }
    .totals-table tr.grand td { border-top: 2px solid #1d4ed8; font-weight: 800; font-size: 15px; color: #1d4ed8; padding-top: 10px; }
    .footer { text-align: center; font-size: 11px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding-top: 16px; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="brand">
      <h1>HeadOffice POS</h1>
      <p>Hearing Aid Labs — Stock Transfer Invoice</p>
    </div>
    <div class="invoice-meta">
      <h2>Invoice</h2>
      <p><strong>Invoice #:</strong> ${opts.invoiceNo}</p>
      <p><strong>Date:</strong> ${opts.date}</p>
      <p><strong>Biller:</strong> ${opts.biller}</p>
    </div>
  </div>

  <div class="parties">
    <div class="party-box">
      <h3>From</h3>
      <p>${opts.fromWarehouse}</p>
      <span>Source Warehouse</span>
    </div>
    <div class="party-box">
      <h3>To</h3>
      <p>${opts.toStore}</p>
      <span>Destination Store</span>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th>SKU</th>
        <th>Product Name</th>
        <th style="text-align:center">Qty</th>
        <th style="text-align:right">Unit Price</th>
        <th style="text-align:right">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals">
    <table class="totals-table">
      <tr><td>Subtotal</td><td>R ${total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td></tr>
      <tr><td>VAT (15%)</td><td>R ${(total * 0.15).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td></tr>
      <tr class="grand"><td>Total</td><td>R ${(total * 1.15).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td></tr>
    </table>
  </div>

  <div class="footer">
    <p>This invoice was automatically generated by HeadOffice POS upon stock transfer completion.</p>
    <p style="margin-top:4px">Thank you for your business.</p>
  </div>

  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

// ─── Line Item ────────────────────────────────────────────────────────────────

interface LineItem {
  product_id: number | "";
  sku: string;
  product_name: string;
  available_qty: number;
  quantity: number | "";
  purchase_price: number | "";
}

const emptyLine = (): LineItem => ({
  product_id: "",
  sku: "",
  product_name: "",
  available_qty: 0,
  quantity: "",
  purchase_price: "",
});

// ─── Product Picker Modal ─────────────────────────────────────────────────────

interface ProductPickerProps {
  warehouseInventory: WarehouseInventoryItem[];
  onSelect: (item: WarehouseInventoryItem) => void;
  onClose: () => void;
}

function ProductPicker({ warehouseInventory, onSelect, onClose }: ProductPickerProps) {
  const [q, setQ] = useState("");
  const filtered = warehouseInventory.filter(
    (i) => !q || i.name.toLowerCase().includes(q.toLowerCase()) || i.sku.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900">Select Product</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={18} /></button>
        </div>
        <div className="p-4">
          <input
            type="text"
            placeholder="Search product name or SKU..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
            autoFocus
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 mb-3"
          />
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-6">No products found</p>
            ) : filtered.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelect(item)}
                className="w-full px-3 py-2.5 flex items-center justify-between hover:bg-blue-50 transition-colors text-left rounded-lg"
              >
                <div>
                  <p className="text-xs font-mono text-blue-700">{item.sku}</p>
                  <p className="text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.category} · {item.brand}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">Avail: {item.available_qty}</p>
                  <p className="text-xs text-gray-500">{fmtZAR(item.selling_price)} / unit</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AddTransfer() {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [warehouseInventory, setWarehouseInventory] = useState<WarehouseInventoryItem[]>([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  const [fromWarehouseId, setFromWarehouseId] = useState<number | "">("");
  const [toStoreId, setToStoreId] = useState<number | "">("");
  const [transferDate, setTransferDate] = useState(
    new Date().toISOString().slice(0, 16)
  );
  const [notes, setNotes] = useState("");
  const [lines, setLines] = useState<LineItem[]>([emptyLine()]);

  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState(false);
  const [showPicker, setShowPicker] = useState<number | null>(null);

  // Load warehouses & stores on mount
  useEffect(() => {
    const init = async () => {
      try {
        const [wh, st, masterData] = await Promise.all([
          getWarehouses(),
          getStores(),
          getMasterData()
        ]);
        let finalStores = [...st];
        const otherPersons = finalStores.find(
          (s) => s.name.toLowerCase().trim() === "other persons"
        );
        if (!otherPersons) {
          try {
            const newStore = await createStore({
              name: "Other Persons",
              code: "OTHER",
              status: "Active"
            });
            finalStores.push(newStore);
          } catch (e) {
            console.error("Failed to create Other Persons fallback store:", e);
          }
        }
        // Combine them so filtering type === "warehouse" vs "store" works
        const combined = [...wh, ...finalStores];
        setWarehouses(combined);
        const centralWh = wh.find((w) => w.type === "warehouse");
        if (centralWh) setFromWarehouseId(centralWh.id);

        // Same strategy as ListProducts: seed from /warehouse/{id}/inventory (all products),
        // then override with /sales/stock (more accurate for the subset it tracks).
        const primaryWarehouse = wh[0];
        const [whInvResult, salesStockRaw, ...storeInventories] = await Promise.all([
          primaryWarehouse
            ? getWarehouseInventory({ warehouse_id: primaryWarehouse.id }).catch(() => ({ items: [] }))
            : Promise.resolve({ items: [] as any[] }),
          apiFetch<any[]>("/sales/stock").catch(() => []),
          ...st.map((s) =>
            getStoreInventory(s.id)
              .then((res) => ({ storeName: s.name, items: res.items }))
              .catch(() => ({ storeName: s.name, items: [] }))
          ),
        ]);

        // Build a sku -> qty map (warehouse stock only)
        const whStockMap: Record<string, number> = {};

        // Step 1: seed from /warehouse/{id}/inventory
        for (const item of whInvResult.items) {
          const sku = String(item.sku || "").trim().toLowerCase();
          const qty = Number(item.available_qty ?? item.quantity ?? 0);
          if (sku && qty > 0) {
            whStockMap[sku] = qty;
          }
        }

        // Step 2: override with /sales/stock for tracked products
        for (const item of salesStockRaw) {
          const sku = String(item.sku || "").trim().toLowerCase();
          const qty = Number(item.inStock ?? item.available ?? 0);
          if (sku) {
            whStockMap[sku] = qty;
          }
        }

        const items: WarehouseInventoryItem[] = masterData.products.map((p) => {
          const finalQty = whStockMap[p.sku.trim().toLowerCase()] ?? 0;

          return {
            id: p.id,
            product_id: p.id,
            sku: p.sku,
            name: p.name,
            category: "General",
            brand: "Brand",
            unit: "Unit",
            warehouse_id: primaryWarehouse?.id ?? 1,
            warehouse_name: primaryWarehouse?.name ?? "Warehouse",
            quantity: finalQty,
            reserved_qty: 0,
            available_qty: finalQty,
            purchase_price: p.costPrice || 0,
            selling_price: p.sellingPrice || 0,
            alert_qty: 3,
            is_low_stock: finalQty <= 3,
            last_updated: new Date().toISOString(),
          };
        });

        setWarehouseInventory(items);
      } catch (e) {
        console.error("Failed to initialize AddTransfer inventory:", e);
      } finally {
        setLoadingMeta(false);
      }
    };
    init();
  }, []);

  const centralWarehouses = warehouses.filter((w) => w.type === "warehouse");
  const stores = warehouses.filter((w) => w.type === "store");

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);
  const removeLine = (idx: number) => setLines((prev) => prev.filter((_, i) => i !== idx));
  const updateLine = (idx: number, patch: Partial<LineItem>) =>
    setLines((prev) => prev.map((l, i) => (i === idx ? { ...l, ...patch } : l)));

  const handleProductSelect = (idx: number, item: WarehouseInventoryItem) => {
    updateLine(idx, {
      product_id: item.product_id,
      sku: item.sku,
      product_name: item.name,
      available_qty: item.available_qty,
      purchase_price: item.selling_price,
    });
    setShowPicker(null);
  };

  const totalValue = lines.reduce(
    (acc, l) => acc + (Number(l.quantity) || 0) * (Number(l.purchase_price) || 0),
    0
  );

  const validate = (): string | null => {
    if (!fromWarehouseId) return "Please select a source warehouse.";
    if (!toStoreId) return "Please select a destination store.";
    if (Number(fromWarehouseId) === Number(toStoreId)) return "Source and destination cannot be the same.";
    if (lines.length === 0) return "Add at least one product.";
    for (let i = 0; i < lines.length; i++) {
      const l = lines[i];
      if (!l.product_id) return `Line ${i + 1}: Select a product.`;
      if (!l.quantity || Number(l.quantity) <= 0) return `Line ${i + 1}: Quantity must be > 0.`;
      if (Number(l.quantity) > l.available_qty) return `Line ${i + 1}: Requested ${l.quantity} but only ${l.available_qty} available for ${l.sku}.`;
      if (!l.purchase_price || Number(l.purchase_price) < 0) return `Line ${i + 1}: Enter a valid price.`;
    }
    return null;
  };

  const handleSubmit = async () => {
    const err = validate();
    if (err) { setSubmitError(err); return; }

    setSubmitting(true);
    setSubmitError("");
    try {
      const payload: CreateTransferPayload = {
        from_warehouse_id: Number(fromWarehouseId),
        to_store_id: Number(toStoreId),
        transfer_date: new Date(transferDate).toISOString(),
        notes: notes || undefined,
        items: lines.map((l) => ({
          product_id: Number(l.product_id),
          quantity: Number(l.quantity),
          purchase_price: Number(l.purchase_price),
        })),
      };
      await createTransfer(payload);



      setSuccess(true);
      setTimeout(() => navigate("/transfers"), 1500);
    } catch (e) {
      setSubmitError(e instanceof Error ? e.message : "Transfer failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingMeta) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (success) return (
    <div className="flex items-center justify-center h-96 flex-col gap-4">
      <CheckCircle size={48} className="text-green-500" />
      <p className="text-lg font-semibold text-gray-900">Transfer Created Successfully!</p>
      <p className="text-sm text-gray-500">Redirecting to transfers list...</p>
    </div>
  );

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <a href="/transfers" className="hover:text-blue-600">Transfers</a>
        <span>/</span>
        <span className="text-gray-900 font-medium">New Sales</span>
      </div>

      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Create Stock Sales</h1>
        <p className="text-sm text-gray-500 mt-0.5">Move products from the central warehouse to a store</p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {/* Main form */}
        <div className="col-span-2 space-y-4">
          {/* Header info */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
              <Truck size={16} className="text-blue-600" /> Sales Details
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Warehouse *</label>
                <div className="relative">
                  <select
                    value={fromWarehouseId}
                    onChange={(e) => setFromWarehouseId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                  >
                    <option value="">Select warehouse</option>
                    {centralWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Store *</label>
                <div className="relative">
                  <select
                    value={toStoreId}
                    onChange={(e) => setToStoreId(Number(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                  >
                    <option value="">Select store</option>
                    {stores.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1"> Date *</label>
                <input
                  type="datetime-local"
                  value={transferDate}
                  onChange={(e) => setTransferDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Monthly replenishment"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
            </div>
          </div>

          {/* Products Table */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800 flex items-center gap-2">
                <Package size={16} className="text-purple-600" /> Products to Sale
              </h2>
              <button
                onClick={addLine}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium"
              >
                <Plus size={13} /> Add Product
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600">Product</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-24">Available</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-28">Transfer Qty *</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-32">Selling Price *</th>
                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-600 w-28">Subtotal</th>
                    <th className="px-3 py-2 w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {lines.map((line, idx) => (
                    <tr key={idx}>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => setShowPicker(idx)}
                          className="w-full text-left px-3 py-1.5 border border-dashed border-gray-300 rounded-lg text-sm hover:border-blue-400 hover:bg-blue-50 transition-colors flex items-center gap-2"
                        >
                          {line.product_id ? (
                            <div>
                              <span className="text-xs font-mono text-blue-700">{line.sku}</span>
                              <p className="text-sm text-gray-900 max-w-48 truncate">{line.product_name}</p>
                            </div>
                          ) : (
                            <span className="text-gray-400 flex items-center gap-1"><Package size={14} /> Click to select product</span>
                          )}
                        </button>
                      </td>
                      <td className="px-3 py-2">
                        <span className="text-sm text-gray-600">{line.available_qty || "—"}</span>
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min={1}
                          max={line.available_qty || undefined}
                          value={line.quantity}
                          onChange={(e) => updateLine(idx, { quantity: e.target.value === "" ? "" : Number(e.target.value) })}
                          placeholder="0"
                          className={`w-full px-2 py-1.5 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center ${Number(line.quantity) > line.available_qty && line.available_qty > 0
                              ? "border-red-400 bg-red-50"
                              : "border-gray-200"
                            }`}
                        />
                        {Number(line.quantity) > line.available_qty && line.available_qty > 0 && (
                          <p className="text-xs text-red-500 mt-0.5">Exceeds available</p>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <div className="relative">
                          <span className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500 text-xs">R</span>
                          <input
                            type="number"
                            min={0}
                            value={line.purchase_price}
                            onChange={(e) => updateLine(idx, { purchase_price: e.target.value === "" ? "" : Number(e.target.value) })}
                            placeholder="0.00"
                            className="w-full pl-5 pr-2 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-900">
                        {line.quantity && line.purchase_price
                          ? fmtZAR(Number(line.quantity) * Number(line.purchase_price))
                          : "—"}
                      </td>
                      <td className="px-3 py-2">
                        <button
                          onClick={() => removeLine(idx)}
                          disabled={lines.length === 1}
                          className="p-1 rounded hover:bg-red-50 text-red-400 disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 flex justify-end">
              <div className="text-right">
                <p className="text-xs text-gray-500">Total Sales Value</p>
                <p className="text-xl font-bold text-gray-900">{fmtZAR(totalValue)}</p>
              </div>
            </div>
          </div>

          {/* Error */}
          {submitError && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertCircle size={16} /> {submitError}
            </div>
          )}
        </div>

        {/* Sidebar summary */}
        <div className="space-y-4">
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-5 text-white">
            <div className="flex items-center gap-2 mb-4">
              <Truck size={16} />
              <h2 className="text-sm font-semibold">Transfer Summary</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">From</span>
                <span className="font-medium text-right max-w-28 truncate">
                  {warehouses.find((w) => w.id === Number(fromWarehouseId))?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">To</span>
                <span className="font-medium text-right max-w-28 truncate">
                  {warehouses.find((w) => w.id === Number(toStoreId))?.name || "—"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Products</span>
                <span className="font-medium">{lines.filter((l) => l.product_id).length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Total Units</span>
                <span className="font-medium">{lines.reduce((a, l) => a + (Number(l.quantity) || 0), 0)}</span>
              </div>
              <div className="border-t border-blue-500 pt-2 mt-2 flex justify-between">
                <span className="text-blue-200">Total Value</span>
                <span className="font-bold">{fmtZAR(totalValue)}</span>
              </div>
            </div>
          </div>

          {/* Flow info */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center gap-3 text-xs text-blue-700">
              <span className="bg-blue-200 rounded px-2 py-1 font-medium">Warehouse</span>
              <ArrowRight size={14} />
              <span className="bg-blue-600 text-white rounded px-2 py-1 font-medium">Store</span>
            </div>
            <p className="text-xs text-blue-600 mt-2">
              Stock will be deducted from the warehouse and added to the store inventory. An inventory ledger entry will be created for both.
            </p>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 flex items-center justify-center gap-2"
            >
              {submitting ? <Loader2 size={15} className="animate-spin" /> : <Truck size={15} />}
              {submitting ? "Creating Transfer..." : "Create Transfer"}
            </button>
            <a
              href="/transfers"
              className="block w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm text-center hover:bg-gray-50 transition-colors"
            >
              Cancel
            </a>
          </div>
        </div>
      </div>

      {/* Product Picker Modal */}
      {showPicker !== null && (
        <ProductPicker
          warehouseInventory={warehouseInventory}
          onSelect={(item) => handleProductSelect(showPicker, item)}
          onClose={() => setShowPicker(null)}
        />
      )}
    </div>
  );
}
