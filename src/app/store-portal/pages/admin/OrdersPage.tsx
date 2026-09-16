import { fetchOrders, orderItemCount, orderStatusTone } from "@/app/store-portal/api/orders";
import { fetchStores } from "@/app/store-portal/api/stores";
import {
  BackendBanner,
  Badge,
  Card,
  EmptyState,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";
import type { BranchOrder, Store } from "@/app/store-portal/types";
import { useEffect, useState } from "react";
import { Link } from "react-router";

export function OrdersPage() {
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [apiMissing, setApiMissing] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [storeId, setStoreId] = useState("");
  const [search, setSearch] = useState("");

  const load = () => {
    setLoading(true);
    setApiMissing(false);
    setError("");
    Promise.all([
      fetchOrders({
        status: status || undefined,
        storeId: storeId ? Number(storeId) : undefined,
        search: search || undefined,
        limit: 100,
      }),
      fetchStores().catch(() => [] as Store[]),
    ])
      .then(([ords, sts]) => {
        setOrders(ords);
        setStores(sts);
      })
      .catch((e) => {
        setApiMissing(true);
        setError(e instanceof Error ? e.message : "Failed to load");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, storeId]);

  return (
    <div className="p-4 sm:p-6">
      <PageHeader title="Order queue" subtitle="All branch orders for Head Office processing" />

      {apiMissing && (
        <BackendBanner>
          Needs <code className="text-xs">GET /orders</code> with admin access to all stores.
        </BackendBanner>
      )}

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
          placeholder="Search order #, branch, SKU…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
        />
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={storeId}
          onChange={(e) => setStoreId(e.target.value)}
        >
          <option value="">All branches</option>
          {stores.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All statuses</option>
          {["PENDING", "PROCESSING", "INVOICED", "DISPATCHED", "COMPLETED", "REJECTED", "CANCELLED"].map(
            (s) => (
              <option key={s} value={s}>
                {s}
              </option>
            )
          )}
        </select>
      </div>

      {error && !apiMissing && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <Skeleton className="h-64" />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders" description="Branch orders will appear here when placed." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Branch</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Created by</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="px-4 py-3 font-medium">{o.reference}</td>
                    <td className="px-4 py-3">{o.storeName || o.storeId || "—"}</td>
                    <td className="px-4 py-3">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">
                      {orderItemCount(o) || "—"}
                    </td>
                    <td className="px-4 py-3">{fmtZAR(o.total)}</td>
                    <td className="px-4 py-3">{o.createdBy || "—"}</td>
                    <td className="px-4 py-3">
                      <Badge tone={orderStatusTone(o.status)}>{o.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Link to={`/branch-orders/${o.id}`} className="text-teal-700">
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
