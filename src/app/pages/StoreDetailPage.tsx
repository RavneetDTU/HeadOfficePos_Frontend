import { useEffect, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router";
import {
  ArrowLeft, TrendingUp, Package, RefreshCw, Loader2,
  AlertTriangle, BarChart3, ShoppingCart, ArrowRightLeft,
  CheckCircle2, Clock, XCircle, DollarSign,
} from "lucide-react";
import { getStoreDashboard, getTransfers, getTransferItemsWithCache } from "../services/inventoryService";
import type { StoreDashboardSummary, Transfer } from "../types/inventory";
import { apiFetch } from "../lib/api";

const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);

type TabId = "overview" | "sales" | "inventory" | "transfers";

interface MetricCard {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  color: string;
}

function MetricCard({ m }: { m: MetricCard }) {
  return (
    <div className={`rounded-2xl p-5 border ${m.color} relative overflow-hidden`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {m.icon}
          <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{m.label}</span>
        </div>
        {m.trend && (
          <span className={`text-xs font-bold ${m.trend === "up" ? "text-emerald-400" : m.trend === "down" ? "text-rose-400" : "text-gray-500"}`}>
            {m.trend === "up" ? "▲" : m.trend === "down" ? "▼" : "—"}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{m.value}</p>
      {m.sub && <p className="text-xs text-gray-500 mt-1">{m.sub}</p>}
    </div>
  );
}

function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className={`grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-2xl p-5 bg-gray-100 border border-gray-200 animate-pulse">
          <div className="h-3 w-24 bg-gray-200 rounded mb-3" />
          <div className="h-8 w-32 bg-gray-200 rounded mb-1" />
          <div className="h-2 w-20 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  );
}

export function StoreDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const storeName = searchParams.get("name") ?? `Location #${id}`;
  const storeType = searchParams.get("type") ?? "store";

  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<StoreDashboardSummary | null>(null);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [error, setError] = useState("");

  const loadData = async () => {
    setLoading(true);
    setError("");
    try {
      const locationId = Number(id);

      // We want to fetch statistics specifically for this location ID (store or warehouse).
      // Since getStoreDashboard() is hardcoded to the logged-in user, we calculate the summary statistics manually.
      const [stocks, salesResp, tData] = await Promise.all([
        storeType === "warehouse"
          ? apiFetch<any[]>(`/warehouse/${locationId}/inventory`)
          : apiFetch<any[]>(`/sales/stock?storeId=${locationId}`),
        apiFetch<any>(`/sales?limit=100&storeId=${locationId}`),
        getTransfers(
          storeType === "warehouse"
            ? { warehouseId: locationId, limit: 100 }
            : { storeId: locationId, limit: 100 }
        ),
      ]);

      const salesList = (salesResp?.sales ?? salesResp?.data ?? []) as any[];

      const now = new Date();
      const todayStr = now.toISOString().split("T")[0];
      const thisMonthStr = now.toISOString().slice(0, 7);

      const todaySales = salesList.filter(s => s.date && s.date.split("T")[0] === todayStr);
      const monthSales = salesList.filter(s => s.date && s.date.slice(0, 7) === thisMonthStr);

      const today_sales_total = todaySales.reduce((acc, s) => acc + Number(s.grandTotal || 0), 0);
      const today_sales_count = todaySales.length;

      const month_sales_total = monthSales.reduce((acc, s) => acc + Number(s.grandTotal || 0), 0);
      const month_sales_count = monthSales.length;

      let total_items = 0;
      let total_stock_qty = 0;
      let total_stock_value = 0;
      let low_stock_count = 0;
      const low_stock_items: any[] = [];

      for (const item of stocks) {
        total_items++;
        const qty = Number(item.quantity ?? item.inStock ?? item.available_qty ?? item.availableQty ?? 0);
        total_stock_qty += qty;
        total_stock_value += qty * Number(item.selling_price ?? item.sellingPrice ?? item.unitCost ?? item.purchase_price ?? item.purchasePrice ?? 0);

        const alertQty = Number(item.alert_qty ?? item.alertQty ?? 0);
        if (qty <= alertQty && qty > 0) {
          low_stock_count++;
          low_stock_items.push({
            sku: item.sku ?? item.productSku ?? "",
            name: item.product_name || item.name || item.productName || "",
            quantity: qty,
            alert_qty: alertQty,
          });
        }
      }

      const dashData: StoreDashboardSummary = {
        store_id: locationId,
        store_name: storeName,
        inventory_summary: {
          total_items,
          total_stock_qty,
          total_stock_value,
          low_stock_count,
          low_stock_items,
        },
        sales_summary: {
          today_sales_total,
          today_sales_count,
          month_sales_total,
          month_sales_count,
        },
        recent_purchases_from_warehouse: [],
        recent_sales: salesList.slice(0, 5).map(s => ({
          reference: s.reference || "",
          customer_name: s.customerName || s.customer || "Walk-in Customer",
          grand_total: s.grandTotal || 0,
          date: s.date || "",
        })),
      };

      // Filter transfers in frontend just in case backend query parameters return a wider set
      const rawTrans = ((tData?.transfers ?? []) as Transfer[]).filter((t) => {
        if (storeType === "warehouse") {
          return t.from_warehouse_id === locationId;
        } else {
          return t.to_store_id === locationId;
        }
      });

      if (storeType === "store") {
        let subtractQty = 0;
        for (const t of rawTrans) {
          const isUndelivered = t.status === "Pending" || t.status === "Approved" || t.status === "In Transit";
          const isCancelled = t.status === "Cancelled" || t.status === "Rejected";
          if (isUndelivered || isCancelled) {
            const tItems = await getTransferItemsWithCache(t.id);
            subtractQty += tItems.reduce((acc, i) => acc + i.quantity, 0);
          }
        }
        if (dashData && dashData.inventory_summary) {
          dashData.inventory_summary.total_stock_qty = Math.max(0, (dashData.inventory_summary.total_stock_qty ?? 0) - subtractQty);
        }
      } else {
        let restoredQty = 0;
        const whTrans = rawTrans.filter(t => t.from_warehouse_id === locationId && (t.status === "Cancelled" || t.status === "Rejected"));
        for (const t of whTrans) {
          const tItems = await getTransferItemsWithCache(t.id);
          restoredQty += tItems.reduce((acc, i) => acc + i.quantity, 0);
        }
        if (dashData && dashData.inventory_summary) {
          dashData.inventory_summary.total_stock_qty = (dashData.inventory_summary.total_stock_qty ?? 0) + restoredQty;
        }
      }

      setDash(dashData);

      // Pre-load / enrich item counts and values from detail endpoint
      const enrichedTrans = await Promise.all(
        rawTrans.map(async (t) => {
          try {
            const items = await getTransferItemsWithCache(t.id);
            const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
            const totalVal = items.reduce((acc, item) => acc + (item.quantity * (item.purchasePrice ?? 0)), 0);
            return { ...t, total_items: totalQty, total_value: totalVal };
          } catch {
            return t;
          }
        })
      );
      setTransfers(enrichedTrans);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load store data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, [id]);

  const tabs = [
    { id: "overview", label: "Overview", icon: <BarChart3 size={15} /> },
    ...(storeType === "store" ? [{ id: "sales", label: "Sales", icon: <TrendingUp size={15} /> }] : []),
    { id: "inventory", label: "Inventory", icon: <Package size={15} /> },
    { id: "transfers", label: "Transfers", icon: <ArrowRightLeft size={15} /> },
  ] as { id: TabId; label: string; icon: React.ReactNode }[];

  const salesMetrics: MetricCard[] = dash ? [
    {
      label: "Today's Sales",
      value: zar(dash.sales_summary.today_sales_total),
      sub: `${dash.sales_summary.today_sales_count} transactions`,
      icon: <DollarSign size={14} className="text-emerald-400" />,
      color: "bg-emerald-500/10 border-emerald-500/20",
      trend: dash.sales_summary.today_sales_total > 0 ? "up" : "neutral",
    },
    {
      label: "This Month",
      value: zar(dash.sales_summary.month_sales_total),
      sub: `${dash.sales_summary.month_sales_count} transactions`,
      icon: <TrendingUp size={14} className="text-blue-400" />,
      color: "bg-blue-500/10 border-blue-500/20",
      trend: dash.sales_summary.month_sales_total > 0 ? "up" : "neutral",
    },
    {
      label: "Yesterday",
      value: "—",
      sub: "Data updating",
      icon: <Clock size={14} className="text-amber-400" />,
      color: "bg-amber-500/10 border-amber-500/20",
      trend: "neutral",
    },
    {
      label: "Weekly",
      value: "—",
      sub: "Data updating",
      icon: <BarChart3 size={14} className="text-purple-400" />,
      color: "bg-purple-500/10 border-purple-500/20",
      trend: "neutral",
    },
  ] : [];

  const inventoryMetrics: MetricCard[] = dash ? [
    {
      label: "Total Products",
      value: String(dash.inventory_summary.total_items),
      icon: <Package size={14} className="text-blue-400" />,
      color: "bg-blue-500/10 border-blue-500/20",
    },
    {
      label: "Total Units",
      value: String(dash.inventory_summary.total_stock_qty),
      icon: <BarChart3 size={14} className="text-indigo-400" />,
      color: "bg-indigo-500/10 border-indigo-500/20",
    },
    {
      label: "Low Stock",
      value: String(dash.inventory_summary.low_stock_count),
      sub: dash.inventory_summary.low_stock_count > 0 ? "Items below alert qty" : "All good",
      icon: <AlertTriangle size={14} className={dash.inventory_summary.low_stock_count > 0 ? "text-amber-400" : "text-emerald-400"} />,
      color: dash.inventory_summary.low_stock_count > 0 ? "bg-amber-500/10 border-amber-500/20" : "bg-emerald-500/10 border-emerald-500/20",
      trend: dash.inventory_summary.low_stock_count > 0 ? "down" : "up",
    },
    {
      label: "Stock Value",
      value: zar(dash.inventory_summary.total_stock_value),
      icon: <DollarSign size={14} className="text-emerald-400" />,
      color: "bg-emerald-500/10 border-emerald-500/20",
    },
  ] : [];

  // Transfer counts
  const transferCounts = {
    inTransit: transfers.filter(t => t.status === "In Transit").length,
    delivered: transfers.filter(t => t.status === "Delivered" || t.status === "Completed").length,
    pending: transfers.filter(t => t.status === "Pending" || t.status === "Approved").length,
    cancelled: transfers.filter(t => t.status === "Cancelled" || t.status === "Rejected").length,
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => navigate("/headoffice-pos")}
          className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900 transition-all"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold text-gray-900">{storeName}</h1>
            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
              storeType === "warehouse"
                ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                : "bg-blue-50 text-blue-600 border border-blue-200"
            }`}>
              {storeType === "warehouse" ? "WAREHOUSE" : "STORE"}
            </span>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">Store ID: #{id}</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-600 text-sm rounded-xl transition-all"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/sales/add")}
            className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-all font-medium"
          >
            <ShoppingCart size={14} />
            New Sale
          </button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 mb-5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertTriangle size={16} />
          {error}
          <button onClick={loadData} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 border border-gray-250/60 rounded-xl p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeTab === tab.id
                ? "bg-blue-600 text-white shadow"
                : "text-gray-500 hover:text-gray-900 hover:bg-gray-200/50"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {loading ? (
        <SkeletonCards count={4} />
      ) : (
        <>
          {/* OVERVIEW TAB */}
          {activeTab === "overview" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {salesMetrics.slice(0, 2).map((m) => <MetricCard key={m.label} m={m} />)}
                {inventoryMetrics.slice(0, 2).map((m) => <MetricCard key={m.label} m={m} />)}
              </div>

              {/* Transfer Status Row */}
              <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3">Transfer Status</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "In Transit", value: transferCounts.inTransit, icon: <ArrowRightLeft size={16} className="text-amber-400" />, color: "bg-amber-500/10 border-amber-500/20" },
                  { label: "Delivered", value: transferCounts.delivered, icon: <CheckCircle2 size={16} className="text-emerald-400" />, color: "bg-emerald-500/10 border-emerald-500/20" },
                  { label: "Pending", value: transferCounts.pending, icon: <Clock size={16} className="text-blue-400" />, color: "bg-blue-500/10 border-blue-500/20" },
                  { label: "Cancelled", value: transferCounts.cancelled, icon: <XCircle size={16} className="text-gray-400" />, color: "bg-gray-100/60 border-gray-200" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-4 border ${item.color}`}>
                    <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.label}</span></div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {/* Recent Sales */}
              {dash?.recent_sales && dash.recent_sales.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-3">Recent Sales</h2>
                  <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden mb-6 shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-250 bg-gray-50/70">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Customer</th>
                          <th className="px-5 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dash.recent_sales.slice(0, 5).map((s, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-blue-600 font-medium">{s.reference}</td>
                            <td className="px-5 py-3 text-gray-700">{s.customer_name}</td>
                            <td className="px-5 py-3 text-right font-semibold text-emerald-600">{zar(s.grand_total)}</td>
                            <td className="px-5 py-3 text-gray-500 text-xs">{new Date(s.date).toLocaleDateString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
            </div>
          )}

          {/* SALES TAB */}
          {activeTab === "sales" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {salesMetrics.map((m) => <MetricCard key={m.label} m={m} />)}
              </div>
              <div className="flex gap-3 mt-2">
                <button onClick={() => navigate("/sales/add")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-medium">
                  <ShoppingCart size={14} /> New Sale
                </button>
                <button onClick={() => navigate("/quotations/add")} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl font-medium">
                  <TrendingUp size={14} /> New Quote
                </button>
                <button onClick={() => navigate("/proforma/add")} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl font-medium">
                  <BarChart3 size={14} /> New Proforma
                </button>
              </div>
            </div>
          )}

          {/* INVENTORY TAB */}
          {activeTab === "inventory" && (
            <div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {inventoryMetrics.map((m) => <MetricCard key={m.label} m={m} />)}
              </div>
              {dash?.inventory_summary.low_stock_items && dash.inventory_summary.low_stock_items.length > 0 && (
                <>
                  <h2 className="text-sm font-semibold text-amber-700 uppercase tracking-wider mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> Low Stock Items
                  </h2>
                  <div className="bg-white border border-gray-250 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-gray-200 bg-gray-50/70">
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">SKU</th>
                          <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Product</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Qty</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Alert Qty</th>
                          <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {dash.inventory_summary.low_stock_items.map((item, i) => (
                          <tr key={i} className="hover:bg-gray-50 transition-colors">
                            <td className="px-5 py-3 font-mono text-xs text-blue-600 font-medium">{item.sku}</td>
                            <td className="px-5 py-3 text-gray-700">{item.name}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`font-bold ${item.quantity === 0 ? "text-rose-600" : "text-amber-600"}`}>
                                {item.quantity}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-center text-gray-500">{item.alert_qty}</td>
                            <td className="px-5 py-3 text-center">
                              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                item.quantity === 0
                                  ? "bg-rose-50 text-rose-700 border border-rose-200"
                                  : "bg-amber-50 text-amber-700 border border-amber-200"
                              }`}>
                                {item.quantity === 0 ? "Out of Stock" : "Low Stock"}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              <div className="flex gap-3 mt-5">
                <button onClick={() => navigate("/products")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-medium">
                  <Package size={14} /> View All Stock
                </button>
                <button onClick={() => navigate("/purchases/add")} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl font-medium">
                  <ShoppingCart size={14} /> New Purchase
                </button>
              </div>
            </div>
          )}

          {/* TRANSFERS TAB */}
          {activeTab === "transfers" && (
            <div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
                {[
                  { label: "In Transit", value: transferCounts.inTransit, icon: <ArrowRightLeft size={16} className="text-amber-400" />, color: "bg-amber-500/10 border-amber-500/20" },
                  { label: "Delivered", value: transferCounts.delivered, icon: <CheckCircle2 size={16} className="text-emerald-400" />, color: "bg-emerald-500/10 border-emerald-500/20" },
                  { label: "Pending", value: transferCounts.pending, icon: <Clock size={16} className="text-blue-400" />, color: "bg-blue-500/10 border-blue-500/20" },
                  { label: "Cancelled", value: transferCounts.cancelled, icon: <XCircle size={16} className="text-gray-400" />, color: "bg-gray-100/60 border-gray-200" },
                ].map((item) => (
                  <div key={item.label} className={`rounded-xl p-4 border ${item.color}`}>
                    <div className="flex items-center gap-2 mb-2">{item.icon}<span className="text-xs text-gray-400">{item.label}</span></div>
                    <p className="text-2xl font-bold text-gray-900">{item.value}</p>
                  </div>
                ))}
              </div>

              {transfers.length > 0 && (
                <div className="bg-white border border-gray-250 rounded-2xl overflow-hidden shadow-sm">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200 bg-gray-50/70">
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Reference</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">From</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">To</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Items</th>
                        <th className="px-5 py-3 text-center text-xs font-semibold text-gray-500 uppercase">Status</th>
                        <th className="px-5 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {transfers.slice(0, 10).map((t) => (
                        <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-5 py-3 font-mono text-xs text-blue-600 font-medium">{t.transfer_reference}</td>
                          <td className="px-5 py-3 text-gray-700 text-xs">{t.from_warehouse_name}</td>
                          <td className="px-5 py-3 text-gray-700 text-xs">{t.to_store_name}</td>
                          <td className="px-5 py-3 text-center text-gray-600">{t.total_items}</td>
                          <td className="px-5 py-3 text-center">
                            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${
                              t.status === "Delivered" || t.status === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                              t.status === "In Transit" ? "bg-amber-50 text-amber-700 border-amber-200" :
                              t.status === "Pending" ? "bg-blue-50 text-blue-700 border-blue-200" :
                              t.status === "Approved" ? "bg-indigo-50 text-indigo-700 border-indigo-200" :
                              t.status === "Cancelled" || t.status === "Rejected" ? "bg-rose-50 text-rose-700 border-rose-200" :
                              "bg-gray-50 text-gray-700 border-gray-200"
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="px-5 py-3 text-gray-500 text-xs">{new Date(t.transfer_date).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="flex gap-3 mt-5">
                <button onClick={() => navigate("/transfers/add")} className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl font-medium">
                  <ArrowRightLeft size={14} /> New Transfer
                </button>
                <button onClick={() => navigate("/transfers")} className="flex items-center gap-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 text-white text-sm rounded-xl font-medium">
                  View All Transfers
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
