import { apiFetch, buildQuery } from "@/app/lib/api";
import { resolveMediaUrl } from "@/app/store-portal/lib/media";
import type { CatalogFacet, Product, ProductImage, StockLine } from "@/app/store-portal/types";

interface ProductListResponse {
  items?: Record<string, unknown>[];
  total?: number;
  page?: number;
  limit?: number;
  pages?: number;
}

export interface ProductPage {
  products: Product[];
  total: number;
  page: number;
  pages: number;
  limit: number;
}

export interface ProductQuery {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  brand?: string;
  status?: string;
  sort?: string;
  inStock?: boolean;
  /** Fetch every page (used by transfer picker). */
  all?: boolean;
}

function unwrapProductList(raw: unknown): Required<ProductListResponse> {
  if (Array.isArray(raw)) {
    return {
      items: raw as Record<string, unknown>[],
      total: raw.length,
      page: 1,
      limit: raw.length,
      pages: 1,
    };
  }
  const o = (raw ?? {}) as Record<string, unknown>;
  const items = (o.items ?? o.products ?? o.data ?? []) as Record<string, unknown>[];
  return {
    items,
    total: Number(o.total ?? items.length),
    page: Number(o.page ?? 1),
    limit: Number(o.limit ?? items.length),
    pages: Number(o.pages ?? 1),
  };
}

function mapImage(raw: Record<string, unknown>, index: number): ProductImage {
  const url = resolveMediaUrl(raw.url, raw.imageUrl, raw.image_url, raw.src, raw.path) ?? "";
  return {
    url,
    thumbnailUrl: resolveMediaUrl(
      raw.thumbnailUrl,
      raw.thumbnail_url,
      raw.thumbUrl,
      raw.thumb
    ),
    alt: (raw.alt as string) ?? null,
    sortOrder: Number(raw.sortOrder ?? raw.sort_order ?? index),
  };
}

function mapImages(raw: unknown): ProductImage[] {
  if (typeof raw === "string") {
    const url = resolveMediaUrl(raw);
    return url ? [{ url, thumbnailUrl: url, alt: null, sortOrder: 0 }] : [];
  }
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => mapImage((item ?? {}) as Record<string, unknown>, i))
    .filter((img) => img.url)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function mapProduct(raw: Record<string, unknown>): Product {
  const images = mapImages(raw.images ?? raw.photos ?? raw.gallery);
  const imageUrl = resolveMediaUrl(
    raw.imageUrl,
    raw.image_url,
    raw.image,
    raw.photo,
    raw.photoUrl,
    raw.productImage,
    raw.thumbnailUrl,
    images[0]?.url
  );
  const thumbnailUrl = resolveMediaUrl(
    raw.thumbnailUrl,
    raw.thumbnail_url,
    raw.thumbUrl,
    raw.thumb,
    images[0]?.thumbnailUrl,
    imageUrl
  );
  const mrpRaw = raw.mrp ?? raw.listPrice ?? raw.list_price;
  return {
    id: Number(raw.id ?? raw.productId ?? 0),
    sku: String(raw.sku ?? raw.productSku ?? ""),
    name: String(raw.name ?? raw.productName ?? ""),
    category: (raw.category as string) ?? null,
    brand: (raw.brand as string) ?? null,
    unit: (raw.unit as string) ?? "Unit",
    costPrice: Number(raw.costPrice ?? raw.cost_price ?? 0),
    sellingPrice: Number(raw.sellingPrice ?? raw.selling_price ?? 0),
    mrp: mrpRaw != null && mrpRaw !== "" ? Number(mrpRaw) : null,
    taxPercent: Number(raw.taxPercent ?? raw.tax_rate ?? 0),
    description: (raw.description as string) ?? null,
    imageUrl,
    thumbnailUrl: thumbnailUrl ?? imageUrl,
    images,
    status: String(raw.status ?? "Active"),
    alertQty: Number(raw.alertQty ?? raw.alert_qty ?? 0),
    availableQty:
      raw.availableQty != null || raw.available_qty != null
        ? Number(raw.availableQty ?? raw.available_qty)
        : undefined,
    physicalQty:
      raw.physicalQty != null || raw.physical_qty != null
        ? Number(raw.physicalQty ?? raw.physical_qty)
        : undefined,
    allocatedQty:
      raw.allocatedQty != null || raw.allocated_qty != null
        ? Number(raw.allocatedQty ?? raw.allocated_qty)
        : undefined,
    incomingSupplierQty:
      raw.incomingSupplierQty != null ? Number(raw.incomingSupplierQty) : undefined,
    totalStock: raw.totalStock != null ? Number(raw.totalStock) : undefined,
  };
}

export function productCardImage(p: Pick<Product, "thumbnailUrl" | "imageUrl" | "images">) {
  return (
    p.thumbnailUrl ||
    p.imageUrl ||
    p.images[0]?.thumbnailUrl ||
    p.images[0]?.url ||
    null
  );
}

export function productGallery(p: Product): ProductImage[] {
  if (p.images.length) return p.images;
  if (p.imageUrl) {
    return [
      {
        url: p.imageUrl,
        thumbnailUrl: p.thumbnailUrl ?? p.imageUrl,
        alt: p.name,
        sortOrder: 0,
      },
    ];
  }
  return [];
}

function toQuery(params: ProductQuery) {
  const limit = params.limit ?? 24;
  const page = params.page ?? 1;
  return {
    page: params.all ? 1 : page,
    limit,
    search: params.search,
    category: params.category,
    brand: params.brand,
    status: params.status,
    sort: params.sort,
    inStock: params.inStock,
  };
}

async function fetchProductList(
  path: "/products" | "/products/search",
  params: ProductQuery
): Promise<ProductPage> {
  const query = toQuery(params);
  const first = unwrapProductList(await apiFetch<unknown>(`${path}${buildQuery(query)}`));
  const items = [...first.items];
  const pages = first.pages || 1;
  if (params.all && pages > 1) {
    const rest = await Promise.all(
      Array.from({ length: Math.min(pages - 1, 49) }, (_, i) =>
        apiFetch<unknown>(`${path}${buildQuery({ ...query, page: i + 2 })}`)
      )
    );
    for (const extra of rest) items.push(...unwrapProductList(extra).items);
  }
  return {
    products: items.map(mapProduct).filter((p) => p.sku || p.name),
    total: params.all ? items.length : first.total,
    page: params.all ? 1 : first.page,
    pages: params.all ? 1 : pages,
    limit: first.limit || (params.limit ?? 24),
  };
}

const productByIdCache = new Map<number, Product | null>();
let maxExistingId = 0;

async function getProductById(id: number): Promise<Product | null> {
  if (productByIdCache.has(id)) return productByIdCache.get(id) ?? null;
  try {
    const product = mapProduct(await apiFetch<Record<string, unknown>>(`/products/${id}`));
    productByIdCache.set(id, product);
    if (product.id > 0) maxExistingId = Math.max(maxExistingId, product.id);
    return product;
  } catch {
    productByIdCache.set(id, null);
    return null;
  }
}

function matchesQuery(product: Product, params: ProductQuery): boolean {
  if (params.status && product.status.toLowerCase() !== params.status.toLowerCase()) return false;
  if (params.category && (product.category ?? "").toLowerCase() !== params.category.toLowerCase()) {
    return false;
  }
  if (params.brand && (product.brand ?? "").toLowerCase() !== params.brand.toLowerCase()) return false;
  if (params.inStock && (product.availableQty ?? 0) <= 0) return false;
  if (params.search) {
    const q = params.search.toLowerCase();
    const hay = `${product.name} ${product.sku} ${product.brand ?? ""} ${product.category ?? ""}`.toLowerCase();
    if (!hay.includes(q)) return false;
  }
  return true;
}

function sortProducts(list: Product[], sort?: string): Product[] {
  if (sort === "price_asc") return [...list].sort((a, b) => a.sellingPrice - b.sellingPrice);
  if (sort === "price_desc") return [...list].sort((a, b) => b.sellingPrice - a.sellingPrice);
  if (sort === "newest") return [...list].sort((a, b) => b.id - a.id);
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

/** One round-trip: current page of GET /products/{id} plus a few probes for page count. */
async function fetchProductsByIdPage(params: ProductQuery): Promise<ProductPage> {
  const limit = params.limit ?? 12;
  const page = params.page ?? 1;
  const start = (page - 1) * limit + 1;
  const pageIds = Array.from({ length: limit }, (_, i) => start + i);
  const probes = [start + limit, start + limit * 4, start + limit * 8].filter((id) => id > 0);
  const ids = [...new Set([...pageIds, ...probes])];

  await Promise.all(ids.map(getProductById));

  const pageRows = pageIds
    .map((id) => productByIdCache.get(id) ?? null)
    .filter((p): p is Product => p != null && p.id > 0);
  const products = sortProducts(pageRows.filter((p) => matchesQuery(p, params)), params.sort);
  const hasMore = (productByIdCache.get(start + limit) ?? null) != null;
  const estimatedTotal = Math.max(maxExistingId, (page - 1) * limit + pageRows.length);
  const pages = Math.max(1, hasMore ? Math.max(page + 1, Math.ceil(estimatedTotal / limit)) : page);

  return {
    products,
    total: hasMore ? Math.max(estimatedTotal, page * limit + 1) : estimatedTotal,
    page,
    pages,
    limit,
  };
}

/**
 * Live catalog: prefer paginated GET /products and GET /products/search.
 * Store users often get an empty list — fall back to one page of GET /products/{id}.
 */
export async function fetchProducts(params: ProductQuery = {}): Promise<ProductPage> {
  const [listed, searched, byId] = await Promise.all([
    fetchProductList("/products", { ...params, all: false }).catch(() => null),
    fetchProductList("/products/search", { ...params, all: false }).catch(() => null),
    fetchProductsByIdPage(params),
  ]);
  if (listed && listed.products.length > 0) return listed;
  if (searched && searched.products.length > 0) return searched;
  return byId;
}

export async function fetchProduct(id: number): Promise<Product> {
  const raw = await apiFetch<Record<string, unknown>>(`/products/${id}`);
  return mapProduct(raw);
}

export async function fetchProductBySku(sku: string): Promise<Product> {
  const encoded = encodeURIComponent(sku);
  try {
    const raw = await apiFetch<Record<string, unknown>>(`/products/by-sku/${encoded}`);
    return mapProduct(raw);
  } catch (err) {
    const msg = err instanceof Error ? err.message : "";
    if (!/not found|404/i.test(msg) && !/403|access required/i.test(msg)) throw err;
    const res = await fetchProducts({ search: sku, limit: 50, page: 1, status: "Active" });
    const found = res.products.find((p) => p.sku.toUpperCase() === sku.toUpperCase());
    if (found) return found;
    throw err instanceof Error ? err : new Error("Product not found");
  }
}

function mapFacet(raw: Record<string, unknown>, index: number): CatalogFacet {
  return {
    id: Number(raw.id ?? index + 1),
    name: String(raw.name ?? raw.label ?? ""),
    productCount:
      raw.productCount != null || raw.product_count != null
        ? Number(raw.productCount ?? raw.product_count)
        : undefined,
  };
}

async function fetchFacets(path: string): Promise<CatalogFacet[]> {
  const raw = await apiFetch<{ items?: Record<string, unknown>[] } | Record<string, unknown>[]>(
    path
  );
  const rows = Array.isArray(raw) ? raw : raw.items ?? [];
  return rows.map(mapFacet).filter((f) => f.name);
}

export async function fetchCategories(): Promise<CatalogFacet[]> {
  try {
    return await fetchFacets("/categories");
  } catch {
    return [];
  }
}

export async function fetchBrands(): Promise<CatalogFacet[]> {
  try {
    return await fetchFacets("/brands");
  } catch {
    return [];
  }
}

/** Merge HO availability onto catalog rows (qty + missing images). */
export function mergeAvailability(product: Product, line?: StockLine): Product {
  if (!line) return product;
  return {
    ...product,
    availableQty: line.availableQty,
    physicalQty: line.physicalQty,
    allocatedQty: line.allocatedQty,
    incomingSupplierQty: line.incomingSupplierQty,
    alertQty: product.alertQty || line.alertQty,
    sellingPrice: product.sellingPrice || line.sellingPrice,
    imageUrl: product.imageUrl || line.imageUrl,
    thumbnailUrl: product.thumbnailUrl || line.thumbnailUrl || line.imageUrl,
  };
}
