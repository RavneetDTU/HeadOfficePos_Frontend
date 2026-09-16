import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router";
import { fetchProductAvailability } from "@/app/store-portal/api/inventory";
import { fetchOrders, orderStatusTone } from "@/app/store-portal/api/orders";
import { fetchStoreDashboard } from "@/app/store-portal/api/dashboard";
import type { BranchOrder } from "@/app/store-portal/types";
import { useAuth } from "@/app/context/AuthContext";
import {
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";

function Kpi({ label, value }: { label: string; value: string | number }) {
  return (
    <Card className="p-4">
      <p className="text-xs text-slate-500 uppercase tracking-wide">{label}</p>
      <p className="text-2xl font-semibold text-slate-900 mt-1">{value}</p>
    </Card>
  );
}

export function StoreDashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [availableProducts, setAvailableProducts] = useState(0);
  const [inventoryValue, setInventoryValue] = useState<number | null>(null);
  const [todaysSales, setTodaysSales] = useState<number | null>(null);

  const load = () => {
    setLoading(true);
    setError("");
    Promise.all([
      fetchStoreDashboard().catch(() => null),
      fetchOrders({ storeId: user?.storeId ?? undefined, limit: 50 }).catch(() => [] as BranchOrder[]),
      fetchProductAvailability().catch(() => ({
        lines: [],
        allocationLive: false,
        source: "sales_stock" as const,
        total: 0,
        page: 1,
        pages: 1,
      })),
    ])
      .then(([dash, ords, avail]) => {
        const sid = user?.storeId;
        const fromApi = sid == null ? ords : ords.filter((o) => o.storeId == null || o.storeId === sid);
        if (dash && dash.recentOrders.length > 0 && fromApi.length === 0) {
          setOrders(
            dash.recentOrders.map((o) => ({
              id: o.id,
              reference: o.reference,
              storeId: sid ?? null,
              status: o.status,
              createdAt: o.createdAt,
              total: o.total,
              subtotal: o.total,
              tax: 0,
              items: [],
            }))
          );
        } else {
          setOrders(fromApi);
        }
        const availCount = avail.lines.filter((l) => l.availableQty > 0).length;
        setAvailableProducts(dash?.currentInventory || availCount);
        setInventoryValue(dash ? dash.inventoryValue : null);
        setTodaysSales(dash ? dash.todaysSales : null);
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load dashboard"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.storeId]);

  const counts = useMemo(() => {
    const c = {
      pending: 0,
      dispatched: 0,
      completed: 0,
      total: orders.length,
    };
    for (const o of orders) {
      const s = o.status.toUpperCase();
      if (s === "PENDING") c.pending++;
      else if (s === "DISPATCHED") c.dispatched++;
      else if (s === "COMPLETED") c.completed++;
    }
    return c;
  }, [orders]);

  if (loading) {
    return (
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-24" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Dashboard"
        subtitle={user?.storeName || user?.warehouse || "My store"}
        actions={
          <Link
            to="/store/products"
            className="inline-flex rounded-lg bg-teal-700 text-white text-sm px-3.5 py-2 hover:bg-teal-800"
          >
            Browse products
          </Link>
        }
      />

      {error && <ErrorState message={error} onRetry={load} />}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Available products" value={availableProducts} />
        <Kpi label="Orders placed" value={counts.total} />
        <Kpi label="Pending" value={counts.pending} />
        <Kpi label="Dispatched" value={counts.dispatched} />
        <Kpi label="Completed" value={counts.completed} />
        {inventoryValue != null && <Kpi label="Inventory value" value={fmtZAR(inventoryValue)} />}
        {todaysSales != null && <Kpi label="Today's sales" value={fmtZAR(todaysSales)} />}
      </div>

      <Card className="overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-100 flex justify-between items-center">
          <h2 className="font-semibold text-slate-900">Recent orders</h2>
          <Link to="/store/orders" className="text-sm text-teal-700">
            View all
          </Link>
        </div>
        {orders.length === 0 ? (
          <EmptyState title="No orders yet" description="Place an order from the shop." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.slice(0, 8).map((o) => (
                  <tr key={o.id} className="hover:bg-slate-50/80">
                    <td className="px-4 py-3">
                      <Link to={`/store/orders/${o.id}`} className="text-teal-700 font-medium">
                        {o.reference}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-slate-600">
                      {o.createdAt ? new Date(o.createdAt).toLocaleDateString() : "—"}
                    </td>
                    <td className="px-4 py-3">{o.items?.length ?? "—"}</td>
                    <td className="px-4 py-3">{fmtZAR(o.total)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={orderStatusTone(o.status)}>{o.status}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
