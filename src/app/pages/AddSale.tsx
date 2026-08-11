import React, { useState, FormEvent, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Plus, Clock, X, Loader2, CheckCircle2, AlertCircle,
  Search, Package, FileText, FileCheck, ShoppingCart,
  Info, Calendar, User, Phone, Building2, Tag,
} from "lucide-react";
import { BackorderModal } from "../components/modals/BackorderModal";
import { apiFetch } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { getWarehouses, getStores, getMasterData, getStoreInventory, getMyStoreInventory } from "../services/inventoryService";
import type { Warehouse } from "../types/inventory";

// ─── Types ────────────────────────────────────────────────────────────────────

interface OrderItem {
  id: number;
  name: string;
  sku: string;
  serialNo1: string;
  serialNo2: string;
  unitCost: number;
  qty: number;
  discount: number;
  tax: number;
  subtotal: number;
  isBackorder: boolean;
}

interface ProductEntry {
  sku: string;
  name: string;
  unitCost: number;
  qty?: number;  // warehouse available quantity
}

const PAID_BY_OPTIONS = ["Cash", "Card", "EFT", "Medical Aid", "Other"];

// ─── Document Types ───────────────────────────────────────────────────────────
type DocumentType = "quote" | "proforma" | "sale";

const DOCUMENT_TYPES: { id: DocumentType; label: string; description: string; icon: React.ReactNode; color: string }[] = [
  {
    id: "quote",
    label: "Add Quote",
    description: "Create a price estimate for a customer. No stock is reserved and no payment is required.",
    icon: <FileText size={22} />,
    color: "violet",
  },
  {
    id: "proforma",
    label: "Add Proforma",
    description: "Issue a preliminary invoice before the final sale is confirmed. Used for import/export or advance orders.",
    icon: <FileCheck size={22} />,
    color: "amber",
  },
  {
    id: "sale",
    label: "Add Sale",
    description: "Record a completed or pending sale. Stock is deducted and payment is tracked.",
    icon: <ShoppingCart size={22} />,
    color: "blue",
  },
];

// ─── Shared field styles ──────────────────────────────────────────────────────
const inp = "w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500";
const lbl = "block text-xs font-medium text-gray-700 mb-1";

// ─── Component ────────────────────────────────────────────────────────────────

export function AddSale() {
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();

  // ── Document type ──
  const [docType, setDocType] = useState<DocumentType>(() => {
    if (window.location.pathname.includes("quotation")) return "quote";
    if (window.location.pathname.includes("proforma")) return "proforma";
    return "sale";
  });

  // ── Shared header fields ──
  const [date, setDate] = useState(() => {
    const now = new Date();
    const tzOffset = now.getTimezoneOffset() * 60000;
    return new Date(now.getTime() - tzOffset).toISOString().slice(0, 16);
  });
  const [warehousesList, setWarehousesList] = useState<Warehouse[]>([]);
  const [warehouse, setWarehouse] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [biller, setBiller] = useState(user?.username ?? "");

  // ── Sale-only fields ──
  const [paidBy, setPaidBy] = useState("Cash");
  const [discount, setDiscount] = useState(0);
  const [backorderNotes, setBackorderNotes] = useState("");

  // ── Quote-only fields ──
  const [quoteValidDays, setQuoteValidDays] = useState(30);
  const [quoteNotes, setQuoteNotes] = useState("");

  // ── Proforma-only fields ──
  const [proformaAdvancePercent, setProformaAdvancePercent] = useState(0);
  const [proformaPaymentMethod, setProformaPaymentMethod] = useState("EFT");
  const [proformaPurpose, setProformaPurpose] = useState("Import");
  const [proformaNotes, setProformaNotes] = useState("");

  // ── Items ──
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [backorderModal, setBackorderModal] = useState<{ open: boolean; product: ProductEntry | null }>({ open: false, product: null });

  // ── Product picker state ──
  const [showProductPicker, setShowProductPicker] = useState(false);
  const [productSearch, setProductSearch] = useState("");
  const [productCatalog, setProductCatalog] = useState<ProductEntry[]>([]);
  const [masterCatalog, setMasterCatalog] = useState<ProductEntry[]>([]);
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

  // ── Reset when switching doc type ──
  const switchDocType = (t: DocumentType) => {
    setDocType(t);
    setSubmitError("");
    setSubmitSuccess(false);
    setOrderItems([]);
    setCustomerName("");
    setCustomerPhone("");
    setShowProductPicker(false);
  };

  // ── Load warehouses & master product catalog ──────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoadingProducts(true);
      try {
        const [whs, sts] = await Promise.all([
          getWarehouses().catch(() => []),
          getStores().catch(() => [])
        ]);
        let combined = [...whs, ...sts];
        
        if (combined.length === 0) {
          // If we couldn't load any warehouses/stores (likely non-admin),
          // try to load the logged-in user's store inventory
          try {
            const res = await getMyStoreInventory();
            if (res && res.store_name) {
              combined = [{
                id: res.store_id,
                name: res.store_name,
                code: `ST-${res.store_id}`,
                type: "store" as const,
                status: "Active" as const,
                created_at: new Date().toISOString()
              }];
            }
          } catch (err) {
            console.error("Failed to load fallback store:", err);
          }
        }
        
        setWarehousesList(combined);
        const defaultWh = combined.some((w) => w.name === user?.warehouse)
          ? user?.warehouse
          : (combined.length > 0 ? combined[0].name : "");
        setWarehouse(defaultWh || "");
      } catch (err) {
        console.error("Failed to load locations:", err);
      }

      try {
        const data = await getMasterData();
        const catalog: ProductEntry[] = data.products.map((p) => ({
          sku: p.sku,
          name: p.name,
          unitCost: p.sellingPrice,
        }));
        setMasterCatalog(catalog);
      } catch (err) {
        console.error("Failed to load master catalog:", err);
      } finally {
        setIsLoadingProducts(false);
      }
    };
    load();
  }, [user]);

  useEffect(() => {
    const updateCatalog = async () => {
      if (docType !== "sale") {
        setProductCatalog(masterCatalog);
        return;
      }

      if (!warehouse || warehousesList.length === 0) {
        setProductCatalog([]);
        return;
      }

      setIsLoadingProducts(true);
      try {
        // Use GET /sales/stock — the ONLY endpoint that returns real-time deducted
        // warehouse stock (inStock field). /warehouse/{id}/inventory only has initial
        // opening stock and never decrements on sales/transfers.
        let items: any[] = [];
        if (!isAdmin) {
          // Non-admin: fall back to their own store inventory
          const res = await getMyStoreInventory();
          items = res.items.map((i: any) => ({
            sku: i.sku,
            name: i.name || i.product_name,
            inStock: i.quantity ?? 0,
            available: i.quantity ?? 0,
            selling_price: i.selling_price ?? 0,
          }));
        } else {
          items = await apiFetch<any[]>("/sales/stock").catch(() => []);
        }

        // Only products with live warehouse stock > 0
        const availableItems = items.filter(
          (item) => (item.inStock ?? item.available ?? item.quantity ?? 0) > 0
        );

        const mapped: ProductEntry[] = availableItems.map((item) => ({
          sku: item.sku,
          name: item.name || item.product_name,
          unitCost: item.selling_price ?? item.unitCost ?? 0,
          qty: item.inStock ?? item.available ?? item.quantity ?? 0,
        }));

        setProductCatalog(mapped);
      } catch (err) {
        console.error("Failed to load warehouse stock for sale:", err);
        setProductCatalog([]);
      } finally {
        setIsLoadingProducts(false);
      }
    };

    updateCatalog();
  }, [warehouse, docType, masterCatalog, warehousesList, isAdmin, user]);

  useEffect(() => {
    if (showProductPicker && !manualEntry) setTimeout(() => searchRef.current?.focus(), 50);
  }, [showProductPicker, manualEntry]);

  const filteredCatalog = productCatalog.filter((p) => {
    const q = productSearch.toLowerCase();
    return !q || p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
  });

  // ── Product helpers ──────────────────────────────────────────────────────
  const handlePickProduct = (product: ProductEntry) => {
    setShowProductPicker(false);
    setProductSearch("");
    setManualEntry(false);
    addItemToOrder(product, false);
  };

  const handleManualAdd = () => {
    if (!manualName.trim() || !manualSku.trim()) return;
    const product: ProductEntry = {
      sku: manualSku.trim(),
      name: manualName.trim(),
      unitCost: parseFloat(manualCost) || 0,
    };
    handlePickProduct(product);
    setManualSku("");
    setManualName("");
    setManualCost("0");
  };

  const addItemToOrder = (product: ProductEntry, isBackorder: boolean) => {
    setOrderItems((prev) => [...prev, {
      id: Date.now(), name: product.name, sku: product.sku,
      serialNo1: "", serialNo2: "", unitCost: product.unitCost,
      qty: 1, discount: 0, tax: 15,
      subtotal: product.unitCost, isBackorder,
    }]);
  };

  const removeItem = (id: number) => setOrderItems((prev) => prev.filter((i) => i.id !== id));
  const updateItem = (id: number, field: keyof OrderItem, value: unknown) => {
    setOrderItems((prev) => prev.map((item) => {
      if (item.id !== id) return item;
      const updated = { ...item, [field]: value };
      updated.subtotal = updated.unitCost * updated.qty * (1 - updated.discount / 100);
      return updated;
    }));
  };

  // ── Totals ──
  const hasBackorderItems = orderItems.some((i) => i.isBackorder);
  const subtotal = orderItems.reduce((acc, i) => acc + i.subtotal, 0);
  const taxAmount = orderItems.reduce((acc, i) => acc + (i.subtotal * i.tax) / 100, 0);
  const grandTotal = subtotal + taxAmount;
  const advanceAmount = (grandTotal * proformaAdvancePercent) / 100;

  // ── Submit ────────────────────────────────────────────────────────────────
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitError("");
    if (!customerName.trim()) { setSubmitError("Customer name is required."); return; }
    if (orderItems.length === 0) { setSubmitError("Please add at least one product."); return; }

    const selectedLoc = warehousesList.find((w) => w.name === warehouse);
    const storeIdVal = selectedLoc && selectedLoc.type === "store" ? selectedLoc.id : null;
    const warehouseNameVal = selectedLoc ? selectedLoc.name : null;

    let endpoint = "/sales";
    let payload: Record<string, unknown> = {};

    if (docType === "quote") {
      endpoint = "/quotes";
      payload = {
        date: new Date(date).toISOString(),
        storeId: storeIdVal,
        warehouse: warehouseNameVal,
        biller: biller.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        validDays: quoteValidDays,
        notes: quoteNotes.trim() || null,
        items: orderItems.map((item) => ({
          sku: item.sku || null,
          name: item.name,
          qty: item.qty,
          unitCost: item.unitCost,
          discount: item.discount,
          tax: item.tax,
          serialNo1: item.serialNo1 || null,
          serialNo2: item.serialNo2 || null,
        })),
      };
    } else if (docType === "proforma") {
      endpoint = "/proforma";
      payload = {
        date: new Date(date).toISOString(),
        storeId: storeIdVal,
        warehouse: warehouseNameVal,
        biller: biller.trim(),
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        purpose: proformaPurpose || null,
        paymentMethod: proformaPaymentMethod || null,
        advancePercent: proformaAdvancePercent,
        notes: proformaNotes.trim() || null,
        items: orderItems.map((item) => ({
          sku: item.sku || null,
          name: item.name,
          qty: item.qty,
          unitCost: item.unitCost,
          discount: item.discount,
          tax: item.tax,
          serialNo1: item.serialNo1 || null,
          serialNo2: item.serialNo2 || null,
        })),
      };
    } else {
      endpoint = "/sales";
      payload = {
        date: new Date(date).toISOString(),
        storeId: storeIdVal,
        warehouse: warehouseNameVal,
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim() || null,
        biller: biller.trim(),
        paidBy: paidBy || null,
        discount: discount,
        backorderNotes: backorderNotes.trim() || null,
        items: orderItems.map((item) => ({
          sku: item.sku || null,
          name: item.name,
          qty: item.qty,
          unitCost: item.unitCost,
          serialNo1: item.serialNo1 || null,
          serialNo2: item.serialNo2 || null,
          discount: item.discount,
          tax: item.tax,
          isBackorder: item.isBackorder,
        })),
      };
    }

    setIsSubmitting(true);
    try {
      await apiFetch(endpoint, { method: "POST", body: JSON.stringify(payload) });
      setSubmitSuccess(true);
      setTimeout(() => {
        if (docType === "quote") navigate("/quotations");
        else if (docType === "proforma") navigate("/proforma");
        else navigate("/sales");
      }, 1500);
    } catch (err: unknown) {
      setSubmitError(err instanceof Error ? err.message : "Failed to submit");
    } finally { setIsSubmitting(false); }
  };

  const handleReset = () => {
    setOrderItems([]); setBackorderNotes(""); setCustomerName("");
    setCustomerPhone(""); setDiscount(0); setSubmitError(""); setSubmitSuccess(false);
    setQuoteNotes(""); setProformaNotes("");
  };

  // ── Product Picker Panel (shared) ─────────────────────────────────────────
  const ProductPicker = (
    <div className="border border-blue-200 rounded-lg bg-blue-50 p-3 mb-3">
      <div className="flex gap-2 mb-3">
        <button type="button" onClick={() => setManualEntry(false)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${!manualEntry ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          From History
        </button>
        <button type="button" onClick={() => setManualEntry(true)}
          className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${manualEntry ? "bg-blue-600 text-white" : "bg-white text-gray-600 hover:bg-gray-100"}`}>
          Manual Entry
        </button>
      </div>

      {!manualEntry && (
        <>
          <div className="relative mb-1">
            <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input ref={searchRef} type="text" placeholder="Search by name or SKU…" value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-gray-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
              No products found.<br />Use <strong>Manual Entry</strong> to add a product.
            </div>
          )}
          {!isLoadingProducts && filteredCatalog.length > 0 && (
            <div className="max-h-56 overflow-y-auto grid grid-cols-2 gap-2">
              {filteredCatalog.slice(0, 80).map((p) => (
                <button key={p.sku} type="button" onClick={() => handlePickProduct(p)}
                  className="flex items-start gap-2 p-2.5 bg-white border border-gray-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-gray-900 truncate">{p.name}</p>
                    <p className="text-xs text-gray-500">{p.sku} • R {p.unitCost.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</p>
                    {p.qty !== undefined && (
                      <p className="text-[10px] font-semibold mt-0.5 text-blue-700">In Stock: {p.qty}</p>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
          {!isLoadingProducts && productCatalog.length > 0 && filteredCatalog.length === 0 && (
            <div className="text-center py-4 text-xs text-gray-500">
              No match for "{productSearch}" — try <strong>Manual Entry</strong>.
            </div>
          )}
        </>
      )}

      {manualEntry && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">SKU *</label>
              <input type="text" value={manualSku} onChange={(e) => setManualSku(e.target.value)}
                placeholder="Enter SKU"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-0.5">Unit Price (ZAR) *</label>
              <input type="text" inputMode="decimal" min={0} value={manualCost === "0" ? "" : manualCost}
                onChange={(e) => {
                  const raw = e.target.value.replace(/[^0-9.]/g, "");
                  setManualCost(raw === "" ? "0" : raw);
                }}
                placeholder="0.00"
                className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-0.5">Product Name *</label>
            <input type="text" value={manualName} onChange={(e) => setManualName(e.target.value)}
              placeholder="e.g. Hearing Aid"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500" />
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
  );

  // ── Order Items Table (shared) ─────────────────────────────────────────────
  const OrderItemsTable = (
    <div className="border border-gray-200 rounded-lg overflow-hidden">
      <table className="w-full text-xs">
        <thead className="bg-blue-600 text-white">
          <tr>
            <th className="px-2 py-2 text-left font-medium">Product Name (SKU)</th>
            <th className="px-2 py-2 text-center font-medium">Stock Type</th>
            <th className="px-2 py-2 text-left font-medium">Serial No 1</th>
            <th className="px-2 py-2 text-left font-medium">Serial No 2</th>
            <th className="px-2 py-2 text-center font-medium">Unit Price</th>
            <th className="px-2 py-2 text-center font-medium">Qty</th>
            <th className="px-2 py-2 text-center font-medium">Discount %</th>
            <th className="px-2 py-2 text-center font-medium">Tax %</th>
            <th className="px-2 py-2 text-right font-medium">Subtotal (ZAR)</th>
            <th className="px-2 py-2" />
          </tr>
        </thead>
        <tbody>
          {orderItems.length === 0 && (
            <tr>
              <td colSpan={10} className="px-2 py-8 text-center text-gray-400">
                <div className="text-2xl mb-1">📦</div>
                No items added yet — click "Add Product" above
              </td>
            </tr>
          )}
          {orderItems.map((item) => (
            <tr key={item.id} className={`border-t border-gray-100 ${item.isBackorder ? "bg-orange-50" : "bg-white"}`}>
              <td className="px-2 py-2">
                <div>
                  <p className="font-medium text-gray-900">{item.name}</p>
                  <p className="text-gray-500">{item.sku}</p>
                  {item.isBackorder && (
                    <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 bg-orange-100 text-orange-700 rounded text-xs font-medium">
                      <Clock size={10} /> Awaiting Stock
                    </span>
                  )}
                </div>
              </td>
              <td className="px-2 py-2 text-center">
                <button
                  type="button"
                  onClick={() => updateItem(item.id, "isBackorder", !item.isBackorder)}
                  className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold transition-all ${
                    item.isBackorder
                      ? "bg-orange-100 text-orange-700 hover:bg-orange-200"
                      : "bg-green-100 text-green-700 hover:bg-green-200"
                  }`}
                >
                  {item.isBackorder ? "Backorder" : "In Stock"}
                </button>
              </td>
              <td className="px-2 py-2"><input type="text" value={item.serialNo1} onChange={(e) => updateItem(item.id, "serialNo1", e.target.value)} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs" placeholder="SN1" /></td>
              <td className="px-2 py-2"><input type="text" value={item.serialNo2} onChange={(e) => updateItem(item.id, "serialNo2", e.target.value)} className="w-full px-1.5 py-1 border border-gray-200 rounded text-xs" placeholder="SN2" /></td>
              <td className="px-2 py-2"><input type="number" value={item.unitCost === 0 ? "" : item.unitCost} onChange={(e) => updateItem(item.id, "unitCost", parseFloat(e.target.value) || 0)} className="w-20 px-1.5 py-1 border border-gray-200 rounded text-xs text-center" /></td>
              <td className="px-2 py-2"><input type="number" value={item.qty} min={1} onChange={(e) => updateItem(item.id, "qty", parseInt(e.target.value))} className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center" /></td>
              <td className="px-2 py-2"><input type="number" value={item.discount} min={0} max={100} onChange={(e) => updateItem(item.id, "discount", parseFloat(e.target.value))} className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center" /></td>
              <td className="px-2 py-2"><input type="number" value={item.tax} min={0} max={100} onChange={(e) => updateItem(item.id, "tax", parseFloat(e.target.value))} className="w-14 px-1.5 py-1 border border-gray-200 rounded text-xs text-center" /></td>
              <td className="px-2 py-2 text-right font-semibold text-gray-900">R {item.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
              <td className="px-2 py-2"><button type="button" onClick={() => removeItem(item.id)} className="text-red-400 hover:text-red-600 transition-colors"><X size={14} /></button></td>
            </tr>
          ))}
        </tbody>
        {orderItems.length > 0 && (
          <tfoot className="bg-gray-50 border-t border-gray-200">
            <tr>
              <td colSpan={8} className="px-2 py-2 text-right text-xs text-gray-500 font-medium">Subtotal</td>
              <td className="px-2 py-2 text-right text-xs font-semibold">R {subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={8} className="px-2 py-1 text-right text-xs text-gray-500 font-medium">VAT</td>
              <td className="px-2 py-1 text-right text-xs font-semibold">R {taxAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
              <td />
            </tr>
            <tr className="bg-blue-600 text-white">
              <td colSpan={8} className="px-2 py-2 text-right text-xs font-bold">Grand Total</td>
              <td className="px-2 py-2 text-right text-sm font-bold">R {grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
              <td />
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span>Sales</span><span>/</span>
        <span className="text-gray-900 font-medium">
          {DOCUMENT_TYPES.find(d => d.id === docType)?.label ?? "Add Sale"}
        </span>
      </div>

      {/* ── SELECT DOCUMENT TYPE ── */}
      <div className="mb-5">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Select Document Type</p>
        <div className="grid grid-cols-3 gap-4">
          {DOCUMENT_TYPES.map((dt) => {
            const isSelected = docType === dt.id;
            return (
              <button key={dt.id} type="button" onClick={() => switchDocType(dt.id)}
                className={`relative text-left p-4 rounded-xl border-2 transition-all shadow-sm bg-white ${isSelected ? "border-violet-500 shadow-violet-100" : "border-gray-200 hover:border-gray-300 hover:shadow-md"
                  }`}>
                {isSelected && <span className="absolute top-3 right-3 w-2.5 h-2.5 rounded-full bg-violet-500" />}
                {/* Icon + Title on same line */}
                <div className="flex items-center gap-2.5 mb-2">
                  <span className={`flex-shrink-0 ${isSelected ? "text-violet-600" : "text-gray-400"}`}>{dt.icon}</span>
                  <p className={`text-sm font-semibold leading-tight ${isSelected ? "text-violet-700" : "text-gray-800"}`}>{dt.label}</p>
                </div>
                <p className="text-xs text-gray-500 leading-relaxed">{dt.description}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          ADD QUOTE FORM
      ══════════════════════════════════════════════════════════════════════ */}
      {docType === "quote" && (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center flex-shrink-0">
                <FileText size={20} className="text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Quote</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Price estimate only — no stock is reserved and no payment is required.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-violet-50 border border-violet-200 rounded-lg text-xs font-medium text-violet-700">
                <Info size={13} /> No stock reserved
              </div>
            </div>

            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={lbl}><Calendar size={11} className="inline mr-1" />Date *</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}><User size={11} className="inline mr-1" />Prepared By *</label>
                <input type="text" value={biller} onChange={(e) => setBiller(e.target.value)} placeholder="Your name" className={inp} />
              </div>
              <div>
                <label className={lbl}><Tag size={11} className="inline mr-1" />Valid For (Days)</label>
                <input type="number" min={1} value={quoteValidDays} onChange={(e) => setQuoteValidDays(parseInt(e.target.value) || 30)} className={inp} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div>
                <label className={lbl}><User size={11} className="inline mr-1" />Customer Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. John Doe" className={inp} />
              </div>
              <div>
                <label className={lbl}><Phone size={11} className="inline mr-1" />Customer Phone</label>
                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g. 082 123 4567" className={inp} />
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Quote Items</h3>
                <button type="button" onClick={() => { setShowProductPicker(!showProductPicker); setManualEntry(false); setProductSearch(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-violet-600 text-white rounded-lg text-xs font-medium hover:bg-violet-700 transition-colors">
                  <Plus size={14} /> Add Product
                </button>
              </div>
              {showProductPicker && ProductPicker}
              {OrderItemsTable}
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className={lbl}>Quote Notes / Terms & Conditions</label>
              <textarea rows={3} value={quoteNotes} onChange={(e) => setQuoteNotes(e.target.value)}
                placeholder="Add any notes, conditions, or terms for this quote..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-violet-500 resize-none" />
            </div>

            {/* Expiry notice */}
            <div className="mb-5 p-3 bg-violet-50 border border-violet-200 rounded-lg flex items-start gap-2 text-xs text-violet-700">
              <Info size={14} className="flex-shrink-0 mt-0.5" />
              This quote will be valid for <strong className="mx-1">{quoteValidDays} days</strong> from the date above.
              Grand total: <strong className="ml-1">R {grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</strong>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button id="submit-sale-btn" type="submit" disabled={isSubmitting || submitSuccess}
                className="flex items-center gap-2 px-5 py-2 bg-violet-600 text-white rounded-lg text-sm font-medium hover:bg-violet-700 transition-colors disabled:opacity-60">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Quote"}
              </button>
              <button type="button" onClick={handleReset}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD PROFORMA FORM
      ══════════════════════════════════════════════════════════════════════ */}
      {docType === "proforma" && (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            {/* Header */}
            <div className="flex items-start gap-3 mb-5 pb-4 border-b border-gray-100">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center flex-shrink-0">
                <FileCheck size={20} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Add Proforma Invoice</h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Preliminary invoice — used for import/export or advance orders before the final sale is confirmed.
                </p>
              </div>
              <div className="ml-auto flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-200 rounded-lg text-xs font-medium text-amber-700">
                <Info size={13} /> Advance payment
              </div>
            </div>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> Proforma submitted successfully! Redirecting…
              </div>
            )}
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{submitError}
              </div>
            )}

            {/* Row 1 */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className={lbl}><Calendar size={11} className="inline mr-1" />Date *</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}><User size={11} className="inline mr-1" />Prepared By *</label>
                <input type="text" value={biller} onChange={(e) => setBiller(e.target.value)} placeholder="Your name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Purpose</label>
                <select value={proformaPurpose} onChange={(e) => setProformaPurpose(e.target.value)} className={inp}>
                  {["Import", "Export", "Advance Order", "Insurance", "Other"].map((p) => <option key={p}>{p}</option>)}
                </select>
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className={lbl}><User size={11} className="inline mr-1" />Customer Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. John Doe" className={inp} />
              </div>
              <div>
                <label className={lbl}><Phone size={11} className="inline mr-1" />Customer Phone</label>
                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g. 082 123 4567" className={inp} />
              </div>
              <div>
                <label className={lbl}>Payment Method</label>
                <select value={proformaPaymentMethod} onChange={(e) => setProformaPaymentMethod(e.target.value)} className={inp}>
                  {PAID_BY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
            </div>

            {/* Order Items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Proforma Items</h3>
                <button type="button" onClick={() => { setShowProductPicker(!showProductPicker); setManualEntry(false); setProductSearch(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors">
                  <Plus size={14} /> Add Product
                </button>
              </div>
              {showProductPicker && ProductPicker}
              {OrderItemsTable}
            </div>

            {/* Advance Payment section */}
            <div className="mb-5 p-4 bg-amber-50 border border-amber-200 rounded-lg">
              <p className="text-xs font-semibold text-amber-800 mb-3">Advance Payment</p>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Advance % of Grand Total</label>
                  <input type="number" min={0} max={100} value={proformaAdvancePercent}
                    onChange={(e) => setProformaAdvancePercent(parseFloat(e.target.value) || 0)} className={inp} />
                </div>
                <div>
                  <label className={lbl}>Advance Amount (ZAR)</label>
                  <input type="text" readOnly value={`R ${advanceAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`}
                    className="w-full px-2 py-1.5 border border-amber-300 rounded text-sm bg-amber-100 text-amber-800 font-semibold" />
                </div>
                <div>
                  <label className={lbl}>Balance Due (ZAR)</label>
                  <input type="text" readOnly value={`R ${(grandTotal - advanceAmount).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`}
                    className="w-full px-2 py-1.5 border border-gray-200 rounded text-sm bg-gray-50 font-semibold" />
                </div>
              </div>
            </div>

            {/* Notes */}
            <div className="mb-5">
              <label className={lbl}>Proforma Notes</label>
              <textarea rows={3} value={proformaNotes} onChange={(e) => setProformaNotes(e.target.value)}
                placeholder="Add any notes, delivery terms, or special conditions..."
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-amber-500 resize-none" />
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button id="submit-sale-btn" type="submit" disabled={isSubmitting || submitSuccess}
                className="flex items-center gap-2 px-5 py-2 bg-amber-500 text-white rounded-lg text-sm font-medium hover:bg-amber-600 transition-colors disabled:opacity-60">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Proforma"}
              </button>
              <button type="button" onClick={handleReset}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          ADD SALE FORM  (original, unchanged)
      ══════════════════════════════════════════════════════════════════════ */}
      {docType === "sale" && (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg border border-gray-200 p-5">
            <div className="mb-4">
              <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Sale</h2>
              <p className="text-sm text-gray-500">Fields marked with * are required.</p>
            </div>

            {submitSuccess && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm flex items-center gap-2">
                <CheckCircle2 size={16} /> Sale submitted successfully! Redirecting…
              </div>
            )}
            {submitError && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />{submitError}
              </div>
            )}

            {/* Row 1 */}
            <div className="grid grid-cols-4 gap-4 mb-4">
              <div>
                <label className={lbl}>Date *</label>
                <input type="datetime-local" value={date} onChange={(e) => setDate(e.target.value)} className={inp} />
              </div>
              <div>
                <label className={lbl}>Biller *</label>
                <input type="text" value={biller} onChange={(e) => setBiller(e.target.value)} placeholder="Biller name" className={inp} />
              </div>
              <div>
                <label className={lbl}>Paid By</label>
                <select value={paidBy} onChange={(e) => setPaidBy(e.target.value)} className={inp}>
                  {PAID_BY_OPTIONS.map((o) => <option key={o}>{o}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Order Discount (%)</label>
                <input type="number" min={0} max={100} value={discount}
                  onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)} className={inp} />
              </div>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-3 gap-4 mb-5">
              <div>
                <label className={lbl}>Warehouse *</label>
                <select value={warehouse} onChange={(e) => setWarehouse(e.target.value)} className={`${inp} bg-white`}>
                  {warehousesList.map((w) => <option key={w.id} value={w.name}>{w.name}</option>)}
                </select>
              </div>
              <div>
                <label className={lbl}>Customer Name *</label>
                <input type="text" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="e.g. John Doe" className={inp} />
              </div>
              <div>
                <label className={lbl}>Customer Phone</label>
                <input type="text" value={customerPhone} onChange={(e) => setCustomerPhone(e.target.value)} placeholder="e.g. 082 123 4567" className={inp} />
              </div>
            </div>

            {/* Items */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-900">Order Items</h3>
                <button type="button" id="open-product-picker-btn"
                  onClick={() => { setShowProductPicker(!showProductPicker); setManualEntry(false); setProductSearch(""); }}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
                  <Plus size={14} /> Add Product
                </button>
              </div>
              {showProductPicker && ProductPicker}
              {OrderItemsTable}
            </div>

            {/* Backorder Notes */}
            {hasBackorderItems && (
              <div className="mb-4 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <Clock size={15} className="text-orange-600" />
                  <p className="text-sm font-semibold text-orange-800">Backorder Items Detected</p>
                </div>
                <label className={lbl}>Backorder Notes</label>
                <textarea rows={2} value={backorderNotes} onChange={(e) => setBackorderNotes(e.target.value)}
                  placeholder="Add notes for the customer regarding expected delivery..."
                  className="w-full px-3 py-2 border border-orange-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none" />
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-2">
              <button id="submit-sale-btn" type="submit" disabled={isSubmitting || submitSuccess}
                className="flex items-center gap-2 px-5 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed">
                {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Submitting…</> : "Submit Sale"}
              </button>
              <button type="button" onClick={handleReset}
                className="px-5 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition-colors">
                Reset
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Backorder Modal */}
      <BackorderModal
        isOpen={backorderModal.open}
        onClose={() => setBackorderModal({ open: false, product: null })}
        onAddBackorder={() => {
          if (backorderModal.product) addItemToOrder(backorderModal.product, true);
          setBackorderModal({ open: false, product: null });
        }}
        productName={backorderModal.product?.name ?? ""}
        requestedQty={1}
        availableQty={0}
      />
    </div>
  );
}
