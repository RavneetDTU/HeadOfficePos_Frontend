import { useState, FormEvent, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Plus, X, Loader2, CheckCircle2, AlertCircle, Search, Package,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getWarehouses, getMasterData } from "../services/inventoryService";
import type { Warehouse } from "../types/inventory";


// ─── Types ────────────────────────────────────────────────────────────────────
interface OrderItem {
  id: number;
  sku: string;
  name: string;
  qty: number;
  unitCost: number;
  tax: number;
  subtotal: number;
}

interface ProductEntry {
  sku: string;
  name: string;
  unitCost: number;
}

const PURCHASE_STATUSES = ["Ordered", "Received", "Pending", "Cancelled"];
const PAYMENT_STATUSES = ["Pending", "Partial", "Paid"];

// ─── Component ────────────────────────────────────────────────────────────────
export function AddPurchase() {
  const navigate = useNavigate();
  const { user } = useAuth();

  // ── Header fields ──
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16));
  const [supplier, setSupplier] = useState("");
  const [supplierPhone, setSupplierPhone] = useState("");
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [warehouse, setWarehouse] = useState("");
  const [purchaseStatus, setPurchaseStatus] = useState("Received");
  const [paymentStatus, setPaymentStatus] = useState("Pending");
  const [notes, setNotes] = useState("");

  // ── Items ──
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // ── Product picker ──
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCatalog, setProductCatalog] = useState<ProductEntry[]>([]);
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  const [manualEntry, setManualEntry] = useState(false);
  const [manualSku, setManualSku] = useState("");
  const [manualName, setManualName] = useState("");
  const [manualCost, setManualCost] = useState("0");
  const searchRef = useRef<HTMLInputElement>(null);

  // ── Submit state ──
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Load warehouses & master product catalog ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true);
      try {
        const whs = await getWarehouses();
        setWarehousesList(whs);
        const defaultWh = whs.some((w) => w.name === user?.warehouse)
          ? user?.warehouse
          : (whs.length > 0 ? whs[0].name : "");
        setWarehouse(defaultWh || "");

        const data = await getMasterData();
        const catalog: ProductEntry[] = data.products.map((p) => ({
          sku: p.sku,
          name: p.name,
          unitCost: p.costPrice,
        }));
        setProductCatalog(catalog);
      } catch { /* silent fallback */ } finally {
        setIsLoadingProducts(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    if (showProductPicker && !manualEntry) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showProductPicker, manualEntry]);

  const filteredCatalog = productCatalog.filter((p) => {
    const q = productSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  // ── Item helpers ──────────────────────────────────────────────────────────
  const addItemToOrder = (product: ProductEntry) => {
    const newItem: OrderItem = {
      id: Date.now(),
      sku: product.sku,
      name: product.name,
      qty: 1,
      unitCost: product.unitCost,
      tax: 15,
      subtotal: product.unitCost,
    };
    setOrderItems((prev) => [...prev, newItem]);
  };

  const handlePickProduct = (p: ProductEntry) => {
    setShowProductPicker(false);
    setProductSearch("");
    setManualEntry(false);
    addItemToOrder(p);
  };

  const handleManualAdd = () => {
    if (!manualName.trim() || !manualSku.trim()) return;
    handlePickProduct({ sku: manualSku.trim(), name: manualName.trim(), unitCost: parseFloat(manualCost) || 0 });
    setManualSku(""); setManualName(""); setManualCost("0");
  };

  const removeItem = (id: number) => setOrderItems((prev) => prev.filter((i) => i.id !== id));

  const updateItem = (id: number, field: keyof OrderItem, value: unknown) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        const updated = { ...item, [field]: value };
        updated.subtotal = updated.unitCost * updated.qty * (1 + updated.tax / 100);
        return updated;
      })
    );
  };

  // ── Totals ──
  const subtotal = orderItems.reduce((acc, i) => acc + i.unitCost * i.qty, 0);
  const taxAmount = orderItems.reduce((acc, i) => acc + (i.unitCost * i.qty * i.tax) / 100, 0);
  const grandTotal = subtotal + taxAmount;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");

    if (!supplier.trim()) { setSubmitError("Supplier is required."); return; }
    if (orderItems.length === 0) { setSubmitError("Please add at least one product."); return; }

    const selectedWh = warehousesList.find((w) => w.name === warehouse);
    const payload = {
      date: new Date(date).toISOString(),
      supplier: supplier.trim(),
      supplierPhone: supplierPhone.trim() || null,
      warehouseId: selectedWh ? selectedWh.id : null,
      warehouse: selectedWh ? selectedWh.name : null,
      purchaseStatus,
      paymentStatus,
      notes,
      items: orderItems.map((item) => ({
        sku: item.sku,
        name: item.name,
        qty: item.qty,
        unitCost: item.unitCost,
        tax: item.tax,
      })),
    };

    setIsSubmitting(true);
    try {
      await apiFetch("/purchases", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setSubmitSuccess(true);
      setTimeout(() => navigate("/purchases"), 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit purchase");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setOrderItems([]);
    setSupplier("");
    setSupplierPhone("");
    setNotes("");
    setSubmitError("");
    setSubmitSuccess(false);
  };

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span>Purchases</span><span>/</span>
        <span className="text-gray-900 font-medium">Add Purchase</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Purchase</h2>
            <p className="text-sm text-gray-500">Fields marked with * are required.</p>
          </div>

          {/* Success */}
          {submitSuccess && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
              <CheckCircle2 size={16} />
              Purchase submitted successfully! Redirecting…
            </div>
          )}

          {/* Error */}
          {submitError && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
              <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
              {submitError}
            </div>
          )}

          {/* ── Row 1: Date / Warehouse / Purchase Status / Payment Status ── */}
          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Date *</label>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Warehouse *</label>
              <select
                value={warehouse}
                onChange={(e) => setWarehouse(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
              >
                {warehousesList.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Purchase Status *</label>
              <select
                value={purchaseStatus}
                onChange={(e) => setPurchaseStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PURCHASE_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Payment Status</label>
              <select
                value={paymentStatus}
                onChange={(e) => setPaymentStatus(e.target.value)}
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                {PAYMENT_STATUSES.map((s) => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* ── Row 2: Supplier / Supplier Phone / Notes ── */}
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier *</label>
              <input
                type="text"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                placeholder="e.g. Hearing Aid Labs - HEAD OFFICE"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Supplier Phone</label>
              <input
                type="text"
                value={supplierPhone}
                onChange={(e) => setSupplierPhone(e.target.value)}
                placeholder="e.g. 082 123 4567"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Notes</label>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* ── Product Items ── */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-gray-900">Order Items</h3>
              <button
                type="button"
                onClick={() => { setShowProductPicker(!showProductPicker); setManualEntry(false); setProductSearch(""); }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors"
              >
                <Plus size={14} /> Add Product
              </button>
            </div>

            {/* Product Picker */}
            {showProductPicker && (
              <div className="border border-blue-200 rounded-lg bg-blue-50 p-3 mb-3">
                <div className="flex gap-2 mb-3">
                  <button
                    type="button"
                    onClick={() => setManualEntry(false)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${!manualEntry ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                  >From History</button>
                  <button
                    type="button"
                    onClick={() => setManualEntry(true)}
                    className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${manualEntry ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}
                  >Manual Entry</button>
                </div>

                {!manualEntry && (
                  <>
                    <div className="relative mb-1">
                      <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                      <input
                        ref={searchRef}
                        type="text"
                        placeholder="Search by name or SKU…"
                        value={productSearch}
                        onChange={(e) => setProductSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <p className="text-[10px] text-gray-400 mb-2 px-1">
                      Showing up to 80 items. Type to filter all {productCatalog.length} products.
                    </p>
                    {isLoadingProducts && (
                      <div className="flex items-center justify-center gap-2 py-6 text-gray-500 text-xs">
                        <Loader2 size={14} className="animate-spin" /> Loading master product catalog…
                      </div>
                    )}
                    {!isLoadingProducts && productCatalog.length === 0 && (
                      <div className="text-center py-6 text-xs text-gray-500">
                        <Package size={28} className="mx-auto mb-1 text-gray-300" />
                        No products found.<br />Use <strong>Manual Entry</strong>.
                      </div>
                    )}
                    {!isLoadingProducts && filteredCatalog.length > 0 && (
                      <div className="max-h-56 overflow-y-auto grid grid-cols-2 gap-2">
                        {filteredCatalog.slice(0, 80).map((p) => (
                          <button
                            type="button"
                            key={p.sku}
                            onClick={() => handlePickProduct(p)}
                            className="flex items-start gap-2 p-2.5 bg-white border border-gray-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
                          >
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                              <p className="text-xs text-gray-500">{p.sku} • R {p.unitCost.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                    {!isLoadingProducts && productCatalog.length > 0 && filteredCatalog.length === 0 && (
                      <div className="text-center py-4 text-xs text-gray-500">
                        No match — try <strong>Manual Entry</strong>.
                      </div>
                    )}
                  </>
                )}

                {manualEntry && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">SKU *</label>
                        <input
                          type="text"
                          value={manualSku}
                          onChange={(e) => setManualSku(e.target.value)}
                          placeholder="Enter SKU"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-0.5">Unit Cost (ZAR) *</label>
                        <input
                          type="text"
                          inputMode="decimal"
                          min={0}
                          value={manualCost === "0" ? "" : manualCost}
                          onChange={(e) => {
                            const raw = e.target.value.replace(/[^0-9.]/g, "");
                            setManualCost(raw === "" ? "0" : raw);
                          }}
                          placeholder="0.00"
                          className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-0.5">Product Name *</label>
                      <input
                        type="text"
                        value={manualName}
                        onChange={(e) => setManualName(e.target.value)}
                        placeholder="e.g. Hearing Aid"
                        className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => { setShowProductPicker(false); setManualEntry(false); setProductSearch(""); }}
                        className="flex-1 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleManualAdd}
                        disabled={!manualName.trim() || !manualSku.trim()}
                        className="flex-1 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        Add to Order
                      </button>
                    </div>
                  </div>
                )}

                {!manualEntry && (
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={() => { setShowProductPicker(false); setProductSearch(""); }}
                      className="px-4 py-1.5 bg-red-500 hover:bg-red-600 text-white rounded text-xs font-medium transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Items Table */}
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-2 py-2 text-left font-medium">Product Name (SKU)</th>
                    <th className="px-2 py-2 text-center font-medium">Unit Cost</th>
                    <th className="px-2 py-2 text-center font-medium">Qty</th>
                    <th className="px-2 py-2 text-center font-medium">Tax %</th>
                    <th className="px-2 py-2 text-right font-medium">Subtotal (ZAR)</th>
                    <th className="px-2 py-2" />
                  </tr>
                </thead>
                <tbody>
                  {orderItems.length === 0 && (
                    <tr>
                      <td colSpan={6} className="px-2 py-8 text-center text-gray-400">
                        <div className="text-2xl mb-1">📦</div>
                        No items added yet — click "Add Product" above
                      </td>
                    </tr>
                  )}
                  {orderItems.map((item) => (
                    <tr key={item.id} className="border-t border-gray-100 bg-white">
                      <td className="px-2 py-2">
                        <p className="font-medium text-gray-900">{item.name}</p>
                        <p className="text-gray-500">{item.sku}</p>
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.unitCost}
                          onChange={(e) => updateItem(item.id, "unitCost", parseFloat(e.target.value))}
                          className="w-24 px-1.5 py-1 border border-gray-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.qty}
                          min={1}
                          onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value))}
                          className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <input
                          type="number"
                          value={item.tax}
                          min={0} max={100}
                          onChange={(e) => updateItem(item.id, "tax", parseFloat(e.target.value))}
                          className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center"
                        />
                      </td>
                      <td className="px-2 py-2 text-right font-semibold text-gray-900">
                        R {item.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-2 py-2">
                        <button
                          type="button"
                          onClick={() => removeItem(item.id)}
                          className="text-red-400 hover:text-red-600 transition-colors"
                        >
                          <X size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                {orderItems.length > 0 && (
                  <tfoot className="bg-gray-50 border-t border-gray-200">
                    <tr>
                      <td colSpan={4} className="px-2 py-2 text-right text-xs text-gray-500 font-medium">Subtotal</td>
                      <td className="px-2 py-2 text-right text-xs font-semibold">R {subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                      <td />
                    </tr>
                    <tr>
                      <td colSpan={4} className="px-2 py-1 text-right text-xs text-gray-500 font-medium">VAT</td>
                      <td className="px-2 py-1 text-right text-xs font-semibold">R {taxAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                      <td />
                    </tr>
                    <tr className="bg-blue-600 text-white">
                      <td colSpan={4} className="px-2 py-2 text-right text-xs font-bold">Grand Total</td>
                      <td className="px-2 py-2 text-right text-sm font-bold">R {grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                      <td />
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={isSubmitting || submitSuccess}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <><Loader2 size={14} className="animate-spin" />Submitting…</>
              ) : "Submit Purchase"}
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
            >
              Reset
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
