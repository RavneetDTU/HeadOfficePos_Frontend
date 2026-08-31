import {
    AlertTriangle,
    ArrowDown,
    ArrowUp,
    ArrowUpDown,
    CheckCircle,
    ChevronLeft,
    ChevronRight,
    Download,
    Edit2,
    Package,
    XCircle
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { SearchAutosuggest } from "../../components/ui/SearchAutosuggest";
import { useAuth } from "../../context/AuthContext";
import { apiFetch } from "../../lib/api";
import { getMasterData, getStoreInventory, getStores, getWarehouseInventory, getWarehouses } from "../../services/inventoryService";

interface ProductEntry {
  id: number;
  sku: string;
  name: string;
  category?: string;
  costPrice: number;
  sellingPrice: number;
  taxPercent: number;
}

interface LocationEntry {
  id: number;
  name: string;
  type: "warehouse" | "store";
}

function fmtZAR(val: number) {
  return `R ${val.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

/** Escape a CSV cell so Excel opens the file correctly. */
function csvEscape(value: string | number | null | undefined): string {
  const raw = value == null ? "" : String(value);
  if (/[",\n\r]/.test(raw)) {
    return `"${raw.replace(/"/g, '""')}"`;
  }
  return raw;
}

export function ListProducts() {
  const { isAdmin } = useAuth();

  // API States
  const [products, setProducts] = useState<ProductEntry[]>([]);
  const [stockMap, setStockMap] = useState<Record<string, number>>({});
  // Warehouse-only stock map (used for the default "All Locations" quantity view)
  const [warehouseMap, setWarehouseMap] = useState<Record<string, number>>({});
  const [locations, setLocations] = useState<LocationEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter/Search States
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All Locations");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  // Sorting States
  const [sortField, setSortField] = useState<"name" | "costPrice" | "sellingPrice" | "quantity" | "status" | "">("");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const [viewProduct, setViewProduct] = useState<(ProductEntry & { quantity: number; statusLabel: string }) | null>(null);

  // Load Data from backend APIs
  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const [masterData, whs, sts] = await Promise.all([
        getMasterData(),
        getWarehouses().catch(() => []),
        getStores().catch(() => []),
      ]);

      const combinedLocs: LocationEntry[] = [
        ...whs.map((w) => ({ id: w.id, name: w.name, type: "warehouse" as const })),
        ...sts.map((s) => ({ id: s.id, name: s.name, type: "store" as const })),
      ];
      setLocations(combinedLocs);

      // Strategy: use /warehouse/1/inventory as the base stock for ALL products,
      // then override with /sales/stock values for the subset of products that are
      // tracked there (they are more accurate for those SKUs).
      // This ensures every product has a real number, and there is no hardcoded fallback.
      const primaryWarehouse = whs[0];
      const [whInvResult, salesStockRaw, ...storeInventories] = await Promise.all([
        primaryWarehouse
          ? getWarehouseInventory({ warehouse_id: primaryWarehouse.id }).catch(() => ({ items: [] }))
          : Promise.resolve({ items: [] as any[] }),
        apiFetch<any[]>("/sales/stock").catch(() => []),
        ...sts.map((s) =>
          getStoreInventory(s.id)
            .then((res) => ({ storeName: s.name, items: res.items }))
            .catch(() => ({ storeName: s.name, items: [] }))
        ),
      ]);

      const map: Record<string, number> = {};
      const whMap: Record<string, number> = {};

      // Step 1: Seed whMap from /warehouse/{id}/inventory (covers ALL products)
      const whLocName = (primaryWarehouse?.name ?? "head office warehouse").toLowerCase().trim();
      for (const item of whInvResult.items) {
        const sku = String(item.sku || "").trim().toLowerCase();
        const qty = Number(item.available_qty ?? item.quantity ?? 0);
        if (sku && qty > 0) {
          whMap[sku] = qty;
          map[`${sku}_${whLocName}`] = qty;
          if (whLocName.includes("head office")) {
            map[`${sku}_head office`] = qty;
          }
        }
      }

      // Step 2: Override with /sales/stock values where they exist — these are more
      // accurate for the subset of products tracked through the sales flow.
      for (const item of salesStockRaw) {
        const sku = String(item.sku || "").trim().toLowerCase();
        const loc = String(item.warehouse || "").trim().toLowerCase();
        const qty = Number(item.inStock ?? item.available ?? 0);
        if (sku) {
          whMap[sku] = qty;  // override with real-time sales/stock value
          if (loc) {
            map[`${sku}_${loc}`] = qty;
            if (loc === "head office") {
              map[`${sku}_head office warehouse`] = qty;
            }
          }
        }
      }

      // Step 3: Store inventories (per-location map only, not the default view)
      for (const storeInv of storeInventories) {
        const locName = storeInv.storeName.toLowerCase().trim();
        for (const item of storeInv.items) {
          const sku = item.sku.toLowerCase().trim();
          const qty = item.quantity;
          if (sku && locName) {
            map[`${sku}_${locName}`] = (map[`${sku}_${locName}`] || 0) + qty;
          }
        }
      }

      setWarehouseMap(whMap);
      setStockMap(map);
      setProducts(masterData.products);
    } catch (e) {
      console.error("Failed to load products list:", e);
      setError("Failed to load products and stock levels.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Compute quantity based on selected location
  const getProductQty = (sku: string): number => {
    if (warehouseFilter && warehouseFilter !== "All Locations") {
      // Specific location selected — look up per-location map
      const key = `${sku.trim()}_${warehouseFilter.toLowerCase().trim()}`;
      return stockMap[key] ?? 0;
    }

    // Default: show warehouse stock only (decreases as transfers are made)
    return warehouseMap[sku.trim().toLowerCase()] ?? 0;
  };

  // Helper for stock status
  const getStockStatus = (stock: number): { label: string; color: string; status: "In Stock" | "Low Stock" | "Out of Stock" } => {
    if (stock === 0) return { label: "Out of Stock", color: "bg-red-100 text-red-700", status: "Out of Stock" };
    if (stock <= 3) return { label: "Low Stock", color: "bg-orange-100 text-orange-700", status: "Low Stock" };
    return { label: "In Stock", color: "bg-green-100 text-green-700", status: "In Stock" };
  };

  // Dynamic lists from active products
  const productSearchSuggestions = useMemo(() => {
    return Array.from(new Set(products.map((p) => p.name))).sort();
  }, [products]);

  const categories = useMemo(() => {
    const cats = new Set(products.map((p) => p.category).filter(Boolean));
    return ["All Categories", ...Array.from(cats)].sort();
  }, [products]);

  // Handle headers sorting logic
  const handleSort = (field: "name" | "costPrice" | "sellingPrice" | "quantity" | "status") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(1);
  };

  const renderSortIcon = (field: "name" | "costPrice" | "sellingPrice" | "quantity" | "status") => {
    if (sortField !== field) return <ArrowUpDown size={12} className="ml-1 opacity-40 inline" />;
    return sortOrder === "asc" ? (
      <ArrowUp size={12} className="ml-1 text-blue-600 inline" />
    ) : (
      <ArrowDown size={12} className="ml-1 text-blue-600 inline" />
    );
  };

  // Filter & Sort Products
  const processedProducts = useMemo(() => {
    let result = products.map((p) => {
      const qty = getProductQty(p.sku);
      // No hardcoded fallback — show actual quantity (0 = out of stock)
      const statusInfo = getStockStatus(qty);
      return {
        ...p,
        quantity: qty,
        statusLabel: statusInfo.label,
        statusColor: statusInfo.color,
        statusType: statusInfo.status,
      };
    });

    // 1. Search Filter
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.sku.toLowerCase().includes(q) ||
          (p.category && p.category.toLowerCase().includes(q))
      );
    }

    // 2. Category Filter
    if (categoryFilter !== "All Categories") {
      result = result.filter((p) => p.category === categoryFilter);
    }

    // 3. Stock Status Filter
    if (statusFilter !== "All") {
      result = result.filter((p) => p.statusType === statusFilter);
    }

    // 4. Sorting
    if (sortField) {
      result.sort((a, b) => {
        let valA: any = a[sortField as keyof typeof a];
        let valB: any = b[sortField as keyof typeof b];

        if (sortField === "status") {
          valA = a.statusType;
          valB = b.statusType;
        }

        if (typeof valA === "string") {
          return sortOrder === "asc"
            ? valA.localeCompare(valB)
            : valB.localeCompare(valA);
        } else {
          return sortOrder === "asc" ? valA - valB : valB - valA;
        }
      });
    }

    return result;
  }, [products, search, categoryFilter, statusFilter, warehouseFilter, stockMap, sortField, sortOrder]);

  // Pagination values
  const totalPages = Math.ceil(processedProducts.length / pageSize) || 1;
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return processedProducts.slice(start, start + pageSize);
  }, [processedProducts, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search, warehouseFilter, categoryFilter, statusFilter]);

  // Overall counts for KPIs based on currently mapped product list
  const kpis = useMemo(() => {
    let total = processedProducts.length;
    let inStock = processedProducts.filter((p) => p.quantity > 3).length;
    let lowStock = processedProducts.filter((p) => p.quantity > 0 && p.quantity <= 3).length;
    let outOfStock = processedProducts.filter((p) => p.quantity === 0).length;
    return { total, inStock, lowStock, outOfStock };
  }, [processedProducts]);

  /** Download every loaded product (with stock details) as .csv for Excel. */
  const exportProductsCsv = () => {
    const rows = products.map((p) => {
      const quantity = getProductQty(p.sku);
      const statusLabel = getStockStatus(quantity).label;
      return {
        id: p.id,
        sku: p.sku,
        name: p.name,
        category: p.category || "",
        costPrice: Number(p.costPrice ?? 0).toFixed(2),
        sellingPrice: Number(p.sellingPrice ?? 0).toFixed(2),
        taxPercent: Number(p.taxPercent ?? 0),
        quantity,
        status: statusLabel,
        location: warehouseFilter,
      };
    });

    const headers = [
      "ID",
      "SKU",
      "Product Name",
      "Category",
      "Cost Price (ZAR)",
      "Selling Price (ZAR)",
      "Tax %",
      "Quantity",
      "Stock Status",
      "Location Filter",
    ];

    const lines = [
      headers.join(","),
      ...rows.map((r) =>
        [
          csvEscape(r.id),
          csvEscape(r.sku),
          csvEscape(r.name),
          csvEscape(r.category),
          csvEscape(r.costPrice),
          csvEscape(r.sellingPrice),
          csvEscape(r.taxPercent),
          csvEscape(r.quantity),
          csvEscape(r.status),
          csvEscape(r.location),
        ].join(",")
      ),
    ];

    // BOM helps Excel recognize UTF-8 correctly
    const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
      type: "text/csv;charset=utf-8;",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    const stamp = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `products-export-${stamp}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span>Products</span><span>/</span>
        <span className="text-gray-900 font-medium">List Products</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Products</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse and manage all products and available inventory</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
          >
            Refresh
          </button>
          <button
            type="button"
            onClick={exportProductsCsv}
            disabled={isLoading || products.length === 0}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            title="Download all products as CSV for Excel"
          >
            <Download size={15} /> Export
          </button>
          {isAdmin && (
            <Link
              to="/products/add"
              id="go-to-add-product"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <Package size={15} /> Add Product
            </Link>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Total Products", value: kpis.total, icon: Package, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "In Stock", value: kpis.inStock, icon: CheckCircle, color: "text-green-600", bg: "bg-green-50" },
          { label: "Low Stock (qty 1-3)", value: kpis.lowStock, icon: AlertTriangle, color: "text-orange-500", bg: "bg-orange-50" },
          { label: "Out of Stock (qty 0)", value: kpis.outOfStock, icon: XCircle, color: "text-red-500", bg: "bg-red-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center`}>
              <k.icon size={20} className={k.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-2xl font-bold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3">
        <SearchAutosuggest
          value={search}
          onChange={setSearch}
          suggestions={productSearchSuggestions}
          placeholder="Search by name or SKU..."
          className="flex-1 min-w-48"
        />
        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="In Stock">In Stock</option>
          <option value="Low Stock">Low Stock</option>
          <option value="Out of Stock">Out of Stock</option>
        </select>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertTriangle size={16} />
          {error}
          <button onClick={loadData} className="ml-auto underline text-xs">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th
                  onClick={() => handleSort("name")}
                  className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap cursor-pointer hover:bg-blue-700 select-none"
                >
                  Product Name {renderSortIcon("name")}
                </th>
                <th
                  onClick={() => handleSort("costPrice")}
                  className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap cursor-pointer hover:bg-blue-700 select-none"
                >
                  Cost Price {renderSortIcon("costPrice")}
                </th>
                <th
                  onClick={() => handleSort("sellingPrice")}
                  className="px-4 py-2.5 text-right text-xs font-medium whitespace-nowrap cursor-pointer hover:bg-blue-700 select-none"
                >
                  Selling Price {renderSortIcon("sellingPrice")}
                </th>
                <th
                  onClick={() => handleSort("quantity")}
                  className="px-4 py-2.5 text-center text-xs font-medium whitespace-nowrap cursor-pointer hover:bg-blue-700 select-none"
                >
                  Quantity {renderSortIcon("quantity")}
                </th>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">
                  Action
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                // Loading Skeleton rows
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-200 rounded w-48 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-20" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-4 bg-gray-100 rounded w-16 ml-auto" />
                    </td>
                    <td className="px-4 py-4 text-center">
                      <div className="h-4 bg-gray-200 rounded w-10 mx-auto" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 bg-gray-100 rounded w-12" />
                    </td>
                  </tr>
                ))
              ) : paginatedProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-16 text-center">
                    <Package size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">No products found matching your filters</p>
                  </td>
                </tr>
              ) : (
                paginatedProducts.map((p, i) => (
                  <tr
                    key={p.id}
                    className={`hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{p.name}</p>
                      <p className="text-xs text-gray-500 font-mono bg-gray-100/80 inline-block px-1 rounded mt-0.5">{p.sku}</p>
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-medium text-gray-900">
                      {fmtZAR(p.costPrice)}
                    </td>
                    <td className="px-4 py-3 text-xs text-right font-semibold text-gray-900">
                      {fmtZAR(p.sellingPrice)}
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900">
                      {p.quantity}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button className="p-1.5 rounded hover:bg-gray-100 text-gray-900 transition-colors" title="Edit">
                            <Edit2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing {Math.min(processedProducts.length, (currentPage - 1) * pageSize + 1)} to{" "}
            {Math.min(processedProducts.length, currentPage * pageSize)} of {processedProducts.length} products
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* View Product Modal */}
      {viewProduct && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Product Details</h2>
              <button onClick={() => setViewProduct(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <Package size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{viewProduct.name}</p>
                  <p className="text-xs text-gray-500">{viewProduct.sku}</p>
                </div>
              </div>
              {[
                ["Category", viewProduct.category || "General"],
                ["Cost Price", fmtZAR(viewProduct.costPrice)],
                ["Selling Price", fmtZAR(viewProduct.sellingPrice)],
                ["Tax Rate", `${viewProduct.taxPercent}%`],
                ["Quantity", String(viewProduct.quantity)],
                ["Status", viewProduct.statusLabel],
              ].map(([key, val]) => (
                <div key={key} className="flex justify-between text-sm">
                  <span className="text-gray-500">{key}</span>
                  <span className="font-medium text-gray-900">{val}</span>
                </div>
              ))}
            </div>
            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => setViewProduct(null)}
                className="w-full py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
