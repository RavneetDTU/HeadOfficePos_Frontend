import { useEffect, useState } from "react";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Building2,
  Package,
  RefreshCw,
  ShoppingCart,
  Truck,
  TrendingUp,
  Loader2,
} from "lucide-react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  getAdminDashboard,
  getStoreDashboard,
} from "../services/inventoryService";
import type { AdminDashboardSummary, StoreDashboardSummary } from "../types/inventory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtZAR(val: number) {
  return `R ${val.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h > 23) return `${Math.floor(h / 24)}d ago`;
  if (h > 0) return `${h}h ago`;
  return `${m}m ago`;
}

// ─── Shared KPI Card ─────────────────────────────────────────────────────────

interface KPI {
  label: string;
  value: string;
  sub?: string;
  icon: React.ReactNode;
  color: string;
  bg: string;
}

function KpiCard({ label, value, sub, icon, color, bg }: KPI) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-5 flex items-start gap-4">
      <div className={`w-11 h-11 ${bg} rounded-xl flex items-center justify-center flex-shrink-0`}>
        <span className={color}>{icon}</span>
      </div>
      <div className="min-w-0">
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-xl font-bold text-gray-900 mt-0.5 truncate">{value}</p>
        {sub && <p className="text-xs text-gray-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Admin Dashboard ──────────────────────────────────────────────────────────

function AdminDashboard() {
  const [data, setData] = useState<AdminDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getAdminDashboard();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-96 flex-col gap-3">
      <AlertTriangle className="text-red-500" size={28} />
      <p className="text-sm text-gray-600">{error || "No data"}</p>
      <button onClick={load} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  const kpis: KPI[] = [
    { label: "Warehouse Stock Value", value: fmtZAR(data.warehouse_summary.total_warehouse_stock_value), sub: `${data.warehouse_summary.total_warehouse_items.toLocaleString()} units`, icon: <Building2 size={22} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "All Stores Stock Value", value: fmtZAR(data.store_summary.total_store_stock_value), sub: `${data.store_summary.total_store_items.toLocaleString()} units across stores`, icon: <Package size={22} />, color: "text-purple-600", bg: "bg-purple-50" },
    { label: "Sales Today", value: fmtZAR(data.sales_summary.total_sales_today), sub: `${data.sales_summary.total_sales_count_today} transactions`, icon: <ShoppingCart size={22} />, color: "text-green-600", bg: "bg-green-50" },
    { label: "Sales This Month", value: fmtZAR(data.sales_summary.total_sales_month), sub: `${data.sales_summary.total_sales_count_month} transactions`, icon: <TrendingUp size={22} />, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Admin Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">Hearing Aid Labs — System Overview</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-4 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Low Stock Alert */}
      {data.warehouse_summary.low_stock_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-800">
                Warehouse Low Stock — {data.warehouse_summary.low_stock_count} items below threshold
              </h2>
            </div>
            <Link to="/warehouse/inventory?low_stock=true" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {data.warehouse_summary.low_stock_items.slice(0, 3).map((item) => (
              <div key={item.sku} className="bg-white rounded-lg p-3 border border-amber-200">
                <p className="text-xs font-mono text-amber-700 mb-0.5">{item.sku}</p>
                <p className="text-sm font-medium text-gray-900 truncate">{item.name}</p>
                <p className="text-xs text-gray-500 mt-1">
                  <span className="text-red-600 font-semibold">{item.quantity}</span> / {item.alert_qty} min
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Store Low Stock Alert */}
      {data.store_summary.low_stock_stores.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={16} className="text-red-500" />
            <h2 className="text-sm font-semibold text-red-800">Stores with Low Stock</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.store_summary.low_stock_stores.map((s) => (
              <span key={s.store_id} className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-red-200 rounded-full text-xs text-red-700">
                <span className="w-2 h-2 rounded-full bg-red-400" />
                {s.store_name} — {s.low_stock_count} items
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recent Transfers */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Transfers</h2>
            </div>
            <Link to="/transfers" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recent_transfers.map((t) => (
              <div key={t.transfer_reference} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-blue-700">{t.transfer_reference}</p>
                  <p className="text-sm text-gray-900 mt-0.5">→ {t.to_store_name}</p>
                  <p className="text-xs text-gray-400">{fmtDate(t.date)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{fmtZAR(t.total_value)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link to="/transfers/add" className="flex items-center justify-center gap-2 text-sm text-white bg-blue-600 hover:bg-blue-700 transition-colors rounded-lg py-2 font-medium">
              <Truck size={15} /> New Transfer
            </Link>
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Sales</h2>
            </div>
            <Link to="/sales" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recent_sales.map((s) => (
              <div key={s.reference} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-green-700">{s.reference}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{s.customer_name}</p>
                  <p className="text-xs text-gray-400">{s.warehouse} · {fmtDate(s.date)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{fmtZAR(s.grand_total)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link to="/sales/add" className="flex items-center justify-center gap-2 text-sm text-white bg-green-600 hover:bg-green-700 transition-colors rounded-lg py-2 font-medium">
              <ShoppingCart size={15} /> New Sale
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: "Warehouse Inventory", path: "/warehouse/inventory", icon: <Building2 size={20} />, color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100" },
            { label: "New Transfer", path: "/transfers/add", icon: <Truck size={20} />, color: "text-purple-600", bg: "bg-purple-50 hover:bg-purple-100" },
            { label: "All Transfers", path: "/transfers", icon: <ArrowUpRight size={20} />, color: "text-indigo-600", bg: "bg-indigo-50 hover:bg-indigo-100" },
            { label: "Products", path: "/products", icon: <Package size={20} />, color: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100" },
          ].map((a) => (
            <Link key={a.path} to={a.path} className={`${a.bg} rounded-xl p-4 flex flex-col items-center gap-2 transition-colors`}>
              <span className={a.color}>{a.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Store Manager Dashboard ──────────────────────────────────────────────────

function StoreDashboard() {
  const [data, setData] = useState<StoreDashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await getStoreDashboard();
      setData(res);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  if (loading) return (
    <div className="flex items-center justify-center h-96">
      <Loader2 className="animate-spin text-blue-600" size={32} />
    </div>
  );

  if (error || !data) return (
    <div className="flex items-center justify-center h-96 flex-col gap-3">
      <AlertTriangle className="text-red-500" size={28} />
      <p className="text-sm text-gray-600">{error || "No data"}</p>
      <button onClick={load} className="text-sm text-blue-600 hover:underline flex items-center gap-1">
        <RefreshCw size={13} /> Retry
      </button>
    </div>
  );

  const kpis: KPI[] = [
    { label: "My Store Stock Value", value: fmtZAR(data.inventory_summary.total_stock_value), sub: `${data.inventory_summary.total_items} products · ${data.inventory_summary.total_stock_qty} units`, icon: <Package size={22} />, color: "text-blue-600", bg: "bg-blue-50" },
    { label: "Sales Today", value: fmtZAR(data.sales_summary.today_sales_total), sub: `${data.sales_summary.today_sales_count} transactions`, icon: <ShoppingCart size={22} />, color: "text-green-600", bg: "bg-green-50" },
    { label: "Sales This Month", value: fmtZAR(data.sales_summary.month_sales_total), sub: `${data.sales_summary.month_sales_count} transactions`, icon: <TrendingUp size={22} />, color: "text-orange-600", bg: "bg-orange-50" },
  ];

  return (
    <div className="p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">{data.store_name}</h1>
          <p className="text-sm text-gray-500 mt-0.5">Store Manager Dashboard</p>
        </div>
        <button onClick={load} className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-600 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-4">
        {kpis.map((k) => <KpiCard key={k.label} {...k} />)}
      </div>

      {/* Low Stock Alert */}
      {data.inventory_summary.low_stock_count > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <AlertTriangle size={16} className="text-amber-600" />
              <h2 className="text-sm font-semibold text-amber-800">
                {data.inventory_summary.low_stock_count} products running low in your store
              </h2>
            </div>
            <Link to="/store/inventory" className="text-xs text-amber-700 hover:underline flex items-center gap-1">
              View stock <ArrowRight size={12} />
            </Link>
          </div>
          <div className="flex flex-wrap gap-2">
            {data.inventory_summary.low_stock_items.map((item) => (
              <div key={item.sku} className="bg-white rounded-lg px-3 py-2 border border-amber-200 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                <span className="text-xs font-mono text-amber-700">{item.sku}</span>
                <span className="text-xs text-gray-700">{item.name}</span>
                <span className="text-xs font-bold text-red-600">{item.quantity} left</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="grid grid-cols-2 gap-5">
        {/* Recent Stock Received */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Truck size={16} className="text-blue-600" />
              <h2 className="text-sm font-semibold text-gray-900">Stock Received from Warehouse</h2>
            </div>
            <Link to="/store/inventory" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              My inventory <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recent_purchases_from_warehouse.length === 0 && (
              <p className="text-sm text-gray-400 text-center py-8">No stock received yet</p>
            )}
            {data.recent_purchases_from_warehouse.map((t, i) => (
              <div key={i} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-blue-700">{t.transfer_reference}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{t.product_name}</p>
                  <p className="text-xs text-gray-400">{timeAgo(t.date)}</p>
                </div>
                <span className="text-sm font-semibold text-green-700">+{t.quantity} units</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Sales */}
        <div className="bg-white border border-gray-200 rounded-xl">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <ShoppingCart size={16} className="text-green-600" />
              <h2 className="text-sm font-semibold text-gray-900">Recent Sales</h2>
            </div>
            <Link to="/sales" className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              View all <ArrowRight size={12} />
            </Link>
          </div>
          <div className="divide-y divide-gray-50">
            {data.recent_sales.map((s) => (
              <div key={s.reference} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-xs font-mono text-green-700">{s.reference}</p>
                  <p className="text-sm text-gray-900 mt-0.5">{s.customer_name}</p>
                  <p className="text-xs text-gray-400">{fmtDate(s.date)}</p>
                </div>
                <span className="text-sm font-semibold text-gray-900">{fmtZAR(s.grand_total)}</span>
              </div>
            ))}
          </div>
          <div className="px-5 py-3 border-t border-gray-100">
            <Link to="/sales/add" className="flex items-center justify-center gap-2 text-sm text-white bg-green-600 hover:bg-green-700 transition-colors rounded-lg py-2 font-medium">
              <ShoppingCart size={15} /> New Sale
            </Link>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white border border-gray-200 rounded-xl p-5">
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Quick Actions</h2>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "My Inventory", path: "/store/inventory", icon: <Package size={20} />, color: "text-blue-600", bg: "bg-blue-50 hover:bg-blue-100" },
            { label: "New Sale", path: "/sales/add", icon: <ShoppingCart size={20} />, color: "text-green-600", bg: "bg-green-50 hover:bg-green-100" },
            { label: "All Sales", path: "/sales", icon: <TrendingUp size={20} />, color: "text-orange-600", bg: "bg-orange-50 hover:bg-orange-100" },
          ].map((a) => (
            <Link key={a.path} to={a.path} className={`${a.bg} rounded-xl p-4 flex flex-col items-center gap-2 transition-colors`}>
              <span className={a.color}>{a.icon}</span>
              <span className="text-xs font-medium text-gray-700 text-center">{a.label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Dashboard (Role-based entrypoint) ────────────────────────────────────────

export function Dashboard() {
  const { isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <StoreDashboard />;
}
