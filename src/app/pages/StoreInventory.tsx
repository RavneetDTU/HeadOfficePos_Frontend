import { useCallback, useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Package,
  RefreshCw,
  Search,
  Truck,
} from "lucide-react";
import { Link } from "react-router";
import { getMyStoreInventory, getMyStorePurchaseHistory } from "../services/inventoryService";
import type { StoreInventoryItem, StorePurchaseHistoryItem } from "../types/inventory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtZAR(val: number) {
  return `R ${val.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Component ────────────────────────────────────────────────────────────────

type TabType = "inventory" | "history";

export function StoreInventory() {
  const [activeTab, setActiveTab] = useState<TabType>("inventory");

  // Inventory state
  const [items, setItems] = useState<StoreInventoryItem[]>([]);
  const [storeName, setStoreName] = useState("");
  const [loadingInv, setLoadingInv] = useState(true);
  const [errorInv, setErrorInv] = useState("");
  const [invPage, setInvPage] = useState(1);
  const [invTotalPages, setInvTotalPages] = useState(1);
  const [invTotal, setInvTotal] = useState(0);

  // Purchase history state
  const [history, setHistory] = useState<StorePurchaseHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [errorHistory, setErrorHistory] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setInvPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const loadInventory = useCallback(async () => {
    setLoadingInv(true);
    setErrorInv("");
    try {
      const res = await getMyStoreInventory({ page: invPage, limit: 20, search: debouncedSearch || undefined });
      setItems(res.items);
      setStoreName(res.store_name);
      setInvTotal(res.total);
      setInvTotalPages(res.total_pages);
    } catch (e) {
      setErrorInv(e instanceof Error ? e.message : "Failed to load inventory");
    } finally {
      setLoadingInv(false);
    }
  }, [invPage, debouncedSearch]);

  const loadHistory = useCallback(async () => {
    setLoadingHistory(true);
    setErrorHistory("");
    try {
      const res = await getMyStorePurchaseHistory({ page: 1, limit: 50 });
      setHistory(res.transfers);
    } catch (e) {
      setErrorHistory(e instanceof Error ? e.message : "Failed to load history");
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  useEffect(() => { loadInventory(); }, [loadInventory]);

  useEffect(() => {
    if (activeTab === "history" && history.length === 0) {
      loadHistory();
    }
  }, [activeTab, history.length, loadHistory]);

  const lowStockCount = items.filter((i) => i.is_low_stock).length;
  const totalValue = items.reduce((acc, i) => acc + i.quantity * i.selling_price, 0);
  const totalUnits = items.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span className="text-gray-900 font-medium">My Store Inventory</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">
            {storeName ? `${storeName} — Inventory` : "My Store Inventory"}
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">Your store's current stock levels</p>
        </div>
        <button onClick={loadInventory} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500">
          <RefreshCw size={16} />
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: "Products", value: String(invTotal), color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Total Units", value: totalUnits.toLocaleString(), color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Stock Value (Retail)", value: fmtZAR(totalValue), color: "text-green-600", bg: "bg-green-50" },
          { label: "Low Stock", value: String(lowStockCount), color: lowStockCount > 0 ? "text-amber-600" : "text-gray-400", bg: lowStockCount > 0 ? "bg-amber-50" : "bg-gray-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Package size={20} className={k.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Low Stock Banner */}
      {lowStockCount > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 mb-4 flex items-center gap-2">
          <AlertTriangle size={15} className="text-amber-600 flex-shrink-0" />
          <p className="text-sm text-amber-800">
            <span className="font-semibold">{lowStockCount} product{lowStockCount > 1 ? "s are" : " is"} below</span> the minimum stock level. Contact your admin to arrange a transfer.
          </p>
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="flex border-b border-gray-200">
          {[
            { id: "inventory" as TabType, label: "Current Stock", icon: <Package size={15} /> },
            { id: "history" as TabType, label: "Stock Received from Warehouse", icon: <Truck size={15} /> },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium transition-colors border-b-2 ${
                activeTab === tab.id
                  ? "border-blue-600 text-blue-600 bg-blue-50/50"
                  : "border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Inventory Tab */}
        {activeTab === "inventory" && (
          <>
            <div className="p-4 border-b border-gray-100">
              <div className="relative max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                <input
                  type="text"
                  placeholder="Search by product name or SKU..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full"
                />
              </div>
            </div>
            {errorInv && (
              <div className="flex items-center gap-2 p-4 text-red-600 text-sm border-b border-gray-100">
                <AlertTriangle size={16} /> {errorInv}
                <button onClick={loadInventory} className="ml-2 underline">Retry</button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    {["SKU", "Product Name", "Category", "Qty in Stock", "Cost Price", "Selling Price", "Stock Status", "Last Received", "Last Sale"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingInv ? (
                    <tr><td colSpan={9} className="text-center py-12"><Loader2 className="animate-spin text-blue-600 mx-auto" size={24} /></td></tr>
                  ) : items.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-16">
                      <Package size={32} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No stock in your store yet</p>
                      <p className="text-xs text-gray-400 mt-1">Contact your admin to transfer products to your store</p>
                    </td></tr>
                  ) : items.map((item, i) => (
                    <tr key={item.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{item.sku}</span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium text-gray-900 max-w-52 truncate">{item.product_name}</p>
                        <p className="text-xs text-gray-500">{item.brand}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600">{item.category || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`text-base font-bold ${item.is_low_stock ? "text-red-600" : "text-gray-900"}`}>
                          {item.quantity}
                        </span>
                        <span className="text-xs text-gray-400 ml-1">/ min {item.alert_qty}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-700">{fmtZAR(item.purchase_price)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtZAR(item.selling_price)}</td>
                      <td className="px-4 py-3">
                        {item.is_low_stock ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                            <AlertTriangle size={11} /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                            <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(item.last_received_date || "")}</td>
                      <td className="px-4 py-3 text-xs text-gray-500">{fmtDate(item.last_sale_date || "")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {invTotalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                <p className="text-xs text-gray-500">{invTotal} products · Page {invPage} of {invTotalPages}</p>
                <div className="flex items-center gap-1">
                  <button onClick={() => setInvPage((p) => Math.max(1, p - 1))} disabled={invPage === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronLeft size={14} />
                  </button>
                  <button onClick={() => setInvPage((p) => Math.min(invTotalPages, p + 1))} disabled={invPage === invTotalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* History Tab */}
        {activeTab === "history" && (
          <>
            {errorHistory && (
              <div className="flex items-center gap-2 p-4 text-red-600 text-sm border-b border-gray-100">
                <AlertTriangle size={16} /> {errorHistory}
                <button onClick={loadHistory} className="ml-2 underline">Retry</button>
              </div>
            )}
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    {["Reference", "Date", "Product", "SKU", "Qty Received", "Cost Price", "Total Cost", "From Warehouse", "Status"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingHistory ? (
                    <tr><td colSpan={9} className="text-center py-12"><Loader2 className="animate-spin text-blue-600 mx-auto" size={24} /></td></tr>
                  ) : history.length === 0 ? (
                    <tr><td colSpan={9} className="text-center py-16">
                      <Truck size={32} className="text-gray-200 mx-auto mb-2" />
                      <p className="text-sm text-gray-400">No stock transfers received yet</p>
                    </td></tr>
                  ) : history.map((h, i) => (
                    <tr key={i} className={`hover:bg-gray-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                      <td className="px-4 py-3">
                        <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{h.transfer_reference}</span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(h.transfer_date)}</td>
                      <td className="px-4 py-3 text-sm text-gray-900">{h.product_name}</td>
                      <td className="px-4 py-3 text-xs font-mono text-gray-600">{h.sku}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-green-700">+{h.quantity_received}</td>
                      <td className="px-4 py-3 text-sm text-gray-700">{fmtZAR(h.purchase_price)}</td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900">{fmtZAR(h.total_cost)}</td>
                      <td className="px-4 py-3 text-xs text-gray-600">{h.from_warehouse}</td>
                      <td className="px-4 py-3">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500" /> {h.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Help note */}
      <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-start gap-3">
        <Truck size={16} className="text-blue-600 mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-sm font-medium text-blue-800">Need more stock?</p>
          <p className="text-xs text-blue-600 mt-0.5">
            You cannot create stock directly. Contact your system admin to arrange a warehouse-to-store transfer.
            They can transfer products from the central warehouse to your store.
          </p>
          <Link to="/" className="text-xs text-blue-700 font-medium hover:underline mt-1 inline-block">
            Go to Dashboard →
          </Link>
        </div>
      </div>
    </div>
  );
}
