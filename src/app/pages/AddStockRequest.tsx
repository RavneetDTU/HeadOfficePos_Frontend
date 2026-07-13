import { useEffect, useRef, useState } from "react";
import {
  AlertCircle,
  CheckCircle2,
  ChevronDown,
  ClipboardList,
  Loader2,
  Package,
  Plus,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useNavigate } from "react-router";
import { useAuth } from "../context/AuthContext";
import { createStockRequest, getMasterData } from "../services/inventoryService";
import type { MasterDataProduct } from "../types/inventory";

// ─── Types ─────────────────────────────────────────────────────────────────────

interface LineItem {
  sku: string;
  product_name: string;
  quantity: number | "";
}

// ─── Product Picker Modal ─────────────────────────────────────────────────────

interface ProductPickerProps {
  catalog: MasterDataProduct[];
  onSelect: (p: MasterDataProduct) => void;
  onClose: () => void;
}

function ProductPicker({ catalog, onSelect, onClose }: ProductPickerProps) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  const filtered = catalog.filter(
    (p) =>
      !q ||
      p.name.toLowerCase().includes(q.toLowerCase()) ||
      p.sku.toLowerCase().includes(q.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50">
          <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-2">
            <Package size={16} className="text-blue-500" /> Select Product
          </h3>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-gray-600 transition-colors">
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <div className="relative mb-3">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              placeholder="Search product name or SKU…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          <div className="max-h-72 overflow-y-auto divide-y divide-gray-50">
            {filtered.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-8">No products found</p>
            ) : filtered.slice(0, 80).map((p) => (
              <button
                key={p.id}
                onClick={() => { onSelect(p); onClose(); }}
                className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-blue-50 transition-colors text-left rounded-lg"
              >
                <div>
                  <p className="text-xs font-mono text-blue-700">{p.sku}</p>
                  <p className="text-sm font-medium text-gray-900 mt-0.5">{p.name}</p>
                </div>
                <ChevronDown size={14} className="text-gray-300 -rotate-90" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AddStockRequest() {
  const navigate = useNavigate();
  const { user, isStoreManager } = useAuth();

  const [catalog, setCatalog] = useState<MasterDataProduct[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(true);

  const [items, setItems] = useState<LineItem[]>([{ sku: "", product_name: "", quantity: "" }]);
  const [remarks, setRemarks] = useState("");

  const [showPicker, setShowPicker] = useState(false);
  const [pickerIndex, setPickerIndex] = useState<number>(0);

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [successRef, setSuccessRef] = useState<{ id: number; ref: string } | null>(null);

  // Guard: only store managers can create
  useEffect(() => {
    if (!isStoreManager && user !== null) {
      navigate("/requests", { replace: true });
    }
  }, [isStoreManager, user, navigate]);

  // Load product catalog
  useEffect(() => {
    setLoadingCatalog(true);
    getMasterData()
      .then((d) => setCatalog(d.products))
      .catch(() => setError("Failed to load product catalog. Please refresh."))
      .finally(() => setLoadingCatalog(false));
  }, []);

  const openPicker = (index: number) => {
    setPickerIndex(index);
    setShowPicker(true);
  };

  const handlePickProduct = (p: MasterDataProduct) => {
    setItems((prev) => {
      const next = [...prev];
      next[pickerIndex] = { sku: p.sku, product_name: p.name, quantity: next[pickerIndex].quantity };
      return next;
    });
  };

  const addRow = () => setItems((prev) => [...prev, { sku: "", product_name: "", quantity: "" }]);

  const removeRow = (index: number) =>
    setItems((prev) => prev.length === 1 ? prev : prev.filter((_, i) => i !== index));

  const updateQty = (index: number, val: string) => {
    const n = parseInt(val, 10);
    setItems((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], quantity: isNaN(n) || n < 1 ? "" : n };
      return next;
    });
  };

  const validItems = items.filter((i) => i.sku && i.quantity && Number(i.quantity) > 0);

  const handleSubmit = async () => {
    if (validItems.length === 0) {
      setError("Please add at least one product with a quantity.");
      return;
    }
    setSubmitting(true);
    setError("");
    try {
      const result = await createStockRequest({
        remarks: remarks.trim() || undefined,
        items: validItems.map((i) => ({ sku: i.sku, quantity: Number(i.quantity) })),
      });
      setSuccessRef({ id: result.id, ref: result.request_number });
      setSuccess(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to submit stock request.");
    } finally {
      setSubmitting(false);
    }
  };

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success && successRef) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center p-6">
        <div className="bg-white rounded-2xl border border-green-100 shadow-xl p-10 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-5">
            <CheckCircle2 size={32} className="text-green-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Request Submitted!</h2>
          <p className="text-gray-500 text-sm mb-1">Your stock request has been submitted for admin review.</p>
          <p className="text-sm font-mono bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg inline-block mt-2 mb-6">
            {successRef.ref || `REQ-${successRef.id}`}
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => navigate("/requests")}
              className="w-full px-4 py-2.5 rounded-xl bg-blue-600 text-white font-semibold text-sm hover:bg-blue-700 transition-colors"
            >
              View All Requests
            </button>
            <button
              onClick={() => { setSuccess(false); setSuccessRef(null); setItems([{ sku: "", product_name: "", quantity: "" }]); setRemarks(""); }}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-600 font-medium text-sm hover:bg-gray-50 transition-colors"
            >
              Submit Another Request
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white p-6">

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
          <ClipboardList size={22} className="text-blue-600" />
          New Stock Request
        </h1>
        <p className="text-sm text-gray-500 mt-0.5">
          Request stock from the warehouse for your store
          {user?.storeId ? ` (Store #${user.storeId})` : ""}
        </p>
      </div>

      <div className="max-w-3xl space-y-5">

        {/* Catalog loading indicator */}
        {loadingCatalog && (
          <div className="flex items-center gap-2 px-4 py-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
            <Loader2 size={15} className="animate-spin" /> Loading product catalog…
          </div>
        )}

        {/* Items card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
          <div className="px-5 py-3.5 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <Package size={15} className="text-blue-500" /> Requested Items
            </h2>
            <span className="text-xs text-gray-400">{validItems.length} valid item{validItems.length !== 1 ? "s" : ""}</span>
          </div>

          <div className="p-4 space-y-2">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_2fr_100px_36px] gap-2 px-1">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">SKU</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Product</p>
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Quantity</p>
              <span />
            </div>

            {/* Line items */}
            {items.map((item, idx) => (
              <div key={idx} className="grid grid-cols-[1fr_2fr_100px_36px] gap-2 items-center">
                {/* SKU / picker button */}
                <button
                  onClick={() => openPicker(idx)}
                  disabled={loadingCatalog}
                  className={`flex items-center gap-1.5 w-full px-3 py-2 border rounded-lg text-sm text-left transition-colors ${
                    item.sku
                      ? "border-blue-200 bg-blue-50 text-blue-700 font-mono font-semibold"
                      : "border-gray-200 text-gray-400 hover:border-blue-300 hover:bg-blue-50"
                  }`}
                >
                  {item.sku || "Pick…"}
                  <ChevronDown size={12} className="ml-auto text-gray-400 shrink-0" />
                </button>

                {/* Product name (read-only) */}
                <div className="px-3 py-2 bg-gray-50 border border-gray-100 rounded-lg text-xs text-gray-600 truncate min-h-[36px] flex items-center">
                  {item.product_name || <span className="text-gray-300">—</span>}
                </div>

                {/* Quantity */}
                <input
                  type="number"
                  min={1}
                  value={item.quantity}
                  onChange={(e) => updateQty(idx, e.target.value)}
                  placeholder="0"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-400"
                />

                {/* Remove row */}
                <button
                  onClick={() => removeRow(idx)}
                  disabled={items.length === 1}
                  className="p-2 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-0"
                  title="Remove row"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}

            {/* Add row */}
            <button
              onClick={addRow}
              className="flex items-center gap-1.5 text-sm text-blue-600 font-medium hover:text-blue-800 mt-1 px-1 transition-colors"
            >
              <Plus size={15} /> Add another product
            </button>
          </div>
        </div>

        {/* Remarks card */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-5">
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Remarks <span className="text-gray-400 font-normal">(optional)</span>
          </label>
          <textarea
            rows={3}
            value={remarks}
            onChange={(e) => setRemarks(e.target.value)}
            placeholder="e.g. Needed for weekend promotion, urgent restock…"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
          />
        </div>

        {/* Summary card */}
        {validItems.length > 0 && (
          <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
            <p className="text-xs font-semibold text-blue-700 uppercase tracking-wide mb-3">Request Summary</p>
            <div className="space-y-1.5">
              {validItems.map((item, i) => (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="text-blue-800 font-medium">{item.product_name || item.sku}</span>
                  <span className="font-bold text-blue-900">× {item.quantity}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-blue-200 flex items-center justify-between text-sm font-semibold text-blue-900">
              <span>Total Products</span>
              <span>{validItems.reduce((s, i) => s + Number(i.quantity), 0)} units across {validItems.length} SKU{validItems.length !== 1 ? "s" : ""}</span>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 px-4 py-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600">
            <AlertCircle size={15} className="shrink-0" /> {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => navigate("/requests")}
            className="px-5 py-2.5 rounded-xl border border-gray-200 text-gray-600 text-sm font-medium hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting || validItems.length === 0}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting && <Loader2 size={15} className="animate-spin" />}
            {submitting ? "Submitting…" : "Submit Request"}
          </button>
        </div>
      </div>

      {/* Product picker modal */}
      {showPicker && (
        <ProductPicker
          catalog={catalog}
          onSelect={handlePickProduct}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
