import {
  approveOrder,
  cancelOrder,
  canPrintInvoice,
  createBackorder,
  dispatchOrder,
  fetchOrder,
  formatOrderStatus,
  hasServerInvoice,
  invoiceOrder,
  normalizeOrderStatus,
  orderStatusTone,
  printInvoiceFromApi,
  rejectOrder,
  removeOrderItems,
  updateOrder,
} from "@/app/store-portal/api/orders";
import {
  BackendBanner,
  Badge,
  Button,
  Card,
  ErrorState,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";
import type { BranchOrder } from "@/app/store-portal/types";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { toast } from "sonner";

function lineKey(sku: string, idx: number) {
  return `${sku}-${idx}`;
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [order, setOrder] = useState<BranchOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [apiMissing, setApiMissing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editQty, setEditQty] = useState<Record<string, number>>({});
  const [backorderQty, setBackorderQty] = useState<Record<string, number>>({});
  const [removeQty, setRemoveQty] = useState<Record<string, number>>({});

  const seedLineState = (o: BranchOrder) => {
    const q: Record<string, number> = {};
    const b: Record<string, number> = {};
    const r: Record<string, number> = {};
    o.items.forEach((i, idx) => {
      const key = lineKey(i.sku, idx);
      q[key] = i.quantity;
      b[key] = 0;
      r[key] = 0;
    });
    setEditQty(q);
    setBackorderQty(b);
    setRemoveQty(r);
  };

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
        seedLineState(o);
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

  const onPrint = async () => {
    if (!order) return;
    try {
      await printInvoiceFromApi(order.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invoice is not available yet");
    }
  };

  const run = async (fn: () => Promise<BranchOrder>, ok: string) => {
    setBusy(true);
    try {
      const updated = await fn();
      setOrder(updated);
      seedLineState(updated);
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
          quantity: editQty[lineKey(item.sku, idx)] ?? item.quantity,
          unitPrice: item.unitPrice,
        })),
      });
      setOrder(updated);
      seedLineState(updated);
      setEditMode(false);
      toast.success("Order updated");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(false);
    }
  };

  const splitBackorder = async () => {
    if (!order) return;
    const items = order.items
      .map((item, idx) => {
        const key = lineKey(item.sku, idx);
        const move = Math.min(Math.max(0, backorderQty[key] ?? 0), editQty[key] ?? item.quantity);
        return {
          productId: item.productId,
          sku: item.sku,
          quantity: move,
          unitPrice: item.unitPrice,
        };
      })
      .filter((i) => i.quantity > 0);
    if (!items.length) {
      toast.error("Set backorder qty on items you cannot send now.");
      return;
    }
    setBusy(true);
    try {
      const { original, backorder } = await createBackorder(order.id, items);
      setOrder(original);
      seedLineState(original);
      toast.success(`Back order ${backorder.reference} created. This order is now partial.`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not create back order");
    } finally {
      setBusy(false);
    }
  };

  const removeSelected = async () => {
    if (!order) return;
    const items = order.items
      .map((item, idx) => {
        const key = lineKey(item.sku, idx);
        const qty = Math.min(Math.max(0, removeQty[key] ?? 0), item.quantity);
        return { productId: item.productId, sku: item.sku, quantity: qty };
      })
      .filter((i) => i.quantity > 0);
    if (!items.length) {
      toast.error("Set remove qty on discontinued items.");
      return;
    }
    setBusy(true);
    try {
      const updated = await removeOrderItems(order.id, items, "Removed — no longer sold");
      setOrder(updated);
      seedLineState(updated);
      toast.success("Items removed. Order is partial.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove items");
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

  const s = normalizeOrderStatus(order.status);
  const canEdit = ["PRE_ORDER", "ORDERED", "PARTIAL", "BACKORDER", "PROCESSING"].includes(s);
  const canInvoice = ["ORDERED", "PARTIAL", "BACKORDER", "PROCESSING"].includes(s) && !hasServerInvoice(order);
  const canDispatch = s === "INVOICED";
  const showPrint = canPrintInvoice(order);
  const backorderTotal = order.items.reduce(
    (sum, item, idx) => sum + (backorderQty[lineKey(item.sku, idx)] ?? 0),
    0
  );
  const removeTotal = order.items.reduce((sum, item, idx) => sum + (removeQty[lineKey(item.sku, idx)] ?? 0), 0);

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

      <div className="flex flex-wrap gap-2 mb-4 items-center">
        <Badge tone={orderStatusTone(order.status)}>{formatOrderStatus(order.status)}</Badge>
        {order.saleReference && <span className="text-sm text-slate-500">Sale: {order.saleReference}</span>}
        {order.invoiceReference && <span className="text-sm text-slate-500">Invoice: {order.invoiceReference}</span>}
        {order.backorderReference && order.backorderOrderId && (
          <Link to={`/branch-orders/${order.backorderOrderId}`} className="text-sm text-teal-700 hover:underline">
            Back order: {order.backorderReference}
          </Link>
        )}
        {order.parentReference && order.parentOrderId && (
          <Link to={`/branch-orders/${order.parentOrderId}`} className="text-sm text-teal-700 hover:underline">
            From order: {order.parentReference}
          </Link>
        )}
      </div>

      {order.timeline && order.timeline.length > 0 && (
        <Card className="p-4 mb-4">
          <h3 className="text-sm font-semibold mb-3">Timeline</h3>
          <ul className="space-y-2 text-sm text-slate-600">
            {order.timeline.map((ev, i) => (
              <li key={`${ev.createdAt}-${i}`}>
                <span className="font-medium text-slate-800">
                  {ev.oldStatus ? `${formatOrderStatus(ev.oldStatus)} → ${formatOrderStatus(ev.newStatus || "")}` : ev.newStatus}
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
        {canEdit && (
          <>
            {(s === "PROCESSING") && (
              <Button disabled={busy} onClick={() => run(() => approveOrder(order.id), "Approved")}>
                Approve
              </Button>
            )}
            <Button variant="danger" disabled={busy} onClick={() => run(() => rejectOrder(order.id), "Rejected")}>
              Reject
            </Button>
            <Button
              variant="secondary"
              disabled={busy}
              onClick={() => {
                if (editMode) seedLineState(order);
                setEditMode((v) => !v);
              }}
            >
              {editMode ? "Cancel edit" : "Edit order"}
            </Button>
            {editMode && (
              <Button disabled={busy} onClick={saveEdits}>
                Save changes
              </Button>
            )}
            <Button variant="secondary" disabled={busy || backorderTotal <= 0} onClick={splitBackorder}>
              Create back order
            </Button>
            <Button variant="ghost" disabled={busy || removeTotal <= 0} onClick={removeSelected}>
              Remove items
            </Button>
          </>
        )}
        {canInvoice && (
          <Button disabled={busy} onClick={() => run(() => invoiceOrder(order.id), "Invoice created — it now appears on the store order")}>
            Convert to Invoice
          </Button>
        )}
        {canDispatch && (
          <Button disabled={busy} onClick={() => run(() => dispatchOrder(order.id), "Dispatched")}>
            Dispatch
          </Button>
        )}
        {showPrint && (
          <Button variant="secondary" disabled={busy} onClick={() => void onPrint()}>
            <Printer size={16} /> Print Invoice
          </Button>
        )}
        {canEdit && (
          <Button variant="ghost" disabled={busy} onClick={() => run(() => cancelOrder(order.id), "Cancelled")}>
            Cancel
          </Button>
        )}
      </div>

      {canEdit && (
        <p className="text-sm text-slate-500 mb-3">
          Tick or set <span className="font-medium text-slate-700">Backorder qty</span> for items you cannot send
          now (they become a new back order). Use <span className="font-medium text-slate-700">Remove qty</span> for
          items you no longer sell. Remaining qty stays on this order to pack.
        </p>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                {canEdit && <th className="px-4 py-3 w-10">Move</th>}
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Qty</th>
                {canEdit && <th className="px-4 py-3 text-right">Backorder qty</th>}
                {canEdit && <th className="px-4 py-3 text-right">Remove qty</th>}
                {canEdit && <th className="px-4 py-3 text-right">Send now</th>}
                <th className="px-4 py-3 text-right">Price</th>
                <th className="px-4 py-3 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.items.map((item, idx) => {
                const key = lineKey(item.sku, idx);
                const ordered = editQty[key] ?? item.quantity;
                const move = Math.min(Math.max(0, backorderQty[key] ?? 0), ordered);
                const drop = Math.min(Math.max(0, removeQty[key] ?? 0), ordered);
                const sendNow = Math.max(0, ordered - move - drop);
                const checked = move > 0 && move >= ordered;
                return (
                  <tr key={key}>
                    {canEdit && (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={busy}
                          aria-label={`Move ${item.productName} to back order`}
                          onChange={(e) =>
                            setBackorderQty((q) => ({ ...q, [key]: e.target.checked ? ordered : 0 }))
                          }
                        />
                      </td>
                    )}
                    <td className="px-4 py-3">{item.productName}</td>
                    <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                    <td className="px-4 py-3 text-right">
                      {editMode ? (
                        <input
                          type="number"
                          min={0}
                          className="w-20 rounded border px-2 py-1 text-right ml-auto"
                          value={ordered}
                          onChange={(e) => {
                            const next = Math.max(0, Number(e.target.value) || 0);
                            setEditQty((q) => ({ ...q, [key]: next }));
                            setBackorderQty((q) => ({ ...q, [key]: Math.min(q[key] ?? 0, next) }));
                            setRemoveQty((q) => ({ ...q, [key]: Math.min(q[key] ?? 0, next) }));
                          }}
                        />
                      ) : (
                        item.quantity
                      )}
                    </td>
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={ordered}
                          className="w-20 rounded border px-2 py-1 text-right"
                          value={move}
                          disabled={busy}
                          onChange={(e) =>
                            setBackorderQty((q) => ({
                              ...q,
                              [key]: Math.min(ordered, Math.max(0, Number(e.target.value) || 0)),
                            }))
                          }
                        />
                      </td>
                    )}
                    {canEdit && (
                      <td className="px-4 py-3 text-right">
                        <input
                          type="number"
                          min={0}
                          max={ordered}
                          className="w-20 rounded border px-2 py-1 text-right"
                          value={drop}
                          disabled={busy}
                          onChange={(e) =>
                            setRemoveQty((q) => ({
                              ...q,
                              [key]: Math.min(ordered, Math.max(0, Number(e.target.value) || 0)),
                            }))
                          }
                        />
                      </td>
                    )}
                    {canEdit && <td className="px-4 py-3 text-right tabular-nums">{sendNow}</td>}
                    <td className="px-4 py-3 text-right">{fmtZAR(item.unitPrice)}</td>
                    <td className="px-4 py-3 text-right">{fmtZAR(sendNow * item.unitPrice)}</td>
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

      {order.removedItems && order.removedItems.length > 0 && (
        <Card className="overflow-hidden mt-4">
          <div className="px-4 py-3 border-b border-slate-100">
            <h3 className="text-sm font-semibold">Removed items</h3>
          </div>
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-500">
              <tr>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3 text-right">Qty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {order.removedItems.map((item, idx) => (
                <tr key={`rm-${item.sku}-${idx}`} className="text-slate-400 line-through">
                  <td className="px-4 py-3">{item.productName}</td>
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3 text-right">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
    </div>
  );
}
