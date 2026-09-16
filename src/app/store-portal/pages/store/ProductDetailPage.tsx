import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { fetchProductAvailability } from "@/app/store-portal/api/inventory";
import { fetchProductBySku, productCardImage } from "@/app/store-portal/api/products";
import type { Product, StockLine } from "@/app/store-portal/types";
import { useCart } from "@/app/store-portal/context/CartContext";
import { ProductGallery } from "@/app/store-portal/components/products/ProductGallery";
import {
  Button,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
  StockBadge,
} from "@/app/store-portal/components/ui/primitives";
import { discountPercent, fmtZAR } from "@/app/store-portal/lib/utils";

export function ProductDetailPage() {
  const { sku = "" } = useParams();
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [stock, setStock] = useState<StockLine | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    const decoded = decodeURIComponent(sku);
    setLoading(true);
    setError("");
    setQty(1);
    fetchProductBySku(decoded)
      .then(async (p) => {
        setProduct(p);
        try {
          const avail = await fetchProductAvailability({ sku: p.sku });
          setStock(
            avail.lines.find((s) => s.sku.toUpperCase() === p.sku.toUpperCase()) ?? null
          );
        } catch {
          setStock(null);
        }
      })
      .catch((e) => setError(e instanceof Error ? e.message : "Failed to load"))
      .finally(() => setLoading(false));
  }, [sku]);

  if (loading) {
    return (
      <div className="grid gap-8 md:grid-cols-2">
        <Skeleton className="aspect-square" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div>
        <ErrorState message={error || "Not found"} />
        <Link to="/store/shop" className="mt-4 inline-block text-sm text-teal-700">
          Back to shop
        </Link>
      </div>
    );
  }

  const available = stock?.availableQty ?? product.availableQty ?? 0;
  const unavailable = available <= 0;
  const off = discountPercent(product.mrp, product.sellingPrice);
  const max = unavailable ? 99 : Math.max(1, available);

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`SKU ${product.sku}`}
        actions={
          <Link to="/store/shop" className="text-sm text-teal-700 hover:underline">
            Back to shop
          </Link>
        }
      />
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery product={product} />
        <div className="space-y-4">
          {product.brand && (
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {product.brand}
            </p>
          )}
          <div className="flex flex-wrap items-baseline gap-3">
            <p className="text-3xl font-semibold text-slate-900">{fmtZAR(product.sellingPrice)}</p>
            {off != null && product.mrp != null && (
              <>
                <p className="text-lg text-slate-400 line-through">{fmtZAR(product.mrp)}</p>
                <span className="rounded bg-rose-50 px-2 py-0.5 text-sm font-semibold text-rose-700">
                  {off}% off
                </span>
              </>
            )}
          </div>
          <StockBadge available={available} alertQty={product.alertQty} />
          <Card className="space-y-2 p-4 text-sm">
            <h3 className="font-semibold text-slate-900">Stock availability</h3>
            <div className="flex justify-between">
              <span className="text-slate-600">Available to order</span>
              <span className="font-medium">{available}</span>
            </div>
            {stock && (
              <>
                <div className="flex justify-between text-slate-500">
                  <span>Physical (HO shelf)</span>
                  <span>{stock.physicalQty}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Allocated to orders</span>
                  <span>{stock.allocatedQty}</span>
                </div>
              </>
            )}
            <p className="pt-2 text-xs text-slate-500">
              This is Head Office stock available to branches. Placing an order does not remove
              physical shelf stock until Head Office invoices and dispatches.
            </p>
          </Card>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd className="font-medium">{product.category || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Unit</dt>
              <dd className="font-medium">{product.unit || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Tax</dt>
              <dd className="font-medium">{product.taxPercent}%</dd>
            </div>
            <div>
              <dt className="text-slate-500">Brand</dt>
              <dd className="font-medium">{product.brand || "—"}</dd>
            </div>
          </dl>
          {product.description && (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">About this product</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{product.description}</p>
            </div>
          )}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="number"
              min={1}
              max={max}
              value={qty}
              onChange={(e) => setQty(Math.max(1, Math.min(max, Number(e.target.value) || 1)))}
              className="w-20 rounded border border-slate-200 px-2 py-2 text-center"
            />
            <Button
              onClick={() =>
                addItem(
                  {
                    productId: product.id,
                    sku: product.sku,
                    name: product.name,
                    imageUrl: productCardImage(product),
                    unitCost: product.sellingPrice,
                    availableQty: available,
                    isBackorder: unavailable,
                    taxPercent: product.taxPercent,
                  },
                  qty
                )
              }
            >
              {unavailable ? "Request / Backorder" : "Add to Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
