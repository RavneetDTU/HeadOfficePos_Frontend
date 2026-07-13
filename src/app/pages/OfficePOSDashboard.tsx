import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  Building2,
  DollarSign,
  Loader2,
  Package,
  RefreshCw,
  Store,
  TrendingUp
} from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import {
  getAdminDashboard,
  getStoreInventory,
  getStores,
  getTransferItemsWithCache,
  getTransfers,
  getWarehouses,
} from "../services/inventoryService";
import type { AdminDashboardSummary, Warehouse } from "../types/inventory";

// ZAR formatter
const zar = (n: number) =>
  new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(n);

interface MetricItem {
  label: string;
  value: string;
  icon: React.ReactNode;
  color: string;
}

interface StoreCardData {
  store: Warehouse;
  metrics: MetricItem[];
  loading: boolean;
  error?: string;
}

// ─── Store Card ───────────────────────────────────────────────────────────────
function StoreCard({ data, onClick }: { data: StoreCardData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer
        hover:border-blue-400 hover:shadow-md transition-all duration-300 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <Store size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 text-sm leading-tight">{data.store.name}</h3>
            <p className="text-[10px] text-gray-500 capitalize mt-0.5">
              Branch Store · {data.store.city ?? "—"}
            </p>
          </div>
        </div>
        <ArrowRight
          size={16}
          className="text-gray-400 group-hover:text-blue-600 transition-colors translate-x-0 group-hover:translate-x-1 duration-200"
        />
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={20} className="animate-spin text-gray-400" />
        </div>
      ) : data.error ? (
        <div className="flex items-center gap-2 py-6 text-xs text-gray-400">
          <AlertTriangle size={14} className="text-amber-500/70" />
          <span>Metrics unavailable</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {data.metrics.map((m) => (
            <div key={m.label} className={`rounded-xl p-3 ${m.color}`}>
              <div className="flex items-center gap-1.5 mb-1.5">
                {m.icon}
                <span className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-sm font-bold text-gray-900 leading-tight">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

// ─── Warehouse (HEAD OFFICE) Card ─────────────────────────────────────────────
function WarehouseSummaryCard({ data, onClick }: { data: StoreCardData; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      className="group relative bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer
        hover:border-indigo-400 hover:shadow-md transition-all duration-300 overflow-hidden col-span-full lg:col-span-2"
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
            <Building2 size={20} className="text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900">{data.store.name}</h3>
            <p className="text-xs text-gray-500 mt-0.5">Central Warehouse · Head Office</p>
          </div>
        </div>
        <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full">
          HEAD OFFICE
        </span>
      </div>

      {data.loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 size={24} className="animate-spin text-gray-400" />
        </div>
      ) : data.error ? (
        <div className="flex items-center gap-2 py-6 text-xs text-gray-400">
          <AlertTriangle size={14} className="text-amber-500/70" />
          <span>{data.error}</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {data.metrics.map((m) => (
            <div key={m.label} className={`rounded-xl p-3.5 ${m.color}`}>
              <div className="flex items-center gap-1.5 mb-2">
                {m.icon}
                <span className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{m.label}</span>
              </div>
              <p className="text-base font-bold text-gray-900">{m.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="absolute inset-x-0 bottom-0 h-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
    </div>
  );
}

// ─── Skeleton loader ──────────────────────────────────────────────────────────
function SkeletonCard({ wide = false }: { wide?: boolean }) {
  return (
    <div className={`bg-white border border-gray-200 rounded-2xl p-6 animate-pulse ${wide ? "col-span-full lg:col-span-2" : ""}`}>
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 rounded-xl bg-gray-200" />
        <div>
          <div className="h-3 w-28 bg-gray-200 rounded mb-1.5" />
          <div className="h-2 w-20 bg-gray-200 rounded" />
        </div>
      </div>
      <div className={`grid ${wide ? "grid-cols-4" : "grid-cols-2"} gap-3`}>
        {Array.from({ length: wide ? 4 : 4 }).map((_, j) => (
          <div key={j} className="rounded-xl p-3 bg-gray-100">
            <div className="h-2 w-14 bg-gray-200 rounded mb-2" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function OfficePOSDashboard() {
  const navigate = useNavigate();
  const [cards, setCards] = useState<StoreCardData[]>([]);
  const [warehouseCard, setWarehouseCard] = useState<StoreCardData | null>(null);
  const [pageLoading, setPageLoading] = useState(true);
  const [pageError, setPageError] = useState("");

  const loadDashboard = async () => {
    setPageLoading(true);
    setPageError("");
    setCards([]);
    setWarehouseCard(null);

    try {
      // Step 1: Fetch locations and transfers in parallel
      const [stores, warehouses, transfersResp] = await Promise.all([
        getStores(),
        getWarehouses(),
        getTransfers({ limit: 100 })
      ]);
      const transfers = transfersResp.transfers ?? [];

      // ── WAREHOUSE CARD (uses GET /dashboard/warehouse) ──────────────────────
      const headOffice = warehouses.find((w) => w.name === "HEAD OFFICE") ?? warehouses[0] ?? null;
      if (headOffice) {
        // Show loading state immediately
        setWarehouseCard({
          store: headOffice,
          metrics: [],
          loading: true,
        });

        // Fetch real warehouse dashboard data
        getAdminDashboard()
          .then(async (dash: AdminDashboardSummary) => {
            const ws = dash.warehouse_summary;
            const sal = dash.sales_summary;

            // Adjust warehouse stock values based on Cancelled / Rejected transfers
            const cancelledTrans = transfers.filter(t => t.status === "Cancelled" || t.status === "Rejected");
            let restoredUnits = 0;
            const restoredSkus = new Set<string>();
            for (const t of cancelledTrans) {
              const items = await getTransferItemsWithCache(t.id);
              for (const item of items) {
                restoredUnits += item.quantity;
                if (item.quantity > 0) {
                  restoredSkus.add(item.productSku.toLowerCase().trim());
                }
              }
            }

            const lastMonthSale = 0;
            const lastMonthProfit = 0;
            const yesterdaySale = 0;
            const yesterdayProfit = 0;

            setWarehouseCard({
              store: headOffice,
              loading: false,
              metrics: [
                {
                  label: "Last Month Sale",
                  value: zar(lastMonthSale),
                  icon: <TrendingUp size={12} className="text-emerald-600" />,
                  color: "bg-emerald-50 border border-emerald-100",
                },
                {
                  label: "Last Month Profit",
                  value: zar(lastMonthProfit),
                  icon: <DollarSign size={12} className="text-blue-600" />,
                  color: "bg-blue-50 border border-blue-100",
                },
                {
                  label: "Yesterday's Sale",
                  value: zar(yesterdaySale),
                  icon: <TrendingUp size={12} className="text-indigo-600" />,
                  color: "bg-indigo-50 border border-indigo-100",
                },
                {
                  label: "Yesterday's Profit",
                  value: zar(yesterdayProfit),
                  icon: <DollarSign size={12} className="text-amber-600" />,
                  color: "bg-amber-50 border border-amber-100",
                },
              ],
            });
          })
          .catch((err) => {
            setWarehouseCard({
              store: headOffice,
              loading: false,
              error: err instanceof Error ? err.message : "Failed to load warehouse data",
              metrics: [],
            });
          });
      }

      // ── STORE CARDS (uses GET /store/{storeId}/inventory per store) ─────────
      if (stores.length === 0) {
        setCards([]);
        setPageLoading(false);
        return;
      }

      // Show store cards in loading state immediately
      const initialCards: StoreCardData[] = stores.map((store) => ({
        store,
        metrics: [],
        loading: true,
      }));
      setCards(initialCards);
      setPageLoading(false);

      // Fetch each store's inventory in parallel
      await Promise.allSettled(
        stores.map(async (store, idx) => {
          try {
            const invResp = await getStoreInventory(store.id);
            const items = invResp.items ?? [];

            // Filter transfers destination to this store
            const storeTransfers = transfers.filter(t => t.to_store_id === store.id);

            // Collect undelivered & cancelled units to subtract (since backend added them immediately on transfer)
            let subtractQtyMap: Record<string, number> = {};
            for (const t of storeTransfers) {
              const isUndelivered = t.status === "Pending" || t.status === "Approved" || t.status === "In Transit";
              const isCancelled = t.status === "Cancelled" || t.status === "Rejected";
              if (isUndelivered || isCancelled) {
                const tItems = await getTransferItemsWithCache(t.id);
                for (const item of tItems) {
                  const sku = item.productSku.toLowerCase().trim();
                  subtractQtyMap[sku] = (subtractQtyMap[sku] || 0) + item.quantity;
                }
              }
            }

            // Adjust each item quantity
            let totalUnits = 0;
            let lowStockCount = 0;
            let outOfStockCount = 0;
            let totalProducts = 0;

            for (const item of items) {
              const sku = String(item.sku || "").toLowerCase().trim();
              const subVal = subtractQtyMap[sku] || 0;
              const originalQty = Number(item.quantity ?? 0);
              const adjustedQty = Math.max(0, originalQty - subVal);

              totalUnits += adjustedQty;
              if (adjustedQty > 0) {
                totalProducts++;
              }

              const isLow = item.alert_qty != null && adjustedQty <= item.alert_qty;
              if (isLow && adjustedQty > 0) {
                lowStockCount++;
              }
              if (adjustedQty === 0) {
                outOfStockCount++;
              }
            }

            const lastMonthSale = 0;
            const lastMonthProfit = 0;
            const yesterdaySale = 0;
            const yesterdayProfit = 0;

            setCards((prev) => {
              const next = [...prev];
              next[idx] = {
                ...next[idx],
                loading: false,
                metrics: [
                  {
                    label: "Last Month Sale",
                    value: zar(lastMonthSale),
                    icon: <TrendingUp size={11} className="text-emerald-600" />,
                    color: "bg-emerald-50 border border-emerald-100",
                  },
                  {
                    label: "Last Month Profit",
                    value: zar(lastMonthProfit),
                    icon: <DollarSign size={11} className="text-blue-600" />,
                    color: "bg-blue-50 border border-blue-100",
                  },
                  {
                    label: "Yesterday's Sale",
                    value: zar(yesterdaySale),
                    icon: <TrendingUp size={11} className="text-indigo-600" />,
                    color: "bg-indigo-50 border border-indigo-100",
                  },
                  {
                    label: "Yesterday's Profit",
                    value: zar(yesterdayProfit),
                    icon: <DollarSign size={11} className="text-amber-600" />,
                    color: "bg-amber-50 border border-amber-100",
                  },
                ],
              };
              return next;
            });
          } catch {
            setCards((prev) => {
              const next = [...prev];
              next[idx] = { ...next[idx], loading: false, error: "No data" };
              return next;
            });
          }
        })
      );
    } catch (e) {
      setPageError(e instanceof Error ? e.message : "Failed to load dashboard");
      setPageLoading(false);
    }
  };

  useEffect(() => { loadDashboard(); }, []);

  return (
    <div className="min-h-screen bg-white text-gray-900 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 pb-6 border-b border-gray-200">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            HeadOffice POS — HQ Dashboard
          </h1>
          <p className="text-sm text-gray-600 mt-1">
            Real-time inventory across Warehouse and all Branches
          </p>
        </div>
        <div className="flex items-center gap-3 mt-4 sm:mt-0">
          <button
            onClick={loadDashboard}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-300 text-gray-700 text-sm rounded-xl transition-all shadow-sm"
          >
            <RefreshCw size={14} className={pageLoading ? "animate-spin" : ""} />
            Refresh
          </button>
          <button
            onClick={() => navigate("/products")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm rounded-xl transition-all font-medium shadow-sm"
          >
            <Package size={14} />
            Stock Levels
          </button>
        </div>
      </div>

      {pageError && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertTriangle size={16} />
          {pageError}
          <button onClick={loadDashboard} className="ml-auto underline text-xs">Retry</button>
        </div>
      )}

      {/* Quick Nav */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { label: "Products", icon: <Package size={13} />, path: "/products" },

          { label: "Transfers", icon: <ArrowRightLeft size={13} />, path: "/transfers" },

        ].map((item) => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-gray-50 border border-gray-300
              text-gray-700 text-xs rounded-lg transition-all shadow-sm"
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      {pageLoading ? (
        // Full skeleton while fetching locations list
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <SkeletonCard wide />
          {[0, 1, 2, 3].map((i) => <SkeletonCard key={i} />)}
        </div>
      ) : !warehouseCard && cards.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-slate-500">
          <Store size={48} className="mb-4 opacity-20" />
          <p className="text-base font-medium">No stores or warehouses found</p>
          <p className="text-sm mt-1 opacity-70">Add locations in Settings → Warehouses</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {/* Warehouse card always first, spans 2 columns */}
          {warehouseCard && (
            <WarehouseSummaryCard
              data={warehouseCard}
              onClick={() =>
                navigate(
                  `/headoffice-pos/store/${warehouseCard.store.id}?type=warehouse&name=${encodeURIComponent(warehouseCard.store.name)}`
                )
              }
            />
          )}
          {/* Branch store cards */}
          {cards.map((card) => (
            <StoreCard
              key={card.store.id}
              data={card}
              onClick={() =>
                navigate(
                  `/headoffice-pos/store/${card.store.id}?type=store&name=${encodeURIComponent(card.store.name)}`
                )
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}
