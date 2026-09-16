import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";
import {
  approveOrder,
  cancelOrder,
  dispatchOrder,
  fetchOrder,
  invoiceOrder,
  orderStatusTone,
  rejectOrder,
  updateOrder,
} from "@/app/store-portal/api/orders";
import type { BranchOrder } from "@/app/store-portal/types";
import {
  Badge,
  BackendBanner,
  Button,
  Card,
  ErrorState,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<BranchOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiMissing, setApiMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editQty, setEditQty] = useState<Record<string, number>>({});

  const load = () => {
    const oid = Number(id);
    if (!oid) {
      setError("Invalid order");
      setLoading(false);
      return;
    }
    setLoading(true);
    fetchOrder(oid)
      .then((o) => {
        setOrder(o);
        const q: Record<string, number> = {};
        o.items.forEach((i, idx) => {
          q[`${i.sku}-${idx}`] = i.quantity;
        });
        setEditQty(q);
      })
      .catch((e) => {
        setApiMissing(true);
        setError(e instanceof Error ? e.message : "Failed to load");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const run = async (fn: () => Promise<BranchOrder>, ok: string) => {
    setBusy(true);
    try {
      const updated = await fn();
      setOrder(updated);
      toast.success(ok);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Action failed — check backend API");
    } finally {
      setBusy(false);
    }
  };

  const saveEdits = async () => {
    if (!order) return;
    setBusy(true);
    try {
      const updated = await updateOrder(order.id, {
        items: order.items.map((item, idx) => ({
          productId: item.productId,
          sku: item.sku,
          quantity: editQty[`${item.sku}-${idx}`] ?? item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      setOrder(updated);
      setEditMode(false);
      toast.success("Order updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed — needs PATCH /orders/{id}");
    } finally {
      setBusy(false);
    }
  };

  if (loading) return <Skeleton className="h-64 m-4 sm:m-6" />;
  if (error || !order) {
    return (
      <div className="p-4 sm:p-6">
        {apiMissing && (
          <BackendBanner>
            Needs <code className="text-xs">GET /orders/{"{id}"}</code> and lifecycle actions.
          </BackendBanner>
        )}
        <ErrorState message={error || "Not found"} />
      </div>
    );
  }

  const s = order.status.toUpperCase();
  const canProcess = s === "PENDING" || s === "PROCESSING";

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">{order.reference}</h1>
          <p className="text-sm text-slate-500 mt-1">
            {order.storeName || `Store #${order.storeId}`} · {order.createdBy || ""}
          </p>
        </div>
        <Link to="/branch-orders" className="text-sm text-teal-700 hover:underline shrink-0">
          Back to queue
        </Link>
      </div>

      {apiMissing && (
        <BackendBanner>
          Approve / reject / invoice / dispatch failed to load. Check{" "}
          <code className="text-xs">GET /orders/{"{id}"}</code>.
        </BackendBanner>
      )}

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Badge tone={orderStatusTone(order.status)}>{order.status}</Badge>
        {order.saleReference && (
          <span className="text-sm text-slate-500">Sale: {order.saleReference}</span>
        )}
      </div>

      {order.timeline && order.timeline.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Timeline</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {order.timeline.map((ev, i) => (
              <li key={`${ev.createdAt}-${i}`}>
                <span className="font-medium text-slate-800">
                  {ev.oldStatus ? `${ev.oldStatus} → ${ev.newStatus}` : ev.newStatus}
                </span>
                {ev.changedBy ? ` · ${ev.changedBy}` : ""}
                {ev.createdAt ? ` · ${new Date(ev.createdAt).toLocaleString()}` : ""}
                {ev.notes ? ` — ${ev.notes}` : ""}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <div className="flex flex-wrap gap-2 mb-4">
        {canProcess && (
          <>
            <Button disabled={busy} onClick={() => run(() => approveOrder(order.id), "Approved")}>
              Approve
            </Button>
            <Button
              variant="danger"
              disabled={busy}
              onClick={() => run(() => rejectOrder(order.id), "Rejected")}
            >
              Reject
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => setEditMode((v) => !v)}
            >
              {editMode ? "Cancel edit" : "Edit order"}
            </Button>
            {editMode && (
              <Button disabled={busy} onClick={saveEdits}>
                Save changes
              </Button>
            )}
          </>
        )}
        {(s === "PENDING" || s === "PROCESSING" || s === "APPROVED") && (
          <Button
            disabled={busy}
            onClick={() => run(() => invoiceOrder(order.id), "Converted to invoice")}
          >
            Convert to Invoice
          </Button>
        )}
        {(s === "INVOICED" || s === "PROCESSING") && (
          <Button
            disabled={busy}
            onClick={() => run(() => dispatchOrder(order.id), "Dispatched")}
          >
            Dispatch
          </Button>
        )}
        {canProcess && (
          <Button
            variant="ghost"
            disabled={busy}
            onClick={() => run(() => cancelOrder(order.id), "Cancelled")}
          >
            Cancel
          </Button>
        )}
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Qty</th>
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => {
                const key = `${item.sku}-${idx}`;
                return (
                  <tr key={key}>
                    <td className="px-4 py-3">{item.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-3 text-right">
                      {editMode ? (
                        <input
                          type="number"
                          min={0}
                          className="w-20 rounded border px-2 py-1 text-right ml-auto"
                          value={editQty[key] ?? item.quantity}
                          onChange={(e) =>
                            setEditQty((q) => ({ ...q, [key]: Number(e.target.value) || 0 }))
                          }
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">{fmtZAR(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{fmtZAR(item.subtotal)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-4 py-4 flex justify-end">
          <div className="w-full max-w-xs space-y-2 text-sm">
            <div className="flex justify-between gap-8">
              <span className="text-slate-500">Subtotal</span>
              <span className="tabular-nums">{fmtZAR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between gap-8">
              <span className="text-slate-500">Tax</span>
              <span className="tabular-nums">{fmtZAR(order.tax)}</span>
            </div>
            <div className="flex justify-between gap-8 font-semibold text-base border-t border-slate-100 pt-2">
              <span>Total</span>
              <span className="tabular-nums">{fmtZAR(order.total)}</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
