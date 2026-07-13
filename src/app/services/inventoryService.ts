// ─────────────────────────────────────────────────────────────────────────────
// HAL POS — Inventory / Data API Service Layer
// All endpoints aligned with the live backend at http://103.55.104.142:5022
// ─────────────────────────────────────────────────────────────────────────────

import { apiFetch } from "../lib/api";
import type {
  AddStockPayload,
  AdminDashboardSummary,
  CashupOut,
  CreateStockRequestPayload,
  CreateTransferPayload,
  DeliveryOut,
  ExpenseCreate,
  ExpenseOut,
  GiftCardOut,
  InventoryAdjustmentCreate,
  InventoryAdjustmentOut,
  InventoryLedgerOut,
  MasterDataResponse,
  Product,
  ProductListParams,
  ProductsResponse,
  PurchaseOverview,
  PurchaseReturnOut,
  RefundOut,
  SaleReturnOut,
  StockItemOut,
  StockRequest,
  StockRequestListResponse,
  StoreDashboardSummary,
  StoreInventoryItem,
  StoreInventoryResponse,
  StorePurchaseHistoryResponse,
  Transfer,
  TransferItem,
  TransferListParams,
  TransferListResponse,
  UpdateStockRequestStatusPayload,
  Warehouse,
  WarehouseInventoryItem,
  WarehouseInventoryParams,
  WarehouseInventoryResponse,
  WarehouseOut,
  WarehouseTransferCreate,
  WarehouseTransferDetailOut,
  WarehouseTransferListItemOut,
  WarehouseTransferListResponse,
  WarehouseTransferResponse,
} from "../types/inventory";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function buildQuery(
  params: Record<string, string | number | boolean | undefined | null>
): string {
  const parts = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== "" && v !== null)
    .map(
      ([k, v]) =>
        `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`
    );
  return parts.length ? `?${parts.join("&")}` : "";
}

/**
 * Map a WarehouseInventoryOut (camelCase from backend) to the legacy
 * WarehouseInventoryItem (snake_case) shape used by existing UI pages.
 */
function mapWarehouseInvItem(raw: Record<string, unknown>): WarehouseInventoryItem {
  return {
    id: (raw.id as number) ?? 0,
    product_id: (raw.productId as number) ?? (raw.product_id as number) ?? (raw.id as number) ?? 0,
    sku: (raw.productSku as string) ?? (raw.sku as string) ?? "",
    name: (raw.productName as string) ?? (raw.name as string) ?? "",
    category: (raw.category as string) ?? undefined,
    brand: undefined,
    unit: undefined,
    warehouse_id: (raw.warehouseId as number) ?? (raw.warehouse_id as number) ?? 0,
    warehouse_name: (raw.warehouseName as string) ?? (raw.warehouse_name as string) ?? (raw.warehouse as string) ?? "",
    quantity: (raw.quantity as number) ?? (raw.inStock as number) ?? 0,
    reserved_qty: (raw.reservedQty as number) ?? (raw.reserved as number) ?? 0,
    available_qty: (raw.availableQty as number) ?? (raw.available as number) ?? (raw.quantity as number) ?? (raw.inStock as number) ?? 0,
    purchase_price: (raw.purchasePrice as number) ?? (raw.costPrice as number) ?? (raw.purchase_price as number) ?? (raw.unitCost as number) ?? 0,
    selling_price: (raw.sellingPrice as number) ?? (raw.selling_price as number) ?? 0,
    alert_qty: (raw.alertQty as number) ?? (raw.alert_qty as number) ?? 0,
    is_low_stock: (raw.isLowStock as boolean) ?? false,
    last_updated: (raw.lastUpdated as string) ?? (raw.updatedAt as string) ?? new Date().toISOString(),
  };
}
/**
 * Map a StoreInventoryOut (camelCase from backend) to the legacy
 * StoreInventoryItem (snake_case) shape used by existing UI pages.
 */
function mapStoreInvItem(raw: Record<string, unknown>): StoreInventoryItem {
  return {
    id: (raw.id as number) ?? 0,
    product_id: (raw.productId as number) ?? (raw.product_id as number) ?? 0,
    sku: (raw.productSku as string) ?? (raw.sku as string) ?? "",
    product_name: (raw.productName as string) ?? (raw.product_name as string) ?? "",
    category: (raw.category as string) ?? undefined,
    brand: undefined,
    quantity: (raw.quantity as number) ?? 0,
    purchase_price: (raw.purchasePrice as number) ?? (raw.costPrice as number) ?? 0,
    selling_price: (raw.sellingPrice as number) ?? 0,
    alert_qty: (raw.alertQty as number) ?? 0,
    is_low_stock: (raw.isLowStock as boolean) ?? false,
    last_received_date: (raw.lastReceivedDate as string) ?? undefined,
    last_sale_date: (raw.lastSaleDate as string) ?? undefined,
  };
}

/**
 * Map a raw API warehouse transfer list item to the legacy Transfer shape
 * so existing UI pages (ListTransfers) continue to work.
 */
function mapTransferItem(raw: Record<string, unknown>): Transfer {
  // Map items array if present (detail endpoint returns items)
  const rawItems = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
  const mappedItems: TransferItem[] = rawItems.map((item) => ({
    id: (item.id as number) ?? undefined,
    product_id: (item.productId as number) ?? (item.product_id as number) ?? 0,
    sku: (item.productSku as string) ?? (item.sku as string) ?? "",
    product_name: (item.productName as string) ?? (item.product_name as string) ?? "",
    category: (item.category as string) ?? undefined,
    quantity: (item.quantity as number) ?? 0,
    purchase_price: (item.purchasePrice as number) ?? (item.purchase_price as number) ?? 0,
    subtotal: ((item.quantity as number) ?? 0) * ((item.purchasePrice as number) ?? (item.purchase_price as number) ?? 0),
  }));

  // Compute total_items and total_value from items when backend doesn't provide them directly
  const computedTotalItems = mappedItems.reduce((acc, i) => acc + i.quantity, 0);
  const computedTotalValue = mappedItems.reduce((acc, i) => acc + (i.subtotal ?? 0), 0);

  return {
    id: (raw.id as number) ?? 0,
    transfer_reference:
      (raw.transferNumber as string) ??
      (raw.reference as string) ??
      (raw.transfer_reference as string) ??
      `TRF-${raw.id}`,
    transfer_date:
      (raw.transferredAt as string) ??
      (raw.createdAt as string) ??
      (raw.transfer_date as string) ??
      new Date().toISOString(),
    from_warehouse_id:
      (raw.warehouseId as number) ?? (raw.from_warehouse_id as number) ?? 0,
    from_warehouse_name:
      (raw.warehouseName as string) ?? (raw.from_warehouse_name as string) ?? "",
    to_store_id:
      (raw.storeId as number) ?? (raw.to_store_id as number) ?? 0,
    to_store_name:
      (raw.storeName as string) ?? (raw.to_store_name as string) ?? "",
    notes: (raw.remarks as string) ?? (raw.notes as string) ?? undefined,
    status: (() => {
      const dbStatus = ((raw.status as string) ?? "Completed") as Transfer["status"];
      try {
        const overrides = localStorage.getItem("hal_pos_transfer_statuses");
        if (overrides) {
          const map = JSON.parse(overrides);
          const tId = (raw.id as number) ?? 0;
          if (map[tId]) {
            return map[tId] as Transfer["status"];
          }
        }
      } catch {}
      return dbStatus;
    })(),
    created_by: (raw.createdBy as string) ?? (raw.created_by as string) ?? "",
    created_at:
      (raw.createdAt as string) ??
      (raw.created_at as string) ??
      new Date().toISOString(),
    items: mappedItems.length > 0 ? mappedItems : undefined,
    total_items:
      (raw.itemCount as number) ?? (raw.total_items as number) ?? computedTotalItems,
    total_value:
      (raw.totalValue as number) ?? (raw.total_value as number) ?? computedTotalValue,
  };
}

// ─── Master Data ──────────────────────────────────────────────────────────────

/** GET /master-data — products, customers, suppliers, billers (auto-paginated) */
export async function getMasterData(): Promise<MasterDataResponse> {
  // Fetch page 1 with 100 limit (backend maximum allowed limit is 100)
  const firstPage = await apiFetch<MasterDataResponse>("/master-data?productLimit=100&productPage=1");
  const totalProducts = firstPage.totalProducts ?? 0;
  
  if (totalProducts <= 100) {
    return firstPage;
  }

  // Fetch subsequent pages in parallel
  const totalPages = Math.ceil(totalProducts / 100);
  const promises: Promise<MasterDataResponse>[] = [];
  for (let page = 2; page <= totalPages; page++) {
    promises.push(
      apiFetch<MasterDataResponse>(`/master-data?productLimit=100&productPage=${page}`)
    );
  }

  const pagesResp = await Promise.all(promises);
  
  // Merge products
  const allProducts = [...firstPage.products];
  for (const resp of pagesResp) {
    if (resp && Array.isArray(resp.products)) {
      allProducts.push(...resp.products);
    }
  }

  return {
    ...firstPage,
    products: allProducts
  };
}

// ─── Warehouses ───────────────────────────────────────────────────────────────

/** GET /warehouses — list all warehouses */
export async function getWarehouses(): Promise<Warehouse[]> {
  const raw = await apiFetch<WarehouseOut[]>("/warehouses");
  // Normalise to Warehouse shape and filter out excluded
  return raw
    .map((w) => ({
      id: w.id,
      name: w.name,
      code: w.code ?? `WH-${w.id}`,
      address: w.address,
      city: w.city,
      phone: w.phone,
      email: w.email,
      manager: w.manager,
      type: (w.type ?? "warehouse") as "warehouse" | "store",
      status: (w.status ?? "Active") as "Active" | "Inactive",
      created_at: w.created_at ?? new Date().toISOString(),
    }))
    .filter((w) => {
      const name = w.name.toLowerCase().trim();
      return !name.includes("smoke");
    });
}

/** POST /warehouses — create a warehouse */
export async function createWarehouse(
  data: Partial<Warehouse>
): Promise<Warehouse> {
  return apiFetch<Warehouse>("/warehouses", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Stores ───────────────────────────────────────────────────────────────────

/** GET /stores — list all stores */
export async function getStores(): Promise<Warehouse[]> {
  const raw = await apiFetch<WarehouseOut[]>("/stores");
  return raw
    .map((s) => ({
      id: s.id,
      name: s.name,
      code: s.code ?? `ST-${s.id}`,
      address: s.address,
      city: s.city,
      phone: s.phone,
      email: s.email,
      manager: s.manager,
      type: "store" as const,
      status: (s.status ?? "Active") as "Active" | "Inactive",
      created_at: s.created_at ?? new Date().toISOString(),
    }))
    .filter((s) => {
      const name = s.name.toLowerCase().trim();
      return !name.includes("smoke") && name !== "head office";
    });
}

/** POST /stores — create a store */
export async function createStore(
  data: Record<string, unknown>
): Promise<Warehouse> {
  return apiFetch<Warehouse>("/stores", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

// ─── Products ─────────────────────────────────────────────────────────────────

/** GET /master-data — retrieve products list (from master data) */
export async function getProducts(
  _params: Record<string, string | number | undefined> = {}
): Promise<{ products: Product[]; total: number; total_pages: number; current_page: number }> {
  const data = await getMasterData();
  const products: Product[] = data.products.map((p) => ({
    id: p.id,
    name: p.name,
    sku: p.sku,
    cost_price: p.costPrice,
    selling_price: p.sellingPrice,
    tax_rate: p.taxPercent,
    status: "Active" as const,
    created_at: new Date().toISOString(),
  }));
  return {
    products,
    total: products.length,
    total_pages: 1,
    current_page: 1,
  };
}

/** POST /products — Create a product (if endpoint exists) */
export async function createProduct(
  data: Partial<Product> & { opening_stock?: Array<{ warehouse_id: number; quantity: number }> }
): Promise<{ id: number; sku: string; name: string; message: string }> {
  return apiFetch("/products", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/** GET /products/{id} — Get product by id */
export async function getProduct(id: number): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`);
}

/** PATCH /products/{id} — Update product */
export async function updateProduct(
  id: number,
  data: Partial<Product>
): Promise<Product> {
  return apiFetch<Product>(`/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** DELETE /products/{id} — Soft delete product */
export async function deleteProduct(id: number): Promise<void> {
  return apiFetch<void>(`/products/${id}`, { method: "DELETE" });
}

// ─── Warehouse Inventory ───────────────────────────────────────────────────────

/**
 * GET /warehouse/{warehouseId}/inventory — Admin: get inventory of a specific warehouse.
 * Falls back to GET /sales/stock when warehouseId is unknown.
 */
export async function getWarehouseInventory(
  params: WarehouseInventoryParams = {}
): Promise<WarehouseInventoryResponse> {
  const { warehouse_id, search, category } = params;

  if (warehouse_id) {
    const raw = await apiFetch<Record<string, unknown>[]>(
      `/warehouse/${warehouse_id}/inventory`
    );
    let items = raw.map(mapWarehouseInvItem);
    if (search) {
      const s = search.toLowerCase();
      items = items.filter(
        (i) =>
          i.name.toLowerCase().includes(s) ||
          i.sku.toLowerCase().includes(s)
      );
    }
    if (category && category !== "") {
      items = items.filter((i) => i.category === category);
    }
    return {
      items,
      total: items.length,
      total_pages: 1,
      current_page: 1,
    };
  }

  // Fallback: use sales/stock which returns inventory across locations
  const query = buildQuery({
    search: search || undefined,
    category: category || undefined,
  });
  const raw = await apiFetch<Record<string, unknown>[]>(`/sales/stock${query}`);
  const items = raw.map(mapWarehouseInvItem);
  return {
    items,
    total: items.length,
    total_pages: 1,
    current_page: 1,
  };
}

/**
 * GET /warehouse/inventory/history — Warehouse inventory movement history.
 */
export async function getWarehouseInventoryHistory(params: {
  productId?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<InventoryLedgerOut[]> {
  return apiFetch<InventoryLedgerOut[]>(
    `/warehouse/inventory/history${buildQuery(params as Record<string, string | number | undefined>)}`
  );
}

/** POST /warehouse/inventory — Add stock to warehouse (legacy; use createPurchase for real flow) */
export async function addWarehouseStock(
  payload: AddStockPayload
): Promise<{ id: number; message: string; ledger_entry_id: number }> {
  return apiFetch("/warehouse/inventory", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Warehouse Transfers ───────────────────────────────────────────────────────

/**
 * GET /warehouse/transfers — List all warehouse-to-store transfers.
 * Returns data in legacy TransferListResponse shape for existing UI pages.
 */
export async function getTransfers(
  params: TransferListParams = {}
): Promise<TransferListResponse> {
  const query = buildQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    warehouseId: params.warehouseId ?? params.from_warehouse_id,
    storeId: params.storeId ?? params.to_store_id,
    status: params.status,
    startDate: params.start_date,
    endDate: params.end_date,
  });

  const raw = await apiFetch<Record<string, unknown>>(`/warehouse/transfers${query}`);

  const rawTransfers = (raw.transfers as Record<string, unknown>[]) ?? [];

  return {
    transfers: rawTransfers.map(mapTransferItem),
    total: (raw.total as number) ?? 0,
    total_pages: (raw.totalPages as number) ?? (raw.total_pages as number) ?? 1,
    current_page: (raw.currentPage as number) ?? (raw.current_page as number) ?? 1,
  };
}

/**
 * GET /warehouse/transfers/{transferId} — Get transfer details.
 */
export async function getTransfer(id: number): Promise<Transfer> {
  const raw = await apiFetch<Record<string, unknown>>(
    `/warehouse/transfers/${id}`
  );
  return mapTransferItem(raw);
}

/**
 * PATCH /warehouse/transfers/{transferId} — Update transfer status in the backend.
 */
export async function updateTransferStatus(
  id: number,
  status: string
): Promise<Transfer> {
  const raw = await apiFetch<Record<string, unknown>>(`/warehouse/transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
  return mapTransferItem(raw);
}

/**
 * POST /warehouse/transfers — Create a warehouse→store transfer.
 * Accepts the legacy CreateTransferPayload shape and maps to the real API body.
 */
export async function createTransfer(
  payload: CreateTransferPayload
): Promise<Transfer> {
  const body = {
    warehouseId: payload.from_warehouse_id,
    storeId: payload.to_store_id,
    remarks: payload.notes,
    items: payload.items.map((i) => ({
      productId: i.product_id,
      quantity: i.quantity,
      purchasePrice: i.purchase_price,
    })),
  };

  const raw = await apiFetch<Record<string, unknown>>("/warehouse/transfers", {
    method: "POST",
    body: JSON.stringify(body),
  });

  // Save transfer items in localStorage for high-performance stock adjustments
  try {
    const saved = localStorage.getItem("hal_pos_transfer_items_cache");
    const cache = saved ? JSON.parse(saved) : {};
    // Use items from API response if available, otherwise fall back to payload items
    const rawItems = Array.isArray(raw.items) ? (raw.items as any[]) : [];
    const items = rawItems.length > 0
      ? rawItems.map(item => ({
          productSku: item.productSku || item.sku || "",
          quantity: item.quantity ?? 0,
          purchasePrice: item.purchasePrice ?? item.purchase_price ?? 0,
        }))
      : payload.items.map(item => ({
          productSku: "",
          quantity: item.quantity,
          purchasePrice: item.purchase_price ?? 0,
        }));
    cache[raw.id as number] = items;
    localStorage.setItem("hal_pos_transfer_items_cache", JSON.stringify(cache));
  } catch {}

  return mapTransferItem(raw);
}

// ─── Store Inventory ───────────────────────────────────────────────────────────

/**
 * GET /store/inventory — Inventory of the currently logged-in store user.
 */
export async function getMyStoreInventory(
  _params: Record<string, string | number | boolean | undefined> = {}
): Promise<StoreInventoryResponse> {
  const raw = await apiFetch<Record<string, unknown>[]>("/store/inventory");
  const items = raw.map(mapStoreInvItem);
  const storeName = items[0]
    ? ((raw[0] as Record<string, unknown>).storeName as string) ?? ""
    : "";
  const storeId = items[0]
    ? ((raw[0] as Record<string, unknown>).storeId as number) ?? 0
    : 0;
  return {
    store_id: storeId,
    store_name: storeName,
    items,
    total: items.length,
    total_pages: 1,
    current_page: 1,
  };
}

/**
 * GET /store/{storeId}/inventory — Admin: view inventory of any store.
 */
export async function getStoreInventory(
  storeId: number,
  _params: Record<string, string | number | boolean | undefined> = {}
): Promise<StoreInventoryResponse> {
  const raw = await apiFetch<Record<string, unknown>[]>(
    `/store/${storeId}/inventory`
  );
  const items = raw.map(mapStoreInvItem);
  return {
    store_id: storeId,
    store_name:
      items[0]
        ? ((raw[0] as Record<string, unknown>).storeName as string) ?? ""
        : "",
    items,
    total: items.length,
    total_pages: 1,
    current_page: 1,
  };
}

/**
 * GET /store/inventory/history — Full inventory movement history of the logged-in store.
 */
export async function getStoreInventoryHistory(params: {
  productId?: number;
  startDate?: string;
  endDate?: string;
} = {}): Promise<InventoryLedgerOut[]> {
  return apiFetch<InventoryLedgerOut[]>(
    `/store/inventory/history${buildQuery(params as Record<string, string | number | undefined>)}`
  );
}

/**
 * GET /store/purchases — All transfers received by the logged-in store.
 * Mapped to legacy StorePurchaseHistoryResponse shape.
 */
export async function getMyStorePurchaseHistory(
  _params: Record<string, string | number | undefined> = {}
): Promise<StorePurchaseHistoryResponse> {
  const raw = await apiFetch<Record<string, unknown>[]>("/store/purchases");
  const transfers = (raw ?? []).map((r) => ({
    transfer_reference:
      (r.reference as string) ?? (r.transfer_reference as string) ?? "",
    transfer_date:
      (r.transferredAt as string) ??
      (r.createdAt as string) ??
      new Date().toISOString(),
    product_name:
      (r.productName as string) ?? (r.product_name as string) ?? "",
    sku: (r.productSku as string) ?? (r.sku as string) ?? "",
    quantity_received:
      (r.quantity as number) ?? (r.quantity_received as number) ?? 0,
    purchase_price: (r.unitCost as number) ?? (r.purchase_price as number) ?? 0,
    total_cost: (r.totalCost as number) ?? (r.total_cost as number) ?? 0,
    from_warehouse:
      (r.warehouseName as string) ?? (r.from_warehouse as string) ?? "",
    status: (r.status as string) ?? "Completed",
  }));
  return {
    transfers,
    total: transfers.length,
    total_pages: 1,
    current_page: 1,
  };
}

// ─── Inventory Ledger ─────────────────────────────────────────────────────────

/** GET /inventory/ledger — Full admin audit trail */
export async function getInventoryLedger(params: {
  page?: number;
  limit?: number;
  productId?: number;
  locationType?: string;
  movementType?: string;
  startDate?: string;
  endDate?: string;
} = {}): Promise<InventoryLedgerOut[]> {
  return apiFetch<InventoryLedgerOut[]>(
    `/inventory/ledger${buildQuery(params as Record<string, string | number | undefined>)}`
  );
}

/** POST /inventory/adjustments — Create inventory adjustment */
export async function createInventoryAdjustment(
  payload: InventoryAdjustmentCreate
): Promise<InventoryAdjustmentOut> {
  return apiFetch<InventoryAdjustmentOut>("/inventory/adjustments", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

/**
 * GET /dashboard/warehouse — Warehouse/Admin dashboard summary.
 * Maps the real response to the legacy AdminDashboardSummary shape so
 * existing Dashboard.tsx AdminDashboard component continues to work.
 */
export async function getAdminDashboard(): Promise<AdminDashboardSummary> {
  const raw = await apiFetch<Record<string, unknown>>("/dashboard/warehouse");

  // The real API shape is flexible; we map defensively
  const ws = (raw.warehouseSummary ?? raw.warehouse_summary ?? {}) as Record<string, unknown>;
  const ss = (raw.storeSummary ?? raw.store_summary ?? {}) as Record<string, unknown>;
  const salesSum = (raw.salesSummary ?? raw.sales_summary ?? {}) as Record<string, unknown>;
  const recentTransfers = (raw.recentTransfers ?? raw.recent_transfers ?? []) as Record<string, unknown>[];
  const recentSales = (raw.recentSales ?? raw.recent_sales ?? []) as Record<string, unknown>[];

  // Map flat properties from WarehouseDashboardOut directly if present
  const totalWarehouseProducts =
    (raw.totalWarehouseProducts as number) ??
    (ws.totalProducts as number) ??
    (ws.total_warehouse_items as number) ??
    0;

  const totalWarehouseQuantity =
    (raw.totalWarehouseQuantity as number) ??
    (ws.totalQuantity as number) ??
    (ws.total_warehouse_qty as number) ??
    0;

  const totalWarehouseValue =
    (raw.totalWarehouseValue as number) ??
    (ws.totalValue as number) ??
    (ws.total_warehouse_stock_value as number) ??
    0;

  const outOfStockProducts =
    (raw.outOfStockProducts as number) ??
    (ws.lowStockCount as number) ??
    (ws.low_stock_count as number) ??
    0;

  return {
    warehouse_summary: {
      total_warehouse_stock_value: totalWarehouseValue,
      total_warehouse_items: totalWarehouseProducts,
      total_warehouse_qty: totalWarehouseQuantity,
      low_stock_count: outOfStockProducts,
      low_stock_items:
        ((ws.lowStockItems ?? ws.low_stock_items ?? []) as Record<string, unknown>[]).map(
          (i) => ({
            product_id: (i.productId as number) ?? (i.product_id as number) ?? 0,
            sku: (i.productSku as string) ?? (i.sku as string) ?? "",
            name: (i.productName as string) ?? (i.name as string) ?? "",
            warehouse_name:
              (i.warehouseName as string) ?? (i.warehouse_name as string) ?? "",
            quantity: (i.quantity as number) ?? 0,
            alert_qty: (i.alertQty as number) ?? (i.alert_qty as number) ?? 0,
          })
        ),
    },
    store_summary: {
      total_store_stock_value:
        (ss.totalValue as number) ?? (ss.total_store_stock_value as number) ?? 0,
      total_store_items:
        (ss.totalProducts as number) ?? (ss.total_store_items as number) ?? 0,
      low_stock_stores:
        ((ss.lowStockStores ?? ss.low_stock_stores ?? []) as Record<string, unknown>[]).map(
          (s) => ({
            store_id: (s.storeId as number) ?? (s.store_id as number) ?? 0,
            store_name: (s.storeName as string) ?? (s.store_name as string) ?? "",
            low_stock_count:
              (s.lowStockCount as number) ?? (s.low_stock_count as number) ?? 0,
          })
        ),
    },
    sales_summary: {
      total_sales_today:
        (salesSum.todaySalesTotal as number) ??
        (salesSum.total_sales_today as number) ??
        0,
      total_sales_month:
        (salesSum.monthSalesTotal as number) ??
        (salesSum.total_sales_month as number) ??
        0,
      total_sales_count_today:
        (salesSum.todaySalesCount as number) ??
        (salesSum.total_sales_count_today as number) ??
        0,
      total_sales_count_month:
        (salesSum.monthSalesCount as number) ??
        (salesSum.total_sales_count_month as number) ??
        0,
    },
    recent_transfers: recentTransfers.map((t) => ({
      transfer_reference:
        (t.reference as string) ?? (t.transfer_reference as string) ?? "",
      to_store_name:
        (t.storeName as string) ?? (t.to_store_name as string) ?? "",
      total_value: (t.totalValue as number) ?? (t.total_value as number) ?? 0,
      date:
        (t.createdAt as string) ??
        (t.transferredAt as string) ??
        (t.date as string) ??
        new Date().toISOString(),
    })),
    recent_sales: recentSales.map((s) => ({
      reference: (s.reference as string) ?? "",
      customer_name:
        (s.customerName as string) ?? (s.customer_name as string) ?? "",
      warehouse: (s.warehouse as string) ?? "",
      grand_total:
        (s.grandTotal as number) ?? (s.grand_total as number) ?? 0,
      date:
        (s.date as string) ?? (s.createdAt as string) ?? new Date().toISOString(),
    })),
  };
}

/**
 * GET /dashboard/store — Store manager dashboard.
 * Maps the real response to the legacy StoreDashboardSummary shape.
 */
export async function getStoreDashboard(): Promise<StoreDashboardSummary> {
  const raw = await apiFetch<Record<string, unknown>>("/dashboard/store");

  const inv = (raw.inventorySummary ?? raw.inventory_summary ?? {}) as Record<string, unknown>;
  const salesSum = (raw.salesSummary ?? raw.sales_summary ?? {}) as Record<string, unknown>;
  const recentPurchases = (
    raw.recentPurchasesFromWarehouse ??
    raw.recent_purchases_from_warehouse ??
    []
  ) as Record<string, unknown>[];
  const recentSales = (raw.recentSales ?? raw.recent_sales ?? []) as Record<string, unknown>[];

  // Map flat properties from StoreDashboardOut directly if present
  const totalItems =
    (raw.currentInventory as number) ??
    (inv.totalProducts as number) ??
    (inv.total_items as number) ??
    0;

  const totalStockQty =
    (raw.currentInventory as number) ??
    (inv.totalStock as number) ??
    (inv.total_stock_qty as number) ??
    0;

  const totalStockValue =
    (raw.inventoryValue as number) ??
    (inv.totalValue as number) ??
    (inv.total_stock_value as number) ??
    0;

  const todaySalesTotal =
    (raw.todaysSales as number) ??
    (salesSum.todaySalesTotal as number) ??
    (salesSum.today_sales_total as number) ??
    0;

  const monthSalesTotal =
    (raw.monthlySales as number) ??
    (salesSum.monthSalesTotal as number) ??
    (salesSum.month_sales_total as number) ??
    0;

  return {
    store_id: (raw.storeId as number) ?? (raw.store_id as number) ?? 0,
    store_name: (raw.storeName as string) ?? (raw.store_name as string) ?? "",
    inventory_summary: {
      total_items: totalItems,
      total_stock_qty: totalStockQty,
      total_stock_value: totalStockValue,
      low_stock_count:
        (inv.lowStockCount as number) ?? (inv.low_stock_count as number) ?? 0,
      low_stock_items:
        ((inv.lowStockItems ?? inv.low_stock_items ?? []) as Record<string, unknown>[]).map(
          (i) => ({
            sku: (i.productSku as string) ?? (i.sku as string) ?? "",
            name: (i.productName as string) ?? (i.name as string) ?? "",
            quantity: (i.quantity as number) ?? 0,
            alert_qty: (i.alertQty as number) ?? (i.alert_qty as number) ?? 0,
          })
        ),
    },
    sales_summary: {
      today_sales_total: todaySalesTotal,
      today_sales_count:
        (salesSum.todaySalesCount as number) ??
        (salesSum.today_sales_count as number) ??
        0,
      month_sales_total: monthSalesTotal,
      month_sales_count:
        (salesSum.monthSalesCount as number) ??
        (salesSum.month_sales_count as number) ??
        0,
    },
    recent_purchases_from_warehouse: recentPurchases.map((p) => ({
      transfer_reference:
        (p.reference as string) ?? (p.transfer_reference as string) ?? "",
      date:
        (p.createdAt as string) ??
        (p.date as string) ??
        new Date().toISOString(),
      product_name: (p.productName as string) ?? (p.product_name as string) ?? "",
      quantity: (p.quantity as number) ?? 0,
    })),
    recent_sales: recentSales.map((s) => ({
      reference: (s.reference as string) ?? "",
      customer_name:
        (s.customerName as string) ?? (s.customer_name as string) ?? "",
      grand_total:
        (s.grandTotal as number) ?? (s.grand_total as number) ?? 0,
      date:
        (s.date as string) ?? (s.createdAt as string) ?? new Date().toISOString(),
    })),
  };
}

// ─── Sales — Refunds, Returns, Deliveries, Gift Cards, Cashups, Stock ─────────

/** GET /sales/refunds */
export async function getSalesRefunds(): Promise<RefundOut[]> {
  return apiFetch<RefundOut[]>("/sales/refunds");
}

/** GET /sales/returns */
export async function getSalesReturns(): Promise<SaleReturnOut[]> {
  return apiFetch<SaleReturnOut[]>("/sales/returns");
}

/** GET /sales/deliveries */
export async function getSalesDeliveries(): Promise<DeliveryOut[]> {
  return apiFetch<DeliveryOut[]>("/sales/deliveries");
}

/** GET /sales/gift-cards */
export async function getSalesGiftCards(): Promise<GiftCardOut[]> {
  return apiFetch<GiftCardOut[]>("/sales/gift-cards");
}

/** GET /sales/cashups */
export async function getSalesCashups(): Promise<CashupOut[]> {
  return apiFetch<CashupOut[]>("/sales/cashups");
}

/** GET /sales/stock */
export async function getSalesStock(params: {
  search?: string;
  category?: string;
  storeId?: number;
  warehouseId?: number;
  warehouse?: string;
} = {}): Promise<StockItemOut[]> {
  return apiFetch<StockItemOut[]>(
    `/sales/stock${buildQuery(params as Record<string, string | number | undefined>)}`
  );
}

// ─── Purchases — Returns, Expenses, Overview ──────────────────────────────────

/** GET /purchases/returns */
export async function getPurchaseReturns(): Promise<PurchaseReturnOut[]> {
  return apiFetch<PurchaseReturnOut[]>("/purchases/returns");
}

/** GET /purchases/overview */
export async function getPurchasesOverview(): Promise<PurchaseOverview> {
  return apiFetch<PurchaseOverview>("/purchases/overview");
}

/** GET /purchases/expenses */
export async function getExpenses(): Promise<ExpenseOut[]> {
  return apiFetch<ExpenseOut[]>("/purchases/expenses");
}

/** POST /purchases/expenses */
export async function createExpense(
  payload: ExpenseCreate
): Promise<ExpenseOut> {
  return apiFetch<ExpenseOut>("/purchases/expenses", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/** PATCH /purchases/{id}/cancel */
export async function cancelPurchase(id: number): Promise<void> {
  return apiFetch<void>(`/purchases/${id}/cancel`, { method: "PATCH" });
}

// ─── Backward-compat stubs (kept so existing pages don't break) ───────────────

/** @deprecated Use getWarehouseInventory instead */
export async function addWarehouseStockLegacy(
  payload: AddStockPayload
): Promise<{ id: number; message: string; ledger_entry_id: number }> {
  return addWarehouseStock(payload);
}

/** @deprecated Not in real API; use getStoreInventory */
export async function updateWarehouseStock(
  _id: number,
  _data: { quantity?: number; purchase_price?: number; notes?: string }
): Promise<void> {
  // no-op — endpoint does not exist in real backend
}

/** @deprecated Not in real API */
export async function updateWarehouse(
  id: number,
  data: Partial<Warehouse>
): Promise<Warehouse> {
  return apiFetch<Warehouse>(`/warehouses/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

/** @deprecated Not in real API */
export async function deleteWarehouse(id: number): Promise<void> {
  return apiFetch<void>(`/warehouses/${id}`, { method: "DELETE" });
}

/** @deprecated Not in real API; transfer history is from /warehouse/transfers */
export async function getStoreTransferHistory(
  _storeId: number,
  params: Record<string, string | number | undefined> = {}
): Promise<TransferListResponse> {
  return getTransfers(params);
}

/**
 * Retrieve transfer items using localStorage cache to avoid duplicate details API hits.
 * Fallback to fetching the transfer details if the item list is not cached.
 */
export async function getTransferItemsWithCache(
  transferId: number
): Promise<{ productSku: string; quantity: number; purchasePrice: number }[]> {
  try {
    const saved = localStorage.getItem("hal_pos_transfer_items_cache");
    const cache = saved ? JSON.parse(saved) : {};
    const cached = cache[transferId];
    // Only use cache if it's a non-empty array with purchasePrice (new format)
    if (Array.isArray(cached) && cached.length > 0 && cached[0].purchasePrice !== undefined) {
      return cached as { productSku: string; quantity: number; purchasePrice: number }[];
    }
    
    // Fetch raw detail directly to get items (mapTransferItem now preserves items)
    const raw = await apiFetch<Record<string, unknown>>(
      `/warehouse/transfers/${transferId}`
    );
    const rawItems = Array.isArray(raw.items) ? (raw.items as Record<string, unknown>[]) : [];
    const items = rawItems.map(item => ({
      productSku: (item.productSku as string) || (item.sku as string) || "",
      quantity: (item.quantity as number) ?? 0,
      purchasePrice: (item.purchasePrice as number) ?? (item.purchase_price as number) ?? 0,
    }));
    cache[transferId] = items;
    localStorage.setItem("hal_pos_transfer_items_cache", JSON.stringify(cache));
    return items;
  } catch {
    return [];
  }
}

// ─── Stock Requests ───────────────────────────────────────────────────────────

/** Map raw API item shape → StockRequestItem */
function mapStockRequestItem(raw: Record<string, unknown>) {
  return {
    id: (raw.id as number) ?? 0,
    product_id: (raw.productId as number) ?? (raw.product_id as number) ?? 0,
    sku: (raw.sku as string) ?? "",
    product_name: (raw.productName as string) ?? (raw.product_name as string) ?? "",
    quantity: (raw.quantity as number) ?? 0,
  };
}

function getFirstName(name: string | undefined): string | undefined {
  if (!name) return undefined;
  const cleaned = name.replace(/[_\-\.]/g, " ");
  const parts = cleaned.trim().split(/\s+/);
  const first = parts[0] || name;
  return first.charAt(0).toUpperCase() + first.slice(1);
}

/** Map raw API stock request → StockRequest */
function mapStockRequest(raw: Record<string, unknown>): StockRequest {
  const rawItems = (raw.items as Record<string, unknown>[] | undefined) ?? [];
  return {
    id: (raw.id as number) ?? 0,
    request_number: (raw.requestNumber as string) ?? (raw.request_number as string) ?? "",
    store_id: (raw.storeId as number) ?? (raw.store_id as number) ?? 0,
    store_name: (raw.storeName as string) ?? (raw.store_name as string) ?? undefined,
    requested_by_id: (raw.requestedById as number) ?? (raw.requested_by_id as number) ?? 0,
    requested_by: getFirstName((raw.requestedBy as string) ?? (raw.requestedByUsername as string) ?? (raw.requested_by as string) ?? undefined),
    status: (raw.status as StockRequest["status"]) ?? "Pending",
    remarks: (raw.remarks as string | null) ?? null,
    transfer_id: (raw.transferId as number | null) ?? (raw.transfer_id as number | null) ?? null,
    items: rawItems.map(mapStockRequestItem),
    created_at: (raw.createdAt as string) ?? (raw.created_at as string) ?? new Date().toISOString(),
    updated_at: (raw.updatedAt as string) ?? (raw.updated_at as string) ?? new Date().toISOString(),
  };
}

export interface StockRequestParams {
  status?: string;
  storeId?: number;
  page?: number;
  limit?: number;
}

/** GET /stock-requests — Admin sees all; Store Managers see own store's */
export async function getStockRequests(
  params: StockRequestParams = {}
): Promise<StockRequestListResponse> {
  const q = buildQuery({
    status: params.status || undefined,
    storeId: params.storeId || undefined,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  });
  const raw = await apiFetch<Record<string, unknown>>(`/stock-requests${q}`);
  const rawList = (raw.requests as Record<string, unknown>[]) ?? [];

  // Enrich requests with details (items and requestedByUsername) in parallel!
  const enrichedRequests = await Promise.all(
    rawList.map(async (r) => {
      try {
        const details = await apiFetch<Record<string, unknown>>(`/stock-requests/${r.id}`);
        return mapStockRequest({
          ...r,
          items: details.items,
          requestedBy: details.requestedByUsername
        });
      } catch {
        return mapStockRequest(r);
      }
    })
  );

  return {
    requests: enrichedRequests,
    total: (raw.total as number) ?? 0,
    totalPages: (raw.totalPages as number) ?? 1,
    currentPage: (raw.currentPage as number) ?? 1,
  };
}

/** GET /stock-requests/{id} — single request with full items */
export async function getStockRequest(id: number): Promise<StockRequest> {
  const raw = await apiFetch<Record<string, unknown>>(`/stock-requests/${id}`);
  return mapStockRequest(raw);
}

/** POST /stock-requests — Store Manager creates a new request */
export async function createStockRequest(
  payload: CreateStockRequestPayload
): Promise<{ id: number; request_number: string; status: string; message: string }> {
  const raw = await apiFetch<Record<string, unknown>>("/stock-requests", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return {
    id: (raw.id as number) ?? 0,
    request_number: (raw.requestNumber as string) ?? (raw.request_number as string) ?? "",
    status: (raw.status as string) ?? "Pending",
    message: (raw.message as string) ?? "Stock request submitted.",
  };
}

/** PATCH /stock-requests/{id}/status — Admin approves or rejects */
export async function updateStockRequestStatus(
  id: number,
  payload: UpdateStockRequestStatusPayload
): Promise<{ id: number; status: string; transfer_id: number | null; message: string }> {
  const raw = await apiFetch<Record<string, unknown>>(`/stock-requests/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return {
    id: (raw.id as number) ?? id,
    status: (raw.status as string) ?? payload.status,
    transfer_id: (raw.transferId as number | null) ?? null,
    message: (raw.message as string) ?? `Status updated to ${payload.status}.`,
  };
}
