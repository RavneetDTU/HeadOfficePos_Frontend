import { apiFetch, buildQuery } from "@/app/lib/api";
import { resolveMediaUrl } from "@/app/store-portal/lib/media";
import type { StockLine } from "@/app/store-portal/types";

function num(...vals: unknown[]) {
  for (const v of vals) {
    if (v != null && v !== "") return Number(v);
  }
  return 0;
}

function unwrapRows(raw: unknown): {
  items: Record<string, unknown>[];
  total: number;
  page: number;
  pages: number;
  limit: number;
} {
  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length, page: 1, pages: 1, limit: raw.length };
  }
  const o = (raw ?? {}) as Record<string, unknown>;
  const items = (o.items ?? o.lines ?? o.data ?? []) as Record<string, unknown>[];
  return {
    items,
    total: Number(o.total ?? items.length),
    page: Number(o.page ?? 1),
    pages: Number(o.pages ?? 1),
    limit: Number(o.limit ?? items.length),
  };
}

/**
 * Normalize stock rows.
 * Prefer physical / allocated / available when present.
 * Interim: map inStock→physical, reserved→allocated, available→available.
 */
export function mapStockRow(raw: Record<string, unknown>): StockLine {
  const physical = num(
    raw.physicalQty,
    raw.physical_qty,
    raw.inStock,
    raw.in_stock,
    raw.quantity
  );
  const allocated = num(
    raw.allocatedQty,
    raw.allocated_qty,
    raw.reservedQty,
    raw.reserved_qty,
    raw.reserved
  );
  const availableExplicit = raw.availableQty ?? raw.available_qty ?? raw.available;
  const available =
    availableExplicit != null && availableExplicit !== ""
      ? Number(availableExplicit)
      : Math.max(0, physical - allocated);

  return {
    sku: String(raw.sku ?? raw.productSku ?? raw.product_sku ?? "").trim(),
    name: String(raw.name ?? raw.productName ?? raw.product_name ?? "").trim(),
    category: (raw.category as string) ?? undefined,
    brand: (raw.brand as string) ?? undefined,
    warehouse: (raw.warehouse ?? raw.warehouseName ?? raw.storeName) as string | undefined,
    storeId: raw.storeId != null ? Number(raw.storeId) : undefined,
    productId:
      raw.productId != null
        ? Number(raw.productId)
        : raw.product_id != null
          ? Number(raw.product_id)
          : undefined,
    physicalQty: physical,
    allocatedQty: allocated,
    availableQty: Math.max(0, available),
    incomingSupplierQty: num(
      raw.incomingSupplierQty,
      raw.incoming_supplier_qty,
      raw.incomingQty,
      raw.incoming_qty
    ),
    alertQty: num(raw.alertQty, raw.alert_qty),
    unitCost: num(raw.unitCost, raw.costPrice, raw.purchasePrice, raw.purchase_price),
    sellingPrice: num(raw.sellingPrice, raw.selling_price),
    imageUrl: resolveMediaUrl(raw.imageUrl, raw.image_url, raw.image, raw.thumbnailUrl),
    thumbnailUrl: resolveMediaUrl(raw.thumbnailUrl, raw.thumbnail_url, raw.imageUrl, raw.image_url),
    reservedQty: allocated,
  };
}

export async function fetchSalesStock(params: {
  storeId?: number;
  warehouseId?: number;
  search?: string;
  category?: string;
} = {}): Promise<StockLine[]> {
  const raw = await apiFetch<unknown>(`/sales/stock${buildQuery(params)}`);
  return unwrapRows(raw).items.map(mapStockRow);
}

export async function fetchWarehouseInventory(warehouseId: number): Promise<StockLine[]> {
  const raw = await apiFetch<unknown>(`/warehouse/${warehouseId}/inventory`);
  return unwrapRows(raw).items.map(mapStockRow);
}

/** GET /store/inventory — current user's shelf (not HO available-to-order). */
export async function fetchMyStoreInventory(): Promise<StockLine[]> {
  const raw = await apiFetch<unknown>("/store/inventory");
  return unwrapRows(raw).items.map(mapStockRow);
}

export async function fetchStoreInventory(storeId: number): Promise<StockLine[]> {
  const raw = await apiFetch<unknown>(`/store/${storeId}/inventory`);
  return unwrapRows(raw).items.map(mapStockRow);
}

export async function fetchStoreInventoryHistory(params: {
  productId?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<
  Array<{
    id: number;
    movementType?: string;
    locationName?: string;
    productSku?: string;
    productName?: string;
    quantityChange?: number;
    balanceAfter?: number;
    createdAt?: string;
  }>
> {
  const raw = await apiFetch<unknown>(`/store/inventory/history${buildQuery(params)}`);
  return unwrapRows(raw).items.map((r) => ({
    id: Number(r.id ?? 0),
    movementType: (r.movementType ?? r.movement_type) as string | undefined,
    locationName: (r.locationName ?? r.location_name) as string | undefined,
    productSku: (r.productSku ?? r.product_sku) as string | undefined,
    productName: (r.productName ?? r.product_name) as string | undefined,
    quantityChange: num(r.quantityChange, r.quantity_change),
    balanceAfter: num(r.balanceAfter, r.balance_after),
    createdAt: (r.createdAt ?? r.created_at) as string | undefined,
  }));
}

/**
 * GET /products/availability — preferred HO available-to-order list (with images).
 * Falls back to GET /sales/stock.
 */
export async function fetchProductAvailability(params: {
  search?: string;
  sku?: string;
  page?: number;
  limit?: number;
  all?: boolean;
} = {}): Promise<{
  lines: StockLine[];
  source: "availability" | "sales_stock";
  allocationLive: boolean;
  total: number;
  page: number;
  pages: number;
}> {
  const limit = params.limit ?? 100;
  const page = params.page ?? 1;
  const fetchAll = params.all === true || (params.page == null && !params.sku);

  const loadAvailability = async () => {
    const query = {
      search: params.search,
      sku: params.sku,
      page: fetchAll ? 1 : page,
      limit,
    };
    const first = unwrapRows(
      await apiFetch<unknown>(`/products/availability${buildQuery(query)}`)
    );
    const items = [...first.items];
    const pages = first.pages || 1;
    if (fetchAll && pages > 1) {
      const rest = await Promise.all(
        Array.from({ length: Math.min(pages - 1, 49) }, (_, i) =>
          apiFetch<unknown>(`/products/availability${buildQuery({ ...query, page: i + 2 })}`)
        )
      );
      for (const extra of rest) items.push(...unwrapRows(extra).items);
    }
    return {
      lines: items.map(mapStockRow).filter((l) => l.sku || l.name),
      source: "availability" as const,
      allocationLive: true,
      total: fetchAll ? items.length : first.total,
      page: fetchAll ? 1 : first.page,
      pages: fetchAll ? 1 : pages,
    };
  };

  try {
    return await loadAvailability();
  } catch {
    const lines = await fetchSalesStock({ search: params.search }).catch(() => []);
    return {
      lines,
      source: "sales_stock",
      allocationLive: false,
      total: lines.length,
      page: 1,
      pages: 1,
    };
  }
}

export async function fetchInventoryLedger(params: {
  page?: number;
  limit?: number;
  productId?: number;
  locationType?: string;
  movementType?: string;
} = {}): Promise<
  Array<{
    id: number;
    movementType?: string;
    locationName?: string;
    productSku?: string;
    productName?: string;
    quantityChange?: number;
    balanceAfter?: number;
    createdAt?: string;
  }>
> {
  const raw = await apiFetch<unknown>(
    `/inventory/ledger${buildQuery({
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      productId: params.productId,
      locationType: params.locationType,
      movementType: params.movementType,
    })}`
  );
  return unwrapRows(raw).items.map((r) => ({
    id: Number(r.id ?? 0),
    movementType: (r.movementType ?? r.movement_type) as string | undefined,
    locationName: (r.locationName ?? r.location_name) as string | undefined,
    productSku: (r.productSku ?? r.product_sku) as string | undefined,
    productName: (r.productName ?? r.product_name) as string | undefined,
    quantityChange: num(r.quantityChange, r.quantity_change),
    balanceAfter: num(r.balanceAfter, r.balance_after),
    createdAt: (r.createdAt ?? r.created_at) as string | undefined,
  }));
}
