import { useState, useEffect } from "react";
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
  AlertTriangle
} from "lucide-react";
import { createProduct, getWarehouses } from "../../services/inventoryService";

interface StockEntry {
  warehouseId: number;
  qty: number;
}

export function AddProduct() {
  const navigate = useNavigate();

  // Meta States
  const [dbWarehouses, setDbWarehouses] = useState<any[]>([]);
  const [isLoadingMeta, setIsLoadingMeta] = useState(true);

  // Form States
  const [form, setForm] = useState({
    name: "",
    code: "", // SKU
    category: "",
    brand: "",
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

  const categories = ["Hearing Aids", "Accessories", "Batteries", "Services", "Other"];
  const brands = ["Phonak", "Signia", "Oticon", "Widex", "Resound", "Starkey", "Internal", "Other"];
  const units = ["Unit", "Pack", "Pair", "Box", "Service"];
  const taxOptions = ["No Tax", "VAT 15%", "VAT 0%"];

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const whs = await getWarehouses();
        setDbWarehouses(whs);
        if (whs.length > 0) {
          setStockEntries([{ warehouseId: whs[0].id, qty: 0 }]);
        }
      } catch (e) {
        console.error("Failed to load warehouses:", e);
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

      const payload = {
        name: form.name.trim(),
        sku: form.code.trim(),
        category: form.category || undefined,
        brand: form.brand || undefined,
        unit: form.unit || undefined,
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
            <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-300 transition-colors cursor-pointer">
              <Upload size={24} className="text-gray-300 mx-auto mb-2" />
              <p className="text-xs text-gray-500">Click to upload</p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 5MB</p>
            </div>
            <div className="mt-3">
              <label className="block text-xs font-medium text-gray-700 mb-1">Or enter image URL</label>
              <input
                type="text"
                value={form.imageUrl}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                placeholder="https://..."
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
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
              onClick={() => {
                setForm({ name: "", code: "", category: "", brand: "", unit: "Unit", costPrice: "", salePrice: "", tax: "No Tax", description: "", imageUrl: "", status: "Active", alertQty: "" });
                if (dbWarehouses.length > 0) {
                  setStockEntries([{ warehouseId: dbWarehouses[0].id, qty: 0 }]);
                }
              }}
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
