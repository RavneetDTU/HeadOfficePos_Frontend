import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { Printer } from "lucide-react";
import { fetchOrder, orderStatusTone, type StoreOrderSource } from "@/app/store-portal/api/orders";
import type { BranchOrder } from "@/app/store-portal/types";
import { useAuth } from "@/app/context/AuthContext";
import { printOrderInvoice } from "@/app/lib/printSellInvoice";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";

const STEPS = ["PENDING", "PROCESSING", "INVOICED", "DISPATCHED", "COMPLETED"];

export function OrderDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<BranchOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const source = (params.get("src") as StoreOrderSource | null) ?? undefined;

  useEffect(() => {
    const oid = Number(id);
    if (!oid) {
      setError("Invalid order");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOrder(oid, source)
      .then((o) => {
        if (user?.storeId != null && o.storeId != null && o.storeId !== user.storeId) {
          setError("This order does not belong to your store.");
          setOrder(null);
          return;
        }
        setOrder(o);
      })
      .catch((e) => {
        setError(e instanceof Error ? e.message : "Failed to load order");
      })
      .finally(() => setLoading(false));
  }, [id, source, user?.storeId]);

  if (loading) return <Skeleton className="h-64" />;
  if (error || !order) {
    return (
      <div>
        <ErrorState message={error || "Not found"} />
        <Link to="/store/orders" className="text-sm text-teal-700 mt-4 inline-block">
          Back to orders
        </Link>
      </div>
    );
  }

  const statusIdx = STEPS.indexOf(order.status.toUpperCase());

  return (
    <div>
      <PageHeader
        title={order.reference}
        subtitle={`${order.fromWarehouse || "Head Office"} → ${order.storeName || user?.storeName || "Store"}`}
        actions={
          <div className="flex items-center gap-3">
            <Button
              type="button"
              onClick={() =>
                printOrderInvoice({
                  reference: order.reference,
                  createdAt: order.createdAt,
                  createdBy: order.createdBy || user?.name || user?.username,
                  storeName: order.storeName || user?.storeName || user?.warehouse,
                  items: order.items,
                })
              }
            >
              <Printer size={16} /> Print Invoice
            </Button>
            <Link to="/store/orders" className="text-sm text-teal-700 hover:underline">
              All orders
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <Badge tone={orderStatusTone(order.status)}>{order.status}</Badge>
        <span className="text-sm text-slate-500">
          {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
        </span>
      </div>

      <Card className="p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Timeline</h3>
        <ol className="flex flex-wrap gap-2 text-xs">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className={`rounded-full px-3 py-1 ${
                statusIdx >= i || order.status.toUpperCase() === "COMPLETED" || order.status.toUpperCase() === "RECEIVED"
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {step}
            </li>
          ))}
        </ol>
        {(order.status === "REJECTED" || order.status === "CANCELLED") && (
          <p className="text-sm text-rose-600 mt-3">Order {order.status.toLowerCase()}.</p>
        )}
        {order.timeline && order.timeline.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {order.timeline.map((ev, i) => (
              <li key={`${ev.createdAt}-${i}`} className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">
                  {ev.oldStatus ? `${ev.oldStatus} → ${ev.newStatus}` : ev.newStatus}
                </span>
                {ev.changedBy ? ` · ${ev.changedBy}` : ""}
                {ev.createdAt ? ` · ${new Date(ev.createdAt).toLocaleString()}` : ""}
                {ev.notes ? ` — ${ev.notes}` : ""}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card className="overflow-hidden mb-6">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-xs text-slate-500">
            <tr>
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">SKU</th>
              <th className="px-4 py-3">Qty</th>
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => (
              <tr key={`${item.sku}-${idx}`}>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    {item.imageUrl && (
                      <img
                        src={item.imageUrl}
                        alt=""
                        className="h-10 w-10 rounded-md border border-slate-100 object-contain"
                      />
                    )}
                    <span>
                      {item.productName}
                      {item.isBackorder && (
                        <Badge tone="warn">Backorder</Badge>
                      )}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                <td className="px-4 py-3">{item.quantity}</td>
                <td className="px-4 py-3 text-right">{fmtZAR(item.unitPrice)}</td>
                <td className="px-4 py-3 text-right">{fmtZAR(item.subtotal)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      <Card className="p-4 max-w-sm ml-auto space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal</span>
          <span>{fmtZAR(order.subtotal)}</span>
        </div>
        <div className="flex justify-between">
          <span>Tax</span>
          <span>{fmtZAR(order.tax)}</span>
        </div>
        <div className="flex justify-between font-semibold text-base border-t pt-2">
          <span>Total</span>
          <span>{fmtZAR(order.total)}</span>
        </div>
      </Card>
    </div>
  );
}
