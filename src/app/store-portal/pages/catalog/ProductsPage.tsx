import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import {
  fetchBrands,
  fetchCategories,
  fetchProducts,
  productCardImage,
} from "@/app/store-portal/api/products";
import type { CatalogFacet, Product } from "@/app/store-portal/types";
import { ProductCard } from "@/app/store-portal/components/products/ProductCard";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { useDebouncedValue } from "@/app/store-portal/hooks/useDebouncedValue";
import { useCatalogBase } from "@/app/store-portal/lib/catalogPaths";

const PAGE_SIZE = 12;

export function ProductsPage() {
  const catalogBase = useCatalogBase();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [categories, setCategories] = useState<CatalogFacet[]>([]);
  const [brands, setBrands] = useState<CatalogFacet[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchBrands().then(setBrands);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, brand]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");
    fetchProducts({
      page,
      limit: PAGE_SIZE,
      search: debouncedSearch.trim() || undefined,
      category: category || undefined,
      brand: brand || undefined,
    })
      .then((res) => {
        if (cancelled) return;
        setProducts(res.products);
        setPages(res.pages);
        setTotal(res.total);
        if (res.page < res.pages) {
          void fetchProducts({
            page: res.page + 1,
            limit: PAGE_SIZE,
            search: debouncedSearch.trim() || undefined,
            category: category || undefined,
            brand: brand || undefined,
          });
        }
      })
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load products");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, brand, reloadKey]);

  return (
    <div>
      <PageHeader
        title="Products"
        subtitle={total ? `${total} in catalog — click a product for full details` : undefined}
      />
      {error && <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />}

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            type="search"
            placeholder="Search products, SKU, or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-80" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState title="No products" description="Try a different search or filter." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {products.map((p) => (
              <ProductCard
                key={p.id}
                href={`${catalogBase}/${encodeURIComponent(p.sku)}`}
                item={{
                  sku: p.sku,
                  name: p.name,
                  productId: p.id,
                  availableQty: p.availableQty ?? p.totalStock ?? 0,
                  alertQty: p.alertQty,
                  sellingPrice: p.sellingPrice,
                  mrp: p.mrp,
                  imageUrl: productCardImage(p),
                  brand: p.brand,
                  category: p.category,
                }}
              />
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
