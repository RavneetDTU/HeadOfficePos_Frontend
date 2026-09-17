import { useAuth } from "@/app/context/AuthContext";
import {
  canPrintInvoice,
  fetchStoreOrders,
  formatOrderStatus,
  ORDER_STATUS_FILTERS,
  orderItemCount,
  orderStatusTone,
  printInvoiceFromApi,
} from "@/app/store-portal/api/orders";
import {
    Badge,
    Card,
    EmptyState,
    ErrorState,
    PageHeader,
    Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";
import type { BranchOrder } from "@/app/store-portal/types";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router";
import { toast } from "sonner";

const FILTERS = ["ALL", ...ORDER_STATUS_FILTERS];

function orderPath(order: BranchOrder) {
  const src = order.source && order.source !== "order" ? `?src=${order.source}` : "";
  return `/store/orders/${order.id}${src}`;
}

export function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<BranchOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("ALL");

  const load = () => {
    setLoading(true);
    setError("");
    fetchStoreOrders({
      storeId: user?.storeId ?? undefined,
      storeName: user?.storeName || user?.warehouse || undefined,
      status: status === "ALL" ? undefined : status,
      limit: 100,
    })
      .then((ords) => {
        const sid = user?.storeId;
        setOrders(
          sid == null ? ords : ords.filter((o) => o.storeId == null || o.storeId === sid)
        );
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load orders");
        setOrders([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.storeId, status]);

  return (
    <div>
      <PageHeader title="My Orders" subtitle="Orders from this store. Invoices appear only after Head Office converts the order." />

      <div className="flex flex-wrap gap-2 mb-4">
        {FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setStatus(f)}
            className={`text-xs rounded-full px-3 py-1.5 border ${
              status === f
                ? "bg-teal-700 text-white border-teal-700"
                : "bg-white text-slate-600 border-slate-200"
            }`}
          >
            {f === "ALL" ? "ALL" : formatOrderStatus(f)}
          </button>
        ))}
      </div>

      {error && <ErrorState message={error} onRetry={load} />}

      {loading ? (
        <Skeleton className="h-64" />
      ) : orders.length === 0 ? (
        <EmptyState title="No orders" description="Orders you place will appear here." />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-left text-xs text-slate-500">
                <tr>
                  <th className="px-4 py-3">Order #</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Items</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Invoice</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {orders.map((o) => (
                  <tr key={`${o.source ?? "order"}-${o.id}-${o.reference}`}>
                    <td className="px-4 py-3 font-medium">{o.reference}</td>
                    <td className="px-4 py-3">
                      {o.createdAt ? new Date(o.createdAt).toLocaleString() : "—"}
                    </td>
                    <td className="px-4 py-3">{orderItemCount(o) || "—"}</td>
                    <td className="px-4 py-3">{fmtZAR(o.total)}</td>
                    <td className="px-4 py-3">
                      <Badge tone={orderStatusTone(o.status)}>{formatOrderStatus(o.status)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {canPrintInvoice(o) ? (
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 text-teal-700 text-sm hover:underline"
                          onClick={() =>
                            printInvoiceFromApi(o.id).catch((e) =>
                              toast.error(e instanceof Error ? e.message : "Invoice is not available yet")
                            )
                          }
                        >
                          <Printer size={14} />
                          Print Invoice
                        </button>
                      ) : (
                        <span className="text-xs text-slate-400">Not created</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <Link to={orderPath(o)} className="text-teal-700 text-sm">
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
