import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { placeStoreOrder } from "@/app/store-portal/api/orders";
import { fetchWarehouses } from "@/app/store-portal/api/stores";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/store-portal/context/CartContext";
import { ProductImage } from "@/app/store-portal/components/products/ProductImage";
import {
  Button,
  Card,
  EmptyState,
  PageHeader,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { fmtZAR } from "@/app/store-portal/lib/utils";

function isHeadOffice(name: string) {
  const n = name.trim().toUpperCase();
  return n === "HEAD OFFICE" || n === "HO" || n.includes("HEAD OFFICE");
}

export function CartPage() {
  const { user } = useAuth();
  const { lines, loading, setQty, remove, clear, totalAmount, totalUnits } = useCart();
  const navigate = useNavigate();
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const onPlaceOrder = async (e: FormEvent) => {
    e.preventDefault();
    if (lines.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    if (user?.storeId == null) {
      toast.error("Your account is not linked to a store.");
      return;
    }

    for (const l of lines) {
      if (l.qty <= 0) {
        toast.error(`${l.name}: invalid quantity`);
        return;
      }
      if (!l.isBackorder && l.qty > l.availableQty) {
        toast.error(`Only ${l.availableQty} units of ${l.name} are currently available.`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const warehouses = await fetchWarehouses().catch(() => []);
      const ho =
        warehouses.find((w) => isHeadOffice(w.name)) ??
        warehouses.find((w) => w.id === 1) ??
        warehouses[0];

      const order = await placeStoreOrder({
        notes: notes.trim() || undefined,
        storeId: user.storeId,
        storeName: user.storeName || user.warehouse,
        warehouseId: ho?.id,
        warehouseName: ho?.name || "HEAD OFFICE",
        createdBy: user.name || user.username,
        items: lines.map((l) => ({
          productId: l.productId,
          sku: l.sku,
          name: l.name,
          quantity: l.qty,
          unitPrice: l.unitCost,
          imageUrl: l.imageUrl,
        })),
      });

      await clear();
      toast.success(`Order placed — ${order.reference}`);
      const src = order.source && order.source !== "order" ? `?src=${order.source}` : "";
      navigate(`/store/orders/${order.id}${src}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Cart"
        subtitle={`${totalUnits} unit${totalUnits === 1 ? "" : "s"} — place order to send to Head Office`}
        actions={
          <Link to="/store/shop" className="text-sm text-teal-700 hover:underline">
            Continue shopping
          </Link>
        }
      />

      {loading && lines.length === 0 ? (
        <Skeleton className="h-64" />
      ) : lines.length === 0 ? (
        <EmptyState title="Cart is empty" description="Browse the shop to add products." />
      ) : (
        <form onSubmit={onPlaceOrder} className="grid lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-500">
                  <tr>
                    <th className="px-4 py-3">Product</th>
                    <th className="px-4 py-3">Available</th>
                    <th className="px-4 py-3">Qty</th>
                    <th className="px-4 py-3 text-right">Price</th>
                    <th className="px-4 py-3 text-right">Subtotal</th>
                    <th className="px-4 py-3" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {lines.map((l) => (
                    <tr key={l.sku}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <ProductImage
                            src={l.imageUrl}
                            alt={l.name}
                            className="h-14 w-14 shrink-0 rounded-lg border border-slate-100"
                            iconSize={20}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{l.name}</p>
                            <p className="text-xs font-mono text-slate-500">{l.sku}</p>
                            {l.isBackorder && (
                              <span className="text-[11px] text-amber-700">Out of stock at Head Office</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">{l.isBackorder ? "—" : l.availableQty}</td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          min={1}
                          max={l.isBackorder ? undefined : l.availableQty}
                          value={l.qty}
                          onChange={(e) => setQty(l.sku, Number(e.target.value))}
                          className="w-20 rounded border border-slate-200 px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-3 text-right">{fmtZAR(l.unitCost)}</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {fmtZAR(l.qty * l.unitCost)}
                      </td>
                      <td className="px-4 py-3">
                        <button type="button" onClick={() => remove(l.sku)} className="text-rose-600">
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-5 h-fit space-y-4">
            <h2 className="font-semibold text-slate-900">Order summary</h2>
            <div className="text-sm space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Products</span>
                <span>{lines.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Total units</span>
                <span>{totalUnits}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-900 text-base pt-2 border-t">
                <span>Subtotal</span>
                <span>{fmtZAR(totalAmount)}</span>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-slate-700 mb-1">Notes for Head Office</label>
              <textarea
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional"
              />
            </div>
            <p className="text-xs text-slate-500">
              Place Order saves a Pre-order. Head Office creates the invoice later — it then shows on My Orders.
            </p>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={16} /> : null}
              Place Order
            </Button>
          </Card>
        </form>
      )}
    </div>
  );
}
