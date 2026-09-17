import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { fetchProductAvailability } from "@/app/store-portal/api/inventory";
import {
  fetchBrands,
  fetchCategories,
  fetchModels,
  fetchProducts,
  fetchSubcategories,
  productCardImage,
} from "@/app/store-portal/api/products";
import type { CatalogFacet, Product, StockLine } from "@/app/store-portal/types";
import { useCart } from "@/app/store-portal/context/CartContext";
import { ProductCard, type ShopCardItem } from "@/app/store-portal/components/products/ProductCard";
import {
  EmptyState,
  ErrorState,
  PageHeader,
  Pagination,
  Skeleton,
} from "@/app/store-portal/components/ui/primitives";
import { useDebouncedValue } from "@/app/store-portal/hooks/useDebouncedValue";

const PAGE_SIZE = 12;

function toShopItem(p: Product, line?: StockLine): ShopCardItem {
  return {
    sku: p.sku,
    name: p.name,
    productId: p.id,
    availableQty: line?.availableQty ?? p.availableQty ?? 0,
    alertQty: p.alertQty || line?.alertQty || 0,
    sellingPrice: p.sellingPrice,
    mrp: p.mrp,
    imageUrl: productCardImage(p) || line?.thumbnailUrl || line?.imageUrl,
    brand: p.brand,
    category: p.category,
  };
}

export function ShopPage() {
  const { addItem } = useCart();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [items, setItems] = useState<ShopCardItem[]>([]);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(1);
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [sort, setSort] = useState("name");
  const [stockFilter, setStockFilter] = useState<"all" | "in" | "low" | "out">("all");
  const [categories, setCategories] = useState<CatalogFacet[]>([]);
  const [subcategories, setSubcategories] = useState<CatalogFacet[]>([]);
  const [brands, setBrands] = useState<CatalogFacet[]>([]);
  const [models, setModels] = useState<CatalogFacet[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const debouncedSearch = useDebouncedValue(search, 400);

  useEffect(() => {
    fetchCategories().then(setCategories);
    fetchSubcategories().then(setSubcategories);
    fetchBrands().then(setBrands);
    fetchModels().then(setModels);
  }, []);

  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, category, subCategory, brand, model, sort, stockFilter]);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError("");

    const run = async () => {
      const prod = await fetchProducts({
        page,
        limit: PAGE_SIZE,
        search: debouncedSearch.trim() || undefined,
        category: category || undefined,
        subCategory: subCategory || undefined,
        brand: brand || undefined,
        model: model || undefined,
        status: "Active",
        sort,
        inStock: stockFilter === "in" ? true : undefined,
      });
      const needsStock = prod.products.some((p) => p.availableQty == null);
      let stockBySku = new Map<string, StockLine>();
      if (needsStock) {
        const skus = prod.products.map((p) => p.sku).filter(Boolean).join(",");
        try {
          const avail = await fetchProductAvailability(
            skus ? { sku: skus, page, limit: PAGE_SIZE } : { page, limit: PAGE_SIZE }
          );
          stockBySku = new Map(
            avail.lines.filter((s) => s.sku).map((s) => [s.sku.toUpperCase(), s])
          );
        } catch {
          /* product payload already includes availableQty */
        }
      }

      let mapped = prod.products
        .filter((p) => p.status?.toLowerCase() !== "inactive")
        .map((p) => toShopItem(p, stockBySku.get(p.sku.toUpperCase())));

      if (stockFilter === "out") mapped = mapped.filter((i) => i.availableQty <= 0);
      if (stockFilter === "low") {
        mapped = mapped.filter(
          (i) => i.availableQty > 0 && i.availableQty <= (i.alertQty || 5)
        );
      }

      if (cancelled) return;
      setItems(mapped);
      setTotal(prod.total);
      setPages(prod.pages);
      if (prod.page < prod.pages) {
        void fetchProducts({
          page: prod.page + 1,
          limit: PAGE_SIZE,
          search: debouncedSearch.trim() || undefined,
          category: category || undefined,
          subCategory: subCategory || undefined,
          brand: brand || undefined,
          model: model || undefined,
          status: "Active",
          sort,
          inStock: stockFilter === "in" ? true : undefined,
        });
      }
    };

    run()
      .catch((e) => {
        if (!cancelled) setError(e instanceof Error ? e.message : "Failed to load shop");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [page, debouncedSearch, category, subCategory, brand, model, sort, stockFilter, reloadKey]);

  const toCartLine = (item: ShopCardItem, backorder: boolean) => ({
    productId: item.productId,
    sku: item.sku,
    name: item.name,
    imageUrl: item.imageUrl,
    unitCost: item.sellingPrice,
    availableQty: item.availableQty,
    isBackorder: backorder,
  });

  return (
    <div>
      <PageHeader
        title="Shop"
        subtitle="Search Head Office catalog — order from available stock, not a completed sale"
      />

      <div className="mb-6 rounded-xl border border-slate-200 bg-white p-3 shadow-sm">
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-3 text-sm outline-none focus:border-teal-500 focus:bg-white focus:ring-2 focus:ring-teal-100"
            placeholder="Search products, SKU, or brand…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
                {c.productCount != null ? ` (${c.productCount})` : ""}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={subCategory}
            onChange={(e) => setSubCategory(e.target.value)}
          >
            <option value="">All sub-categories</option>
            {subcategories.map((c) => (
              <option key={c.id} value={c.name}>
                {c.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={brand}
            onChange={(e) => setBrand(e.target.value)}
          >
            <option value="">All brands</option>
            {brands.map((b) => (
              <option key={b.id} value={b.name}>
                {b.name}
                {b.productCount != null ? ` (${b.productCount})` : ""}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={model}
            onChange={(e) => setModel(e.target.value)}
          >
            <option value="">All models</option>
            {models.map((m) => (
              <option key={m.id} value={m.name}>
                {m.name}
              </option>
            ))}
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as typeof stockFilter)}
          >
            <option value="all">All stock</option>
            <option value="in">Available</option>
            <option value="low">Low stock</option>
            <option value="out">Unavailable</option>
          </select>
          <select
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            <option value="name">Name</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            <option value="newest">Newest</option>
          </select>
        </div>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorState message={error} onRetry={() => setReloadKey((k) => k + 1)} />
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="h-96" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState title="No products found" description="Try a different search or filter." />
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 xl:grid-cols-4">
            {items.map((item) => (
              <ProductCard
                key={item.sku}
                item={item}
                href={`/store/shop/${encodeURIComponent(item.sku)}`}
                onAdd={(qty) => addItem(toCartLine(item, false), qty)}
                onRequest={(qty) => addItem(toCartLine(item, true), qty)}
              />
            ))}
          </div>
          <Pagination page={page} pages={pages} total={total} onPage={setPage} />
        </>
      )}
    </div>
  );
}
