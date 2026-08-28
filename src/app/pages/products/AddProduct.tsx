import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router";
import {
  Package,
  Plus,
  Trash2,
  Upload,
  Building2,
  Tag,
  DollarSign,
  ChevronDown,
  Loader2,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  X,
} from "lucide-react";
import {
  COMMON_FX_CURRENCIES,
  convertToZar,
} from "../../lib/frankfurter";
import { createProduct, getSuppliers, getWarehouses } from "../../services/inventoryService";
import type { SupplierOut } from "../../types/inventory";

interface StockEntry {
  warehouseId: number;
  qty: number;
}

export function AddProduct() {
  const navigate = useNavigate();

  // Meta States
  const [dbWarehouses, setDbWarehouses] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierOut[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  // Form States
  const [form, setForm] = useState({
    name: "",
    code: "", // SKU
    category: "",
    subCategory: "",
    brand: "",
    model: "",
    supplierId: "",
    unit: "Unit",
    costPrice: "",
    salePrice: "",
    tax: "No Tax",
    description: "",
    imageUrl: "",
    status: "Active",
    alertQty: "",
  });

  const [stockEntries, setStockEntries] = useState<StockEntry[]>([]);

  // Action States
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  // Dynamic Price Check (Frankfurter → ZAR)
  const [fxCurrency, setFxCurrency] = useState("EUR");
  const [fxAmount, setFxAmount] = useState("");
  const [fxZar, setFxZar] = useState<number | null>(null);
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxDate, setFxDate] = useState("");
  const [fxLoading, setFxLoading] = useState(false);
  const [fxError, setFxError] = useState("");

  // Product image upload
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageFileName, setImageFileName] = useState("");
  const [imageError, setImageError] = useState("");
  const [imageProcessing, setImageProcessing] = useState(false);

  const categories = ["Hearing Aids", "Accessories", "Batteries", "Services", "Other"];
  const brands = ["Phonak", "Signia", "Oticon", "Widex", "Resound", "Starkey", "Internal", "Other"];
  const units = ["Unit", "Pack", "Pair", "Box", "Service"];
  const taxOptions = ["No Tax", "VAT 15%", "VAT 0%"];

  const selectedSupplierLabel = (() => {
    if (!form.supplierId) return "—";
    const s = suppliers.find((x) => String(x.id) === form.supplierId);
    if (!s) return "—";
    return s.company || s.name || `Supplier #${s.id}`;
  })();

  const runPriceCheck = async () => {
    const amount = Number(fxAmount);
    if (!fxAmount.trim() || !Number.isFinite(amount) || amount < 0) {
      setFxError("Enter a valid amount to convert.");
      setFxZar(null);
      setFxRate(null);
      return;
    }
    setFxLoading(true);
    setFxError("");
    try {
      const result = await convertToZar(amount, fxCurrency);
      setFxZar(result.zar);
      setFxRate(result.rate);
      setFxDate(result.date);
    } catch (e) {
      console.error("Price check failed:", e);
      setFxZar(null);
      setFxRate(null);
      setFxDate("");
      setFxError(e instanceof Error ? e.message : "Could not fetch exchange rate.");
    } finally {
      setFxLoading(false);
    }
  };

  const applyFxToCostPrice = () => {
    if (fxZar == null) return;
    updateField("costPrice", fxZar.toFixed(2));
  };

  /** Resize selected image and return a data URL suitable for preview + imageUrl. */
  const fileToDataUrl = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onerror = () => reject(new Error("Failed to read image file."));
      reader.onload = () => {
        const src = String(reader.result || "");
        const img = new Image();
        img.onload = () => {
          const maxSide = 800;
          const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
          const w = Math.max(1, Math.round(img.width * scale));
          const h = Math.max(1, Math.round(img.height * scale));
          const canvas = document.createElement("canvas");
          canvas.width = w;
          canvas.height = h;
          const ctx = canvas.getContext("2d");
          if (!ctx) {
            resolve(src);
            return;
          }
          ctx.drawImage(img, 0, 0, w, h);
          resolve(canvas.toDataURL("image/jpeg", 0.82));
        };
        img.onerror = () => reject(new Error("Invalid image file."));
        img.src = src;
      };
      reader.readAsDataURL(file);
    });

  const clearProductImage = () => {
    setImagePreview("");
    setImageFileName("");
    setImageError("");
    updateField("imageUrl", "");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleImageFile = async (file: File | undefined | null) => {
    if (!file) return;
    setImageError("");

    const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
    if (!allowed.includes(file.type)) {
      setImageError("Only PNG, JPG, or WEBP images are allowed.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setImageError("Image must be 5MB or smaller.");
      return;
    }

    setImageProcessing(true);
    try {
      const dataUrl = await fileToDataUrl(file);
      setImagePreview(dataUrl);
      setImageFileName(file.name);
      updateField("imageUrl", dataUrl);
    } catch (e) {
      console.error("Image upload failed:", e);
      setImageError(e instanceof Error ? e.message : "Failed to process image.");
      clearProductImage();
    } finally {
      setImageProcessing(false);
    }
  };

  // Fetch warehouses + suppliers on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const [whs, supplierRes] = await Promise.all([
          getWarehouses(),
          getSuppliers({ page: 1, limit: 100, status: "Active" }).catch(() => ({
            suppliers: [] as SupplierOut[],
          })),
        ]);
        setDbWarehouses(whs);
        setSuppliers(supplierRes.suppliers ?? []);
        if (whs.length > 0) {
          setStockEntries([{ warehouseId: whs[0].id, qty: 0 }]);
        }
      } catch (e) {
        console.error("Failed to load product meta:", e);
      } finally {
        setIsLoadingMeta(false);
      }
    };
    fetchMeta();
  }, []);

  const updateField = (field: string, value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const addStockEntry = () => {
    if (dbWarehouses.length > 0) {
      setStockEntries((prev) => [...prev, { warehouseId: dbWarehouses[0].id, qty: 0 }]);
    }
  };

  const updateStockEntry = (idx: number, key: keyof StockEntry, val: number) =>
    setStockEntries((prev) =>
      prev.map((e, i) => (i === idx ? { ...e, [key]: val } : e))
    );

  const removeStockEntry = (idx: number) =>
    setStockEntries((prev) => prev.filter((_, i) => i !== idx));

  const resetForm = () => {
    setForm({
      name: "",
      code: "",
      category: "",
      subCategory: "",
      brand: "",
      model: "",
      supplierId: "",
      unit: "Unit",
      costPrice: "",
      salePrice: "",
      tax: "No Tax",
      description: "",
      imageUrl: "",
      status: "Active",
      alertQty: "",
    });
    setImagePreview("");
    setImageFileName("");
    setImageError("");
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (dbWarehouses.length > 0) {
      setStockEntries([{ warehouseId: dbWarehouses[0].id, qty: 0 }]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.code.trim()) {
      setError("Product Name and Product Code / SKU are required.");
      return;
    }

    setIsSaving(true);
    setError("");
    setSuccess(false);

    try {
      // Build opening stock array with proper warehouse IDs
      const openingStock = stockEntries
        .filter((entry) => entry.qty > 0)
        .map((entry) => ({
          warehouse_id: entry.warehouseId,
          quantity: entry.qty,
        }));

      const supplierIdNum = form.supplierId ? Number(form.supplierId) : undefined;

      const payload = {
        name: form.name.trim(),
        sku: form.code.trim(),
        category: form.category || undefined,
        subCategory: form.subCategory.trim() || undefined,
        sub_category: form.subCategory.trim() || undefined,
        brand: form.brand || undefined,
        model: form.model.trim() || undefined,
        unit: form.unit || undefined,
        // Send both casings so either backend style accepts the supplier link.
        supplierId: supplierIdNum,
        supplier_id: supplierIdNum,
        cost_price: Number(form.costPrice) || 0,
        selling_price: Number(form.salePrice) || 0,
        tax_rate: form.tax === "VAT 15%" ? 15 : 0,
        description: form.description || undefined,
        image_url: form.imageUrl || undefined,
        alert_qty: Number(form.alertQty) || undefined,
        status: form.status as "Active" | "Inactive",
        opening_stock: openingStock.length > 0 ? openingStock : undefined,
      };

      await createProduct(payload);
      setSuccess(true);
      setTimeout(() => {
        navigate("/products");
      }, 1500);
    } catch (e: any) {
      console.error("Failed to create product:", e);
      setError(e instanceof Error ? e.message : "Failed to add product. Please check your data.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoadingMeta) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span>Products</span><span>/</span>
        <span className="text-gray-900 font-medium">Add Product</span>
      </div>

      <div className="mb-5">
        <h1 className="text-xl font-semibold text-gray-900">Add New Product</h1>
        <p className="text-sm text-gray-500 mt-0.5">Fields marked with * are required</p>
      </div>

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700 text-sm animate-pulse">
          <Package size={16} className="text-green-600" />
          Product added successfully! Redirecting to products list...
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700 text-sm">
          <AlertTriangle size={16} className="text-red-600" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-3 gap-4">
        {/* Main Product Info */}
        <div className="col-span-2 space-y-4">
          {/* Basic Details */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <Tag size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-800">Product Information</h2>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2">
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter product name"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Product Code / SKU *</label>
                <input
                  type="text"
                  required
                  value={form.code}
                  onChange={(e) => updateField("code", e.target.value)}
                  placeholder="Enter unique SKU"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                <div className="relative">
                  <select
                    value={form.category}
                    onChange={(e) => updateField("category", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                  >
                    <option value="">Select Category</option>
                    {categories.map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Sub Category</label>
                <input
                  type="text"
                  value={form.subCategory}
                  onChange={(e) => updateField("subCategory", e.target.value)}
                  placeholder="Enter sub category"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Brand</label>
                <div className="relative">
                  <select
                    value={form.brand}
                    onChange={(e) => updateField("brand", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                  >
                    <option value="">Select Brand</option>
                    {brands.map((b) => <option key={b}>{b}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Model</label>
                <input
                  type="text"
                  value={form.model}
                  onChange={(e) => updateField("model", e.target.value)}
                  placeholder="Enter model name / number"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Supplier</label>
                <div className="relative">
                  <select
                    value={form.supplierId}
                    onChange={(e) => updateField("supplierId", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                  >
                    <option value="">Select Supplier</option>
                    {suppliers.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.company || s.name || `Supplier #${s.id}`}
                        {s.company && s.name ? ` — ${s.name}` : ""}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
                {suppliers.length === 0 && (
                  <p className="text-[11px] text-amber-600 mt-1">
                    No suppliers found. Add suppliers under People → List Supplier first.
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Unit</label>
                <div className="relative">
                  <select
                    value={form.unit}
                    onChange={(e) => updateField("unit", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                  >
                    {units.map((u) => <option key={u}>{u}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>
          </div>

          {/* Pricing & Tax */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100">
              <DollarSign size={16} className="text-green-600" />
              <h2 className="text-sm font-semibold text-gray-800">Pricing & Tax</h2>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Cost Price (ZAR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.costPrice}
                  onChange={(e) => updateField("costPrice", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Selling Price (ZAR) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={form.salePrice}
                  onChange={(e) => updateField("salePrice", e.target.value)}
                  placeholder="0.00"
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Tax</label>
                <div className="relative">
                  <select
                    value={form.tax}
                    onChange={(e) => updateField("tax", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                  >
                    {taxOptions.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Dynamic Price Check — Frankfurter FX → ZAR */}
            <div className="mt-5 pt-4 border-t border-gray-100">
              <div className="flex items-center gap-2 mb-3">
                <ArrowRightLeft size={15} className="text-blue-600" />
                <h3 className="text-sm font-semibold text-gray-800">Dynamic Price Check</h3>
                <span className="text-[11px] text-gray-400">Convert supplier currency → ZAR</span>
              </div>
              <div className="grid grid-cols-12 gap-3 items-end">
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Currency</label>
                  <div className="relative">
                    <select
                      value={fxCurrency}
                      onChange={(e) => {
                        setFxCurrency(e.target.value);
                        setFxZar(null);
                        setFxRate(null);
                      }}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                    >
                      {COMMON_FX_CURRENCIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                      <option value="ZAR">ZAR</option>
                    </select>
                    <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Amount ({fxCurrency})</label>
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    value={fxAmount}
                    onChange={(e) => {
                      setFxAmount(e.target.value);
                      setFxZar(null);
                      setFxRate(null);
                    }}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  />
                </div>
                <div className="col-span-3">
                  <label className="block text-xs font-medium text-gray-700 mb-1">Converted (ZAR)</label>
                  <input
                    type="text"
                    readOnly
                    value={fxZar != null ? `R ${fxZar.toFixed(2)}` : ""}
                    placeholder="—"
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50 text-gray-800"
                  />
                </div>
                <div className="col-span-3">
                  <button
                    type="button"
                    onClick={runPriceCheck}
                    disabled={fxLoading}
                    className="w-full py-2 px-3 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
                  >
                    {fxLoading ? (
                      <>
                        <Loader2 size={14} className="animate-spin" /> Checking…
                      </>
                    ) : (
                      <>
                        <RefreshCw size={14} /> Check Rate
                      </>
                    )}
                  </button>
                </div>
              </div>

              {fxError && (
                <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                  <AlertTriangle size={12} /> {fxError}
                </p>
              )}

              {fxRate != null && fxZar != null && !fxError && (
                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-gray-600">
                  <span className="px-2 py-1 bg-blue-50 text-blue-700 rounded border border-blue-100">
                    1 {fxCurrency} = {fxRate.toFixed(4)} ZAR
                  </span>
                  {fxDate && (
                    <span className="text-gray-400">Rate date: {fxDate}</span>
                  )}
                  <span className="text-gray-300">|</span>
                  <button
                    type="button"
                    onClick={applyFxToCostPrice}
                    className="text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Use as Cost Price
                  </button>
                </div>
              )}
              
            </div>
          </div>

          {/* Warehouse Stock */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Building2 size={16} className="text-purple-600" />
                <h2 className="text-sm font-semibold text-gray-800">Opening Stock by Warehouse</h2>
              </div>
              <button
                type="button"
                onClick={addStockEntry}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 font-medium animate-pulse"
              >
                <Plus size={13} /> Add Warehouse
              </button>
            </div>
            <div className="space-y-2">
              {stockEntries.map((entry, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="flex-1">
                    <div className="relative">
                      <select
                        value={entry.warehouseId}
                        onChange={(e) => updateStockEntry(i, "warehouseId", Number(e.target.value))}
                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                      >
                        {dbWarehouses.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                  <div className="w-28">
                    <input
                      type="number"
                      value={entry.qty}
                      onChange={(e) => updateStockEntry(i, "qty", parseInt(e.target.value) || 0)}
                      placeholder="Qty"
                      min={0}
                      className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 text-center"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeStockEntry(i)}
                    disabled={stockEntries.length === 1}
                    className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100">
              <p className="text-xs text-gray-500">
                Total Opening Stock: <span className="font-semibold text-gray-900">{stockEntries.reduce((acc, e) => acc + Number(e.qty), 0)} units</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Image Upload */}
          <div className="bg-white border border-gray-200 rounded-lg p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">Product Image</h2>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              className="hidden"
              onChange={(e) => handleImageFile(e.target.files?.[0])}
            />

            {imagePreview || (form.imageUrl && form.imageUrl.startsWith("http")) ? (
              <div className="relative border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                <img
                  src={imagePreview || form.imageUrl}
                  alt="Product preview"
                  className="w-full h-40 object-contain bg-white"
                />
                <button
                  type="button"
                  onClick={clearProductImage}
                  className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 shadow-sm"
                  title="Remove image"
                >
                  <X size={14} />
                </button>
                {imageFileName && (
                  <p className="px-3 py-1.5 text-[11px] text-gray-500 truncate border-t border-gray-100 bg-white">
                    {imageFileName}
                  </p>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={imageProcessing}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                }}
                onDrop={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleImageFile(e.dataTransfer.files?.[0]);
                }}
                className="w-full border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors cursor-pointer disabled:opacity-60"
              >
                {imageProcessing ? (
                  <Loader2 size={24} className="text-blue-500 mx-auto mb-2 animate-spin" />
                ) : (
                  <Upload size={24} className="text-gray-300 mx-auto mb-2" />
                )}
                <p className="text-xs text-gray-500">
                  {imageProcessing ? "Processing image…" : "Click to upload"}
                </p>
                <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP up to 5MB</p>
              </button>
            )}

            {imageError && (
              <p className="mt-2 text-xs text-red-600 flex items-center gap-1">
                <AlertTriangle size={12} /> {imageError}
              </p>
            )}

            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Or enter image URL</label>
              <input
                type="text"
                value={form.imageUrl.startsWith("data:") ? "" : form.imageUrl}
                onChange={(e) => {
                  const url = e.target.value;
                  setImageFileName("");
                  setImageError("");
                  setImagePreview("");
                  updateField("imageUrl", url);
                }}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                Uploaded files are attached as the product image on save.
              </p>
            </div>
          </div>

          {/* Summary Card */}
          <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg p-5 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Package size={16} />
              <h2 className="text-sm font-semibold">Product Summary</h2>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-blue-200">Name</span>
                <span className="font-medium text-right max-w-32 truncate">{form.name || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">SKU</span>
                <span className="font-medium">{form.code || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Category</span>
                <span className="font-medium">{form.category || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Sub Category</span>
                <span className="font-medium">{form.subCategory || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Brand</span>
                <span className="font-medium">{form.brand || "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-blue-200 shrink-0">Model</span>
                <span className="font-medium text-right max-w-36 truncate">{form.model || "—"}</span>
              </div>
              <div className="flex justify-between gap-2">
                <span className="text-blue-200 shrink-0">Supplier</span>
                <span className="font-medium text-right max-w-36 truncate">{selectedSupplierLabel}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Sale Price</span>
                <span className="font-medium">{form.salePrice ? `R ${form.salePrice}` : "—"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-200">Total Stock</span>
                <span className="font-medium">{stockEntries.reduce((acc, e) => acc + Number(e.qty), 0)} units</span>
              </div>
            </div>
          </div>

          {/* Details Settings */}
          <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <div className="relative">
                <select
                  value={form.status}
                  onChange={(e) => updateField("status", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Low Stock Alert Qty</label>
              <input
                type="number"
                value={form.alertQty}
                onChange={(e) => updateField("alertQty", e.target.value)}
                placeholder="3"
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={form.description}
                onChange={(e) => updateField("description", e.target.value)}
                rows={3}
                placeholder="Product description..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 resize-none"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-2">
            <button
              id="submit-product-btn"
              type="submit"
              disabled={isSaving || success}
              className="w-full py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Saving...
                </>
              ) : (
                "Add Product"
              )}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors"
            >
              Reset Form
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
