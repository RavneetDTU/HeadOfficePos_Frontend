import { useAuth } from "@/app/context/AuthContext";
import {
  canPrintInvoice,
  fetchOrder,
  formatOrderStatus,
  isPreOrderStatus,
  markOrderOrdered,
  normalizeOrderStatus,
  orderStatusTone,
  printInvoiceFromApi,
  receiveOrder,
  type StoreOrderSource,
} from "@/app/store-portal/api/orders";
import { ProductImage } from "@/app/store-portal/components/products/ProductImage";
import {
  Badge,
  Button,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";
import type { BranchOrder } from "@/app/store-portal/types";
import { Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router";
import { toast } from "sonner";

const STEPS = ["PRE_ORDER", "ORDERED", "INVOICED", "DISPATCHED", "RECEIVED"];

function stepIndex(status: string) {
  const s = normalizeOrderStatus(status);
  if (s === "PRE_ORDER") return 0;
  if (s === "PROCESSING" || s === "PARTIAL" || s === "BACKORDER") return 1;
  if (s === "PARTIALLY_RECEIVED") return 4;
  if (s === "COMPLETED") return 4;
  return STEPS.indexOf(s);
}

export function OrderDetailPage() {
  const { id } = useParams();
  const [params] = useSearchParams();
  const { user } = useAuth();
  const [order, setOrder] = useState<BranchOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [receivedQty, setReceivedQty] = useState<Record<string, number>>({});

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
        const q: Record<string, number> = {};
        o.items.forEach((i, idx) => {
          q[`${i.sku}-${idx}`] = i.receivedQty ?? i.dispatchedQty ?? i.quantity;
        });
        setReceivedQty(q);
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

  const s = normalizeOrderStatus(order.status);
  const statusIdx = stepIndex(order.status);
  const canOrder = isPreOrderStatus(order.status);
  const canReceive = s === "DISPATCHED" || s === "PARTIALLY_RECEIVED";
  const showPrint = canPrintInvoice(order);

  const onMarkOrdered = async () => {
    setBusy(true);
    try {
      setOrder(await markOrderOrdered(order.id));
      toast.success("Marked as Ordered — Head Office will pack this.");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update status");
    } finally {
      setBusy(false);
    }
  };

  const onReceive = async () => {
    setBusy(true);
    try {
      const updated = await receiveOrder(
        order.id,
        order.items.map((item, idx) => ({
          sku: item.sku,
          receivedQty: receivedQty[`${item.sku}-${idx}`] ?? 0,
        }))
      );
      setOrder(updated);
      toast.success(`Marked ${formatOrderStatus(updated.status)}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not confirm receipt");
    } finally {
      setBusy(false);
    }
  };

  const onPrint = async () => {
    try {
      await printInvoiceFromApi(order.id);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Invoice is not available yet");
    }
  };

  return (
    <div>
      <PageHeader
        title={order.reference}
        subtitle={`${order.fromWarehouse || "Head Office"} → ${order.storeName || user?.storeName || "Store"}`}
        actions={
          <div className="flex items-center gap-3">
            {canOrder && (
              <Button type="button" disabled={busy} onClick={onMarkOrdered}>
                Mark as Ordered
              </Button>
            )}
            {showPrint ? (
              <Button type="button" onClick={() => void onPrint()}>
                <Printer size={16} /> Print Invoice
              </Button>
            ) : (
              <span className="text-xs text-slate-500">Invoice appears after Head Office converts this order or back order.</span>
            )}
            <Link to="/store/orders" className="text-sm text-teal-700 hover:underline">
              All orders
            </Link>
          </div>
        }
      />

      <div className="flex flex-wrap gap-3 mb-6 items-center">
        <Badge tone={orderStatusTone(order.status)}>{formatOrderStatus(order.status)}</Badge>
        <span className="text-sm text-slate-500">
          {order.createdAt ? new Date(order.createdAt).toLocaleString() : ""}
        </span>
        {order.invoiceReference && (
          <span className="text-sm text-slate-500">Invoice: {order.invoiceReference}</span>
        )}
        {order.backorderReference && order.backorderOrderId && (
          <Link to={`/store/orders/${order.backorderOrderId}`} className="text-sm text-teal-700 hover:underline">
            Back order: {order.backorderReference}
          </Link>
        )}
        {order.parentReference && order.parentOrderId && (
          <Link to={`/store/orders/${order.parentOrderId}`} className="text-sm text-teal-700 hover:underline">
            From order: {order.parentReference}
          </Link>
        )}
      </div>

      <Card className="p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Timeline</h3>
        <ol className="flex flex-wrap gap-2 text-xs">
          {STEPS.map((step, i) => (
            <li
              key={step}
              className={`rounded-full px-3 py-1 ${
                statusIdx >= i || s === "COMPLETED" || s === "RECEIVED" || s === "PARTIALLY_RECEIVED"
                  ? "bg-teal-700 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}
            >
              {formatOrderStatus(step)}
            </li>
          ))}
        </ol>
        {(s === "REJECTED" || s === "CANCELLED") && (
          <p className="text-sm text-rose-600 mt-3">Order {order.status.toLowerCase()}.</p>
        )}
        {order.timeline && order.timeline.length > 0 && (
          <ul className="mt-4 space-y-2 border-t border-slate-100 pt-3">
            {order.timeline.map((ev, i) => (
              <li key={`${ev.createdAt}-${i}`} className="text-xs text-slate-600">
                <span className="font-medium text-slate-800">
                  {ev.oldStatus
                    ? `${formatOrderStatus(ev.oldStatus)} → ${formatOrderStatus(ev.newStatus || "")}`
                    : ev.newStatus}
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
              {canReceive && <th className="px-4 py-3">Received qty</th>}
              <th className="px-4 py-3 text-right">Price</th>
              <th className="px-4 py-3 text-right">Subtotal</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {order.items.map((item, idx) => {
              const key = `${item.sku}-${idx}`;
              const expected = item.dispatchedQty ?? item.quantity;
              const got = receivedQty[key] ?? expected;
              const mismatch = canReceive && got !== expected;
              return (
                <tr key={key}>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <ProductImage
                        src={item.imageUrl}
                        alt={item.productName}
                        className="h-10 w-10 shrink-0 rounded-md border border-slate-100"
                        iconSize={16}
                      />
                      <span>
                        {item.productName}
                        {s === "BACKORDER" && <Badge tone="warn">Back order</Badge>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-3">{item.quantity}</td>
                  {canReceive && (
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min={0}
                        className={`w-20 rounded border px-2 py-1 ${mismatch ? "border-red-400 text-red-600" : ""}`}
                        value={got}
                        onChange={(e) =>
                          setReceivedQty((q) => ({ ...q, [key]: Math.max(0, Number(e.target.value) || 0) }))
                        }
                      />
                    </td>
                  )}
                  <td className="px-4 py-3 text-right">{fmtZAR(item.unitPrice)}</td>
                  <td className="px-4 py-3 text-right">{fmtZAR(item.subtotal)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {canReceive && (
        <div className="mb-6">
          <Button disabled={busy} onClick={onReceive}>
            Confirm received quantities
          </Button>
        </div>
      )}

      {order.removedItems && order.removedItems.length > 0 && (
        <Card className="overflow-hidden mb-6">
          <div className="px-4 py-3 border-b border-slate-100 text-sm font-semibold">Removed items</div>
          <table className="w-full text-sm">
            <tbody>
              {order.removedItems.map((item, idx) => (
                <tr key={`rm-${item.sku}-${idx}`} className="text-slate-400 line-through">
                  <td className="px-4 py-2">{item.productName}</td>
                  <td className="px-4 py-2 font-mono text-xs">{item.sku}</td>
                  <td className="px-4 py-2">{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}

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
