import { useState } from "react";
import { Link } from "react-router";
import { ShoppingCart } from "lucide-react";
import { ProductImage } from "@/app/store-portal/components/products/ProductImage";
import { Button, StockBadge } from "@/app/store-portal/components/ui/primitives";
import { cn, discountPercent, fmtZAR } from "@/app/store-portal/lib/utils";

export interface ShopCardItem {
  sku: string;
  name: string;
  productId: number;
  availableQty: number;
  alertQty: number;
  sellingPrice: number;
  mrp?: number | null;
  imageUrl?: string | null;
  brand?: string | null;
  category?: string | null;
}

export function ProductCard({
  item,
  href,
  onAdd,
  onRequest,
}: {
  item: ShopCardItem;
  href: string;
  onAdd?: (qty: number) => void;
  onRequest?: (qty: number) => void;
}) {
  const [qty, setQty] = useState(1);
  const unavailable = item.availableQty <= 0;
  const max = unavailable ? 99 : Math.max(1, item.availableQty);
  const off = discountPercent(item.mrp, item.sellingPrice);
  const showCart = Boolean(onAdd || onRequest);

  return (
    <article className="group flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-lg">
      <Link to={href} className="relative block bg-white">
        <ProductImage
          src={item.imageUrl}
          alt={item.name}
          className="aspect-square p-4"
          imgClassName="transition duration-200 group-hover:scale-[1.04]"
          iconSize={56}
        />
        {off != null && (
          <span className="absolute left-2 top-2 rounded bg-rose-600 px-1.5 py-0.5 text-[11px] font-bold text-white">
            {off}% off
          </span>
        )}
        {unavailable && (
          <span className="absolute inset-x-0 bottom-0 bg-slate-900/70 py-1 text-center text-[11px] font-semibold uppercase tracking-wide text-white">
            Out of stock
          </span>
        )}
      </Link>
      <div className="flex flex-1 flex-col p-3 sm:p-4">
        {item.brand && (
          <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">
            {item.brand}
          </p>
        )}
        <Link to={href}>
          <h3 className="mt-0.5 line-clamp-2 min-h-10 text-sm font-medium text-slate-900 hover:text-teal-800">
            {item.name}
          </h3>
        </Link>
        {item.category && <p className="mt-0.5 text-xs text-slate-500">{item.category}</p>}
        <p className="mt-1 font-mono text-[11px] text-slate-400">SKU: {item.sku}</p>
        <div className="mt-2 flex flex-wrap items-baseline gap-2">
          <p className="text-lg font-semibold text-slate-900">{fmtZAR(item.sellingPrice)}</p>
          {off != null && item.mrp != null && (
            <p className="text-sm text-slate-400 line-through">{fmtZAR(item.mrp)}</p>
          )}
        </div>
        <div className="mt-2">
          <StockBadge available={item.availableQty} alertQty={item.alertQty} />
        </div>
        {showCart && (
          <div className="mt-auto flex items-center gap-2 pt-3">
            <input
              type="number"
              min={1}
              max={max}
              value={qty}
              aria-label={`Quantity for ${item.name}`}
              onChange={(e) =>
                setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))
              }
              className="w-14 rounded-lg border border-slate-200 px-2 py-1.5 text-center text-sm"
            />
            {unavailable ? (
              <Button
                className="flex-1 text-xs sm:text-sm"
                variant="secondary"
                onClick={() => onRequest?.(qty)}
              >
                Request
              </Button>
            ) : (
              <Button className={cn("flex-1 text-xs sm:text-sm")} onClick={() => onAdd?.(qty)}>
                <ShoppingCart size={15} />
                Add
              </Button>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
