import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Download,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Printer,
  TrendingDown,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";
import { getSalesStock } from "../services/inventoryService";

interface StockItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  warehouse: string;
  inStock: number;
  reserved: number;
  available: number;
  unitCost: number;
  totalValue: number;
}

type StockLevel = "all" | "in-stock" | "low-stock" | "out-of-stock";

function getStockLevel(available: number): { label: string; icon: typeof XCircle; color: string; row: string } {
  if (available <= 0) return { label: "Out of Stock", icon: XCircle, color: "text-red-600", row: "bg-red-50/40" };
  if (available <= 3) return { label: "Low Stock", icon: AlertTriangle, color: "text-orange-500", row: "bg-orange-50/30" };
  return { label: "In Stock", icon: CheckCircle, color: "text-green-600", row: "" };
}

function mapStockRow(raw: Record<string, unknown>, index: number): StockItem {
  const inStock = Number(raw.inStock ?? raw.quantity ?? 0);
  const reserved = Number(raw.reserved ?? raw.reservedQty ?? 0);
  const available = Number(raw.available ?? raw.availableQty ?? inStock - reserved);
  const unitCost = Number(raw.unitCost ?? raw.costPrice ?? raw.purchasePrice ?? 0);
  return {
    id: Number(raw.id ?? index + 1),
    sku: String(raw.sku ?? raw.productSku ?? ""),
    name: String(raw.name ?? raw.productName ?? ""),
    category: String(raw.category ?? "—"),
    warehouse: String(raw.warehouse ?? raw.warehouseName ?? "—"),
    inStock,
    reserved,
    available,
    unitCost,
    totalValue: Number(raw.totalValue ?? inStock * unitCost),
  };
}

export function StockTable() {
  const [stockData, setStockData] = useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [levelFilter, setLevelFilter] = useState<StockLevel>("all");

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const raw = await getSalesStock();
      const rows = (Array.isArray(raw) ? raw : []).map((item, i) =>
        mapStockRow(item as Record<string, unknown>, i)
      );
      setStockData(rows);
    } catch (e) {
      console.error("Failed to load stock:", e);
      setError(e instanceof Error ? e.message : "Failed to load stock from API.");
      setStockData([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const warehouses = useMemo(() => {
    const set = new Set(stockData.map((i) => i.warehouse).filter(Boolean));
    return ["All Warehouses", ...Array.from(set).sort()];
  }, [stockData]);

  const categories = useMemo(() => {
    const set = new Set(stockData.map((i) => i.category).filter((c) => c && c !== "—"));
    return ["All Categories", ...Array.from(set).sort()];
  }, [stockData]);

  const stockSearchSuggestions = useMemo(
    () =>
      Array.from(new Set([...stockData.map((i) => i.name), ...stockData.map((i) => i.sku)]))
        .filter(Boolean)
        .sort(),
    [stockData]
  );

  const filtered = stockData.filter((item) => {
    const q = search.toLowerCase();
    const matchSearch =
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.sku.toLowerCase().includes(q);
    const matchWarehouse = warehouseFilter === "All Warehouses" || item.warehouse === warehouseFilter;
    const matchCategory = categoryFilter === "All Categories" || item.category === categoryFilter;
    const matchLevel =
      levelFilter === "all" ||
      (levelFilter === "out-of-stock" && item.available <= 0) ||
      (levelFilter === "low-stock" && item.available > 0 && item.available <= 3) ||
      (levelFilter === "in-stock" && item.available > 3);
    return matchSearch && matchWarehouse && matchCategory && matchLevel;
  });

  const totalValue = filtered.reduce((acc, i) => acc + i.totalValue, 0);
  const outOfStockCount = stockData.filter((i) => i.available <= 0).length;
  const lowStockCount = stockData.filter((i) => i.available > 0 && i.available <= 3).length;
  const totalStockValue = stockData.reduce((acc, i) => acc + i.totalValue, 0);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span>Sales</span><span>/</span>
        <span className="text-gray-900 font-medium">Stock Table</span>
      </div>

      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Stock Table</h1>
          <p className="text-sm text-gray-500 mt-0.5">Real-time stock levels across all warehouses</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
          >
            Refresh
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
          >
            <Printer size={15} /> Print
          </button>
          <button className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600">
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg text-sm text-rose-700 flex items-center gap-2">
          <AlertTriangle size={16} /> {error}
        </div>
      )}

      <div className="grid grid-cols-4 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Package size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total SKUs</p>
            <p className="text-2xl font-bold text-gray-900">{stockData.length}</p>
          </div>
        </div>
        <div
          className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-orange-300 transition-colors"
          onClick={() => setLevelFilter(levelFilter === "low-stock" ? "all" : "low-stock")}
        >
          <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
            <AlertTriangle size={20} className="text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Low Stock</p>
            <p className="text-2xl font-bold text-gray-900">{lowStockCount}</p>
          </div>
        </div>
        <div
          className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3 cursor-pointer hover:border-red-300 transition-colors"
          onClick={() => setLevelFilter(levelFilter === "out-of-stock" ? "all" : "out-of-stock")}
        >
          <div className="w-10 h-10 bg-red-50 rounded-lg flex items-center justify-center">
            <TrendingDown size={20} className="text-red-500" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Out of Stock</p>
            <p className="text-2xl font-bold text-gray-900">{outOfStockCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <CheckCircle size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Stock Value</p>
            <p className="text-xl font-bold text-gray-900">R {totalStockValue.toLocaleString()}</p>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3">
        <SearchAutosuggest
          value={search}
          onChange={setSearch}
          suggestions={stockSearchSuggestions}
          placeholder="Search product name or SKU..."
          className="flex-1 min-w-48"
        />
        <select
          value={warehouseFilter}
          onChange={(e) => setWarehouseFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          {warehouses.map((w) => <option key={w}>{w}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          {categories.map((c) => <option key={c}>{c}</option>)}
        </select>
        <div className="flex items-center gap-2">
          {(["all", "in-stock", "low-stock", "out-of-stock"] as StockLevel[]).map((l) => (
            <button
              key={l}
              onClick={() => setLevelFilter(l)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                levelFilter === l ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {l === "all" ? "All" : l === "in-stock" ? "In Stock" : l === "low-stock" ? "Low" : "Out"}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-4 py-2.5 text-left text-xs font-medium">SKU</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Product Name</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Category</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Warehouse</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium">In Stock</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium">Reserved</th>
              <th className="px-4 py-2.5 text-center text-xs font-medium">Available</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium">Unit Cost</th>
              <th className="px-4 py-2.5 text-right text-xs font-medium">Total Value</th>
              <th className="px-4 py-2.5 text-left text-xs font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {isLoading ? (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center">
                  <Loader2 size={28} className="animate-spin text-blue-600 mx-auto mb-2" />
                  <p className="text-gray-400 text-sm">Loading stock from API…</p>
                </td>
              </tr>
            ) : (
              filtered.map((item, i) => {
                const level = getStockLevel(item.available);
                const LevelIcon = level.icon;
                return (
                  <tr key={`${item.sku}-${item.warehouse}-${item.id}`} className={`hover:bg-blue-50/20 transition-colors ${level.row} ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono bg-gray-100 px-2 py-0.5 rounded text-gray-700">{item.sku || "—"}</span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium max-w-48 truncate">{item.name || "—"}</td>
                    <td className="px-4 py-3 text-xs text-gray-600">{item.category}</td>
                    <td className="px-4 py-3 text-xs text-gray-700">{item.warehouse}</td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-sm font-semibold text-gray-900">{item.inStock}</span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-semibold ${item.reserved > 0 ? "text-orange-600" : "text-gray-400"}`}>
                        {item.reserved}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-sm font-bold ${item.available <= 0 ? "text-red-600" : item.available <= 3 ? "text-orange-500" : "text-green-600"}`}>
                        {item.available}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-right text-gray-700">R {item.unitCost.toLocaleString()}</td>
                    <td className="px-4 py-3 text-xs text-right font-semibold text-gray-900">
                      R {item.totalValue.toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`flex items-center gap-1 text-xs font-medium ${level.color}`}>
                        <LevelIcon size={13} />
                        {level.label}
                      </span>
                    </td>
                  </tr>
                );
              })
            )}
            {!isLoading && filtered.length === 0 && (
              <tr>
                <td colSpan={10} className="px-4 py-16 text-center">
                  <Package size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="text-gray-400 text-sm">No stock items match your criteria</p>
                </td>
              </tr>
            )}
          </tbody>
          {filtered.length > 0 && (
            <tfoot className="bg-gray-50 border-t-2 border-gray-200">
              <tr>
                <td colSpan={8} className="px-4 py-3 text-xs font-semibold text-gray-700 text-right">
                  Filtered Total Value:
                </td>
                <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                  R {totalValue.toLocaleString()}
                </td>
                <td />
              </tr>
            </tfoot>
          )}
        </table>

        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing {filtered.length} of {stockData.length} stock entries
          </p>
          <div className="flex items-center gap-1">
            <button className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors">
              <ChevronLeft size={14} />
            </button>
            <button className="px-3 py-1 rounded bg-blue-600 text-white text-xs">1</button>
            <button className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
