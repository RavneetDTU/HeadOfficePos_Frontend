import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";
import { fetchProductAvailability } from "@/app/store-portal/api/inventory";
import { fetchProductBySku } from "@/app/store-portal/api/products";
import type { Product, StockLine } from "@/app/store-portal/types";
import { ProductGallery } from "@/app/store-portal/components/products/ProductGallery";
import {
  Badge,
  Card,
  ErrorState,
  PageHeader,
  Skeleton,
  StockBadge,
} from "@/app/store-portal/components/ui/primitives";
import { discountPercent, fmtZAR } from "@/app/store-portal/lib/utils";
import { useCatalogBase } from "@/app/store-portal/lib/catalogPaths";

export function AdminProductDetailPage() {
  const catalogBase = useCatalogBase();
  const { sku = "" } = useParams();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [product, setProduct] = useState<Product | null>(null);
  const [stock, setStock] = useState<StockLine | null>(null);

  useEffect(() => {
    const decoded = decodeURIComponent(sku);
    setLoading(true);
    setError("");
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
        <Link to={catalogBase} className="mt-4 inline-block text-sm text-teal-700">
          Back to products
        </Link>
      </div>
    );
  }

  const available = stock?.availableQty ?? product.availableQty ?? 0;
  const off = discountPercent(product.mrp, product.sellingPrice);

  return (
    <div>
      <PageHeader
        title={product.name}
        subtitle={`SKU ${product.sku}`}
        actions={
          <Link to={catalogBase} className="text-sm text-teal-700 hover:underline">
            Back to products
          </Link>
        }
      />
      <div className="grid gap-8 md:grid-cols-2">
        <ProductGallery product={product} />
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {product.brand && (
              <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
                {product.brand}
              </p>
            )}
            <Badge tone={product.status === "Active" ? "ok" : "neutral"}>{product.status}</Badge>
          </div>
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
            <h3 className="font-semibold text-slate-900">Stock</h3>
            <div className="flex justify-between">
              <span className="text-slate-600">Available</span>
              <span className="font-medium">{available}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Physical (HO shelf)</span>
              <span>{stock?.physicalQty ?? product.physicalQty ?? "—"}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Allocated to orders</span>
              <span>{stock?.allocatedQty ?? product.allocatedQty ?? "—"}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Alert quantity</span>
              <span>{product.alertQty}</span>
            </div>
          </Card>
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className="text-slate-500">Category</dt>
              <dd className="font-medium">{product.category || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Brand</dt>
              <dd className="font-medium">{product.brand || "—"}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Unit</dt>
              <dd className="font-medium">{product.unit || "—"}</dd>
            </div>
            {(product.serialNumbers?.length || product.serialNumber) && (
              <div className="col-span-2">
                <dt className="text-slate-500">Serial number</dt>
                <dd className="font-medium font-mono text-xs">
                  {product.serialNumbers?.length ? product.serialNumbers.join(", ") : product.serialNumber}
                </dd>
              </div>
            )}
            <div>
              <dt className="text-slate-500">Tax</dt>
              <dd className="font-medium">{product.taxPercent}%</dd>
            </div>
            <div>
              <dt className="text-slate-500">Cost price</dt>
              <dd className="font-medium">{fmtZAR(product.costPrice)}</dd>
            </div>
            <div>
              <dt className="text-slate-500">Selling price</dt>
              <dd className="font-medium">{fmtZAR(product.sellingPrice)}</dd>
            </div>
          </dl>
          {product.description ? (
            <div>
              <h3 className="mb-1 text-sm font-semibold text-slate-900">About this product</h3>
              <p className="whitespace-pre-wrap text-sm text-slate-600">{product.description}</p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No description provided.</p>
          )}
        </div>
      </div>
    </div>
  );
}
