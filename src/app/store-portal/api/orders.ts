import { ApiError, apiFetch, buildQuery } from "@/app/lib/api";
import { printOrderInvoice } from "@/app/lib/printSellInvoice";
import { fetchTransfer, mapTransfer } from "@/app/store-portal/api/transfers";
import { resolveMediaUrl } from "@/app/store-portal/lib/media";
import type { BranchOrder, BranchOrderItem, BranchOrderStatus } from "@/app/store-portal/types";

function num(...vals: unknown[]) {
  for (const v of vals) {
    if (v != null && v !== "") return Number(v);
  }
  return 0;
}

/** Collapse API / UI aliases onto the meeting status enum. */
export function orderStatusToken(status: unknown): string {
  return String(status ?? "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

export function normalizeOrderStatus(status: unknown): BranchOrderStatus {
  const s = orderStatusToken(status);
  if (
    !s ||
    s === "PENDING" ||
    s === "PREORDER" ||
    s === "PRE_ORDER" ||
    s === "PREORDERED" ||
    s === "PRE_ORDERED"
  ) {
    return "PRE_ORDER";
  }
  if (s === "BACKORDER" || s === "BACK_ORDER" || s === "BACKORDERED" || s === "BACK_ORDERED") {
    return "BACKORDER";
  }
  if (s === "PARTIALLY_RECEIVED" || s === "PARTIAL_RECEIVED" || s === "PARTIALLYRECEIVED") {
    return "PARTIALLY_RECEIVED";
  }
  return s;
}

export function isPreOrderStatus(status: unknown): boolean {
  return normalizeOrderStatus(status) === "PRE_ORDER";
}

export function isBackOrderStatus(status: unknown): boolean {
  return normalizeOrderStatus(status) === "BACKORDER";
}

export function statusesMatch(actual: unknown, filter: string | null | undefined): boolean {
  const f = (filter ?? "").trim();
  if (!f || f.toUpperCase() === "ALL") return true;
  return normalizeOrderStatus(actual) === normalizeOrderStatus(f);
}

function statusQueryValues(status?: string): string[] | undefined {
  if (!status) return undefined;
  const n = normalizeOrderStatus(status);
  if (n === "PRE_ORDER") return ["PRE_ORDER", "PENDING", "PREORDER", "PRE-ORDER"];
  if (n === "BACKORDER") return ["BACKORDER", "BACK_ORDER", "BACK-ORDER"];
  return [n];
}

function inferSplitStatus(
  status: BranchOrderStatus,
  parentOrderId: number | null,
  backorderOrderId: number | null
): BranchOrderStatus {
  if (parentOrderId != null && (status === "PRE_ORDER" || status === "ORDERED" || status === "PROCESSING")) {
    return "BACKORDER";
  }
  if (backorderOrderId != null && (status === "PRE_ORDER" || status === "ORDERED" || status === "PROCESSING")) {
    return "PARTIAL";
  }
  return status;
}

function mapItem(raw: Record<string, unknown>): BranchOrderItem {
  const qty = num(raw.quantity, raw.qty);
  const unitPrice = num(raw.unitPrice, raw.unit_price, raw.unitCost, raw.unit_cost);
  return {
    id: raw.id != null ? Number(raw.id) : undefined,
    productId: raw.productId != null ? Number(raw.productId) : raw.product_id != null ? Number(raw.product_id) : undefined,
    productName: String(raw.productName ?? raw.product_name ?? raw.name ?? ""),
    sku: String(raw.sku ?? ""),
    quantity: qty,
    unitPrice,
    subtotal: num(raw.subtotal, qty * unitPrice),
    tax: num(raw.tax),
    isBackorder: Boolean(raw.isBackorder ?? raw.is_backorder),
    imageUrl: resolveMediaUrl(raw.imageUrl, raw.image_url),
    dispatchedQty: raw.dispatchedQty != null ? Number(raw.dispatchedQty) : raw.dispatched_qty != null ? Number(raw.dispatched_qty) : undefined,
    receivedQty:
      raw.receivedQty != null
        ? Number(raw.receivedQty)
        : raw.received_qty != null
          ? Number(raw.received_qty)
          : null,
    removed: Boolean(raw.removed),
  };
}

function mapOrder(raw: Record<string, unknown>): BranchOrder {
  const itemsRaw = (raw.items as Record<string, unknown>[]) ?? [];
  const items = itemsRaw.map(mapItem);
  const subtotal = num(
    raw.subtotal,
    items.reduce((a, i) => a + i.subtotal, 0)
  );
  const tax = num(raw.tax, raw.taxTotal, raw.tax_total);
  const itemCountFromApi = num(raw.itemCount, raw.item_count, raw.totalItems, raw.total_items);
  const parentOrderId =
    raw.parentOrderId != null ? Number(raw.parentOrderId) : raw.parent_order_id != null ? Number(raw.parent_order_id) : null;
  const backorderOrderId =
    raw.backorderOrderId != null
      ? Number(raw.backorderOrderId)
      : raw.backorder_order_id != null
        ? Number(raw.backorder_order_id)
        : null;
  const status = inferSplitStatus(normalizeOrderStatus(raw.status ?? "PRE_ORDER"), parentOrderId, backorderOrderId);
  return {
    id: Number(raw.id ?? 0),
    reference: String(raw.reference ?? raw.orderNumber ?? raw.order_number ?? `ORD-${raw.id ?? "?"}`),
    storeId: raw.storeId != null ? Number(raw.storeId) : raw.store_id != null ? Number(raw.store_id) : null,
    storeName: (raw.storeName ?? raw.store_name) as string | null | undefined,
    status,
    orderType: (raw.orderType ?? raw.order_type) as string | undefined,
    createdAt: (raw.createdAt ?? raw.created_at ?? raw.date) as string | undefined,
    createdBy: (raw.createdBy ?? raw.created_by ?? raw.biller) as string | undefined,
    notes: (raw.notes as string) ?? undefined,
    subtotal,
    tax,
    total: num(raw.total, raw.grandTotal, raw.grand_total, subtotal + tax),
    items,
    itemCount: itemCountFromApi || items.length || undefined,
    timeline: Array.isArray(raw.timeline)
      ? (raw.timeline as Record<string, unknown>[]).map((t) => ({
          oldStatus: (t.oldStatus ?? t.old_status) as string | null | undefined,
          newStatus: (t.newStatus ?? t.new_status) as string | undefined,
          notes: (t.notes as string) ?? null,
          changedBy: (t.changedBy ?? t.changed_by) as string | undefined,
          createdAt: (t.createdAt ?? t.created_at) as string | undefined,
        }))
      : undefined,
    saleId: raw.saleId != null ? Number(raw.saleId) : null,
    saleReference: (raw.saleReference ?? raw.sale_reference) as string | null | undefined,
    source: "order",
    fromWarehouse: (raw.warehouseName ?? raw.fromWarehouse ?? raw.from_warehouse) as string | null | undefined,
    parentOrderId,
    parentReference: (raw.parentReference ?? raw.parent_reference) as string | null | undefined,
    backorderOrderId,
    backorderReference: (raw.backorderReference ?? raw.backorder_reference) as string | null | undefined,
    invoiceId:
      raw.invoiceId != null
        ? Number(raw.invoiceId)
        : raw.invoice_id != null
          ? Number(raw.invoice_id)
          : null,
    invoiceReference: (raw.invoiceReference ??
      raw.invoice_reference ??
      raw.invoiceNumber ??
      raw.invoice_number ??
      raw.invoiceNo) as string | null | undefined,
    removedItems: Array.isArray(raw.removedItems)
      ? (raw.removedItems as Record<string, unknown>[]).map(mapItem)
      : Array.isArray(raw.removed_items)
        ? (raw.removed_items as Record<string, unknown>[]).map(mapItem)
        : undefined,
  };
}

function unwrapList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return (o.items ?? o.orders ?? o.purchases ?? o.transfers ?? o.requests ?? o.data ?? []) as Record<string, unknown>[];
  }
  return [];
}

export type StoreOrderSource = "order" | "transfer" | "purchase";

export interface PlaceStoreOrderPayload {
  notes?: string;
  storeId: number;
  storeName?: string | null;
  warehouseId?: number;
  warehouseName?: string;
  createdBy?: string;
  items: Array<{
    productId?: number;
    sku: string;
    name: string;
    quantity: number;
    unitPrice: number;
    imageUrl?: string | null;
  }>;
}

function mergeOrders(...lists: BranchOrder[][]): BranchOrder[] {
  const map = new Map<string, BranchOrder>();
  for (const list of lists) {
    for (const order of list) {
      const key = `${order.source ?? "order"}:${order.id}:${order.reference}`;
      const prev = map.get(key);
      if (!prev || (order.items?.length ?? 0) > (prev.items?.length ?? 0)) {
        map.set(key, order);
      }
    }
  }
  return [...map.values()].sort((a, b) => {
    const da = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const db = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return db - da;
  });
}

function itemsFromPayload(payload: PlaceStoreOrderPayload): BranchOrderItem[] {
  return payload.items.map((item) => ({
    productId: item.productId,
    productName: item.name,
    sku: item.sku,
    quantity: item.quantity,
    unitPrice: item.unitPrice,
    subtotal: item.quantity * item.unitPrice,
    imageUrl: item.imageUrl ?? null,
  }));
}

function orderFromItems(
  base: Partial<BranchOrder> & Pick<BranchOrder, "id" | "reference">,
  payload: PlaceStoreOrderPayload,
  source: StoreOrderSource,
  status: string
): BranchOrder {
  const items = itemsFromPayload(payload);
  const subtotal = items.reduce((a, i) => a + i.subtotal, 0);
  return {
    id: base.id,
    reference: base.reference,
    storeId: payload.storeId,
    storeName: payload.storeName,
    status: normalizeOrderStatus(status),
    createdAt: base.createdAt ?? new Date().toISOString(),
    createdBy: payload.createdBy,
    notes: payload.notes,
    subtotal,
    tax: 0,
    total: subtotal,
    items,
    source,
    fromWarehouse: payload.warehouseName ?? "HEAD OFFICE",
  };
}

function orderFromTransfer(transfer: {
  id: number;
  transferNumber: string;
  warehouseName?: string;
  storeId?: number;
  storeName?: string;
  status: string;
  createdAt?: string;
  remarks?: string;
  items?: Array<{
    productId?: number;
    productSku: string;
    productName: string;
    quantity: number;
    purchasePrice: number;
  }>;
  itemCount?: number;
  totalValue?: number;
}): BranchOrder {
  const items: BranchOrderItem[] = (transfer.items ?? []).map((item) => ({
    productId: item.productId,
    productName: item.productName,
    sku: item.productSku,
    quantity: item.quantity,
    unitPrice: item.purchasePrice,
    subtotal: item.quantity * item.purchasePrice,
  }));
  const subtotal = items.reduce((a, i) => a + i.subtotal, 0) || Number(transfer.totalValue ?? 0);
  return {
    id: transfer.id,
    reference: transfer.transferNumber,
    storeId: transfer.storeId ?? null,
    storeName: transfer.storeName,
    status: normalizeOrderStatus(transfer.status || "COMPLETED"),
    createdAt: transfer.createdAt,
    notes: transfer.remarks,
    subtotal,
    tax: 0,
    total: subtotal,
    items,
    itemCount: transfer.itemCount ?? (items.length > 0 ? items.length : undefined),
    source: "transfer",
    fromWarehouse: transfer.warehouseName,
  };
}

function mapTransferRow(raw: Record<string, unknown>): BranchOrder {
  return orderFromTransfer(mapTransfer(raw));
}

function mapPurchaseRow(raw: Record<string, unknown>): BranchOrder {
  const itemsRaw = (raw.items as Record<string, unknown>[]) ?? [];
  const items = itemsRaw.length ? itemsRaw.map(mapItem) : [];
  const subtotal = num(
    raw.grandTotal,
    raw.grand_total,
    raw.total,
    items.reduce((a, i) => a + i.subtotal, 0)
  );
  return {
    id: Number(raw.id ?? 0),
    reference: String(raw.reference ?? `PO-${raw.id ?? "?"}`),
    storeId: raw.warehouseId != null ? Number(raw.warehouseId) : raw.storeId != null ? Number(raw.storeId) : null,
    storeName: (raw.warehouse ?? raw.warehouseName ?? raw.storeName) as string | null | undefined,
    status: normalizeOrderStatus(raw.purchaseStatus ?? raw.status ?? "ORDERED"),
    createdAt: (raw.date ?? raw.createdAt ?? raw.created_at) as string | undefined,
    notes: (raw.notes as string) ?? undefined,
    subtotal,
    tax: num(raw.tax),
    total: subtotal,
    items,
    source: "purchase",
    fromWarehouse: (raw.supplier as string) ?? "HEAD OFFICE",
  };
}

async function postBranchOrder(payload: PlaceStoreOrderPayload): Promise<BranchOrder> {
  const raw = await apiFetch<Record<string, unknown>>("/orders", {
    method: "POST",
    body: JSON.stringify({
      notes: payload.notes,
      storeId: payload.storeId,
      status: "PRE_ORDER",
      items: payload.items.map((item) => ({
        productId: item.productId,
        sku: item.sku,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
      })),
    }),
  });
  const mapped = mapOrder(raw);
  if (!mapped.items.length) mapped.items = itemsFromPayload(payload);
  mapped.source = "order";
  return mapped;
}

async function postWarehouseTransfer(payload: PlaceStoreOrderPayload): Promise<BranchOrder> {
  if (!payload.warehouseId) throw new Error("Head Office warehouse is required");
  const items = payload.items.filter((item) => Number(item.productId) > 0);
  if (!items.length) throw new Error("Cart items are missing product ids");
  const raw = await apiFetch<Record<string, unknown>>("/warehouse/transfers", {
    method: "POST",
    body: JSON.stringify({
      warehouseId: payload.warehouseId,
      storeId: payload.storeId,
      remarks: payload.notes,
      items: items.map((item) => ({
        productId: Number(item.productId),
        quantity: item.quantity,
        purchasePrice: item.unitPrice,
      })),
    }),
  });
  return orderFromItems(
    {
      id: Number(raw.transferId ?? raw.id ?? 0),
      reference: String(raw.transferNumber ?? raw.reference ?? `SELL-${raw.transferId ?? raw.id}`),
    },
    payload,
    "transfer",
    "COMPLETED"
  );
}

async function postStockRequestOrder(payload: PlaceStoreOrderPayload): Promise<BranchOrder> {
  const raw = await apiFetch<Record<string, unknown>>("/stock-requests", {
    method: "POST",
    body: JSON.stringify({
      remarks: payload.notes,
      items: payload.items.map((item) => ({
        sku: item.sku,
        quantity: item.quantity,
      })),
    }),
  });
  return orderFromItems(
    {
      id: Number(raw.id ?? 0),
      reference: String(raw.requestNumber ?? raw.request_number ?? `SR-${raw.id ?? "?"}`),
    },
    payload,
    "purchase",
    String(raw.status ?? "PRE_ORDER")
  );
}

async function postPurchaseOrder(payload: PlaceStoreOrderPayload): Promise<BranchOrder> {
  const raw = await apiFetch<Record<string, unknown>>("/purchases", {
    method: "POST",
    body: JSON.stringify({
      date: new Date().toISOString(),
      supplier: payload.warehouseName || "Hearing Aid Labs - HEAD OFFICE",
      warehouseId: payload.storeId,
      warehouse: payload.storeName || null,
      purchaseStatus: "Received",
      paymentStatus: "Paid",
      notes: payload.notes,
      items: payload.items.map((item) => ({
        sku: item.sku,
        name: item.name,
        qty: item.quantity,
        unitCost: item.unitPrice,
        tax: 0,
      })),
    }),
  });
  return orderFromItems(
    {
      id: Number(raw.id ?? 0),
      reference: String(raw.reference ?? `PO-${raw.id ?? "?"}`),
    },
    payload,
    "purchase",
    "COMPLETED"
  );
}

/**
 * Place a store-manager cart order via POST /orders.
 * Falls back to POST /stock-requests (also store-manager) if /orders is unavailable.
 */
export async function placeStoreOrder(payload: PlaceStoreOrderPayload): Promise<BranchOrder> {
  try {
    return await postBranchOrder(payload);
  } catch (orderErr) {
    try {
      return await postStockRequestOrder(payload);
    } catch {
      throw new Error(
        `${orderErr instanceof Error ? orderErr.message : String(orderErr)}. Ask an admin to set this account to store_manager (Users → Edit Role) so Place Order can use POST /orders.`
      );
    }
  }
}

/** @deprecated use placeStoreOrder */
export async function createBranchOrder(payload: {
  notes?: string;
  storeId?: number | null;
  warehouseId?: number;
  warehouseName?: string;
  storeName?: string | null;
  createdBy?: string;
  items: Array<{
    productId?: number;
    sku?: string;
    name?: string;
    quantity: number;
    unitPrice?: number;
    imageUrl?: string | null;
  }>;
}): Promise<BranchOrder> {
  if (payload.storeId == null) throw new Error("Your account is not linked to a store.");
  return placeStoreOrder({
    notes: payload.notes,
    storeId: payload.storeId,
    storeName: payload.storeName,
    warehouseId: payload.warehouseId,
    warehouseName: payload.warehouseName,
    createdBy: payload.createdBy,
    items: payload.items.map((item) => ({
      productId: item.productId,
      sku: item.sku ?? "",
      name: item.name ?? item.sku ?? "Item",
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? 0,
      imageUrl: item.imageUrl,
    })),
  });
}

async function fetchOrdersFromApi(params: {
  storeId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
}): Promise<BranchOrder[]> {
  const aliases = statusQueryValues(params.status);
  const queries = aliases && aliases.length > 1 ? aliases : [params.status];
  const lists = await Promise.all(
    queries.map(async (status) => {
      try {
        const raw = await apiFetch<unknown>(
          `/orders${buildQuery({
            storeId: params.storeId,
            status,
            search: params.search,
            page: params.page ?? 1,
            limit: params.limit ?? 50,
          })}`
        );
        return unwrapList(raw).map(mapOrder);
      } catch {
        return [] as BranchOrder[];
      }
    })
  );
  const merged = mergeOrders(...lists);
  if (!params.status) return merged;
  return merged.filter((o) => statusesMatch(o.status, params.status));
}

async function fetchStorePurchasesAsOrders(storeId?: number): Promise<BranchOrder[]> {
  const raw = await apiFetch<unknown>("/store/purchases");
  let orders = unwrapList(raw).map(mapTransferRow);
  if (storeId != null) {
    orders = orders.filter((o) => o.storeId == null || o.storeId === storeId);
  }
  return orders;
}

async function fetchStockRequestsAsOrders(storeId?: number): Promise<BranchOrder[]> {
  const raw = await apiFetch<unknown>(
    `/stock-requests${buildQuery({ storeId, page: 1, limit: 50 })}`
  );
  return unwrapList(raw).map((row) => {
    const itemsRaw = (row.items as Record<string, unknown>[]) ?? [];
    const items = itemsRaw.map(mapItem);
    const subtotal = items.reduce((a, i) => a + i.subtotal, 0);
    return {
      id: Number(row.id ?? 0),
      reference: String(row.requestNumber ?? row.request_number ?? `SR-${row.id ?? "?"}`),
      storeId: row.storeId != null ? Number(row.storeId) : row.store_id != null ? Number(row.store_id) : null,
      storeName: (row.storeName ?? row.store_name) as string | null | undefined,
      status: normalizeOrderStatus(row.status ?? "PRE_ORDER"),
      createdAt: (row.createdAt ?? row.created_at ?? row.requestDate) as string | undefined,
      createdBy: (row.requestedBy ?? row.requested_by ?? row.requestedByUsername) as string | undefined,
      notes: (row.remarks as string) ?? undefined,
      subtotal,
      tax: 0,
      total: subtotal,
      items,
      source: "purchase" as const,
      fromWarehouse: "HEAD OFFICE",
    };
  });
}

async function fetchPurchasesAsOrders(storeId?: number, storeName?: string): Promise<BranchOrder[]> {
  const raw = await apiFetch<unknown>(`/purchases${buildQuery({ page: 1, limit: 100 })}`);
  const orders = unwrapList(raw).map(mapPurchaseRow);
  if (storeId == null && !storeName) return orders;
  const name = (storeName ?? "").toLowerCase();
  const filtered = orders.filter((o) => {
    if (storeId != null && o.storeId === storeId) return true;
    if (name && (o.storeName ?? "").toLowerCase().includes(name)) return true;
    return false;
  });
  return filtered.length ? filtered : orders;
}

export async function fetchOrders(params: {
  storeId?: number;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<BranchOrder[]> {
  return fetchOrdersFromApi(params);
}

export async function fetchStoreOrders(params: {
  storeId?: number;
  storeName?: string;
  status?: string;
  search?: string;
  page?: number;
  limit?: number;
} = {}): Promise<BranchOrder[]> {
  const orders = await fetchOrdersFromApi(params);
  const q = (params.search ?? "").trim().toLowerCase();
  const status = (params.status ?? "").trim().toUpperCase();
  return orders.filter((o) => {
    if (status && status !== "ALL" && !statusesMatch(o.status, status)) return false;
    if (!q) return true;
    return (
      o.reference.toLowerCase().includes(q) ||
      (o.storeName ?? "").toLowerCase().includes(q) ||
      o.items.some((i) => i.sku.toLowerCase().includes(q) || i.productName.toLowerCase().includes(q))
    );
  });
}

export async function fetchOrder(
  id: number,
  source?: StoreOrderSource
): Promise<BranchOrder> {
  if (source === "transfer") {
    const transfer = await fetchTransfer(id);
    return orderFromTransfer(transfer);
  }
  const raw = await apiFetch<Record<string, unknown>>(`/orders/${id}`);
  const order = mapOrder(raw);
  if (source) order.source = source;
  return order;
}

export async function updateOrder(
  id: number,
  payload: {
    notes?: string;
    items?: Array<{ productId?: number; sku: string; quantity: number; unitPrice?: number }>;
  }
): Promise<BranchOrder> {
  const raw = await apiFetch<Record<string, unknown>>(`/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(payload),
  });
  return mapOrder(raw);
}

async function postAction(id: number, action: string, body?: Record<string, unknown>) {
  const raw = await apiFetch<Record<string, unknown>>(`/orders/${id}/${action}`, {
    method: "POST",
    body: JSON.stringify(body ?? {}),
  });
  return mapOrder(raw);
}

export const approveOrder = (id: number) => postAction(id, "approve");
export const rejectOrder = (id: number, notes?: string) =>
  postAction(id, "reject", notes ? { notes } : undefined);
export const invoiceOrder = (id: number) => postAction(id, "invoice");
export const dispatchOrder = (id: number) => postAction(id, "dispatch");
export const cancelOrder = (id: number) => postAction(id, "cancel");
export const markOrderOrdered = (id: number) => postAction(id, "ordered");

export async function createBackorder(
  id: number,
  items: Array<{ productId?: number; sku: string; quantity: number; unitPrice?: number }>,
  notes?: string
): Promise<{ original: BranchOrder; backorder: BranchOrder }> {
  const raw = await apiFetch<Record<string, unknown>>(`/orders/${id}/backorder`, {
    method: "POST",
    body: JSON.stringify({ items, notes }),
  });
  const originalRaw = (raw.original ?? raw.originalOrder ?? raw.parent) as Record<string, unknown> | undefined;
  const nestedBackorder = (raw.backorder ?? raw.backorderOrder ?? raw.child) as Record<string, unknown> | undefined;

  let original = originalRaw ? mapOrder(originalRaw) : await fetchOrder(id);
  const nestedId = nestedBackorder?.id != null ? Number(nestedBackorder.id) : NaN;
  let backorder =
    nestedBackorder && Number.isFinite(nestedId) && nestedId !== original.id ? mapOrder(nestedBackorder) : null;

  const childId =
    original.backorderOrderId ??
    (Number.isFinite(nestedId) && nestedId !== original.id ? nestedId : null) ??
    (raw.backorderOrderId != null ? Number(raw.backorderOrderId) : null) ??
    (raw.backorder_order_id != null ? Number(raw.backorder_order_id) : null);

  if (!backorder && childId && childId !== original.id) {
    backorder = await fetchOrder(childId);
  }
  if (!backorder) {
    throw new Error("Back order was created but the new order was not returned.");
  }

  if (!isBackOrderStatus(backorder.status)) {
    backorder = {
      ...backorder,
      status: "BACKORDER",
      parentOrderId: backorder.parentOrderId ?? original.id,
      parentReference: backorder.parentReference ?? original.reference,
    };
  }
  if (original.status === "PRE_ORDER" || original.status === "ORDERED" || original.status === "PROCESSING") {
    original = {
      ...original,
      status: "PARTIAL",
      backorderOrderId: original.backorderOrderId ?? backorder.id,
      backorderReference: original.backorderReference ?? backorder.reference,
    };
  }
  return { original, backorder };
}

export async function removeOrderItems(
  id: number,
  items: Array<{ productId?: number; sku: string; quantity: number }>,
  notes?: string
): Promise<BranchOrder> {
  const raw = await apiFetch<Record<string, unknown>>(`/orders/${id}/remove-items`, {
    method: "POST",
    body: JSON.stringify({ items, notes }),
  });
  return mapOrder(raw);
}

export async function receiveOrder(
  id: number,
  items: Array<{ sku: string; receivedQty: number }>
): Promise<BranchOrder> {
  const raw = await apiFetch<Record<string, unknown>>(`/orders/${id}/receive`, {
    method: "POST",
    body: JSON.stringify({ items }),
  });
  return mapOrder(raw);
}

export async function fetchOrderInvoiceData(id: number): Promise<Record<string, unknown> | null> {
  try {
    return await apiFetch<Record<string, unknown>>(`/orders/${id}/invoice-data`);
  } catch (err) {
    if (err instanceof ApiError && (err.status === 404 || err.status === 409)) return null;
    throw err;
  }
}

/** True only after Head Office converts this order (or back order) to an invoice. */
export function hasServerInvoice(order: {
  status?: string;
  invoiceId?: number | null;
  invoiceReference?: string | null;
  source?: string;
}): boolean {
  if (order.source && order.source !== "order") return false;
  if (order.invoiceId != null && Number(order.invoiceId) > 0) return true;
  if (String(order.invoiceReference ?? "").trim()) return true;
  const s = normalizeOrderStatus(order.status);
  return s === "INVOICED" || s === "DISPATCHED" || s === "RECEIVED" || s === "PARTIALLY_RECEIVED";
}

export function invoiceLabel(order: { invoiceReference?: string | null; reference?: string }): string {
  return String(order.invoiceReference ?? "").trim() || order.reference || "Invoice";
}

function invoiceLinesFromApi(raw: Record<string, unknown>) {
  const lines = raw.lines ?? raw.items ?? raw.invoiceLines ?? raw.invoice_lines;
  if (!Array.isArray(lines) || lines.length === 0) return null;
  return (lines as Record<string, unknown>[]).map((l) => ({
    sku: String(l.sku ?? ""),
    productName: String(l.name ?? l.productName ?? l.product_name ?? ""),
    quantity: Number(l.qty ?? l.quantity ?? 0),
    unitPrice: Number(l.unitPrice ?? l.unit_price ?? l.unitCost ?? l.unit_cost ?? 0),
  }));
}

/** Print using the same sales invoice layout as List Sales. Never invents one in the browser. */
export async function printInvoiceFromApi(orderId: number): Promise<void> {
  const data = await fetchOrderInvoiceData(orderId);
  const lines = data ? invoiceLinesFromApi(data) : null;
  if (!data || !lines) {
    throw new Error("No invoice yet. Head Office must convert this order (or back order) to an invoice first.");
  }

  const toStore = (data.toStore as Record<string, unknown> | undefined) ?? {};
  printOrderInvoice({
    reference: String(data.invoiceReference ?? data.invoiceNumber ?? data.reference ?? `INV-${orderId}`),
    createdAt: (data.date as string) ?? (data.createdAt as string) ?? undefined,
    createdBy: (data.biller as string) ?? (data.createdBy as string) ?? undefined,
    storeName: String(toStore.name ?? data.storeName ?? ""),
    items: lines,
  });
}

export function formatOrderStatus(status: string): string {
  const s = normalizeOrderStatus(status);
  if (s === "PRE_ORDER") return "Pre-order";
  if (s === "BACKORDER") return "Back order";
  if (s === "PARTIALLY_RECEIVED") return "Partially received";
  if (s === "PARTIAL") return "Partial";
  if (s === "ORDERED") return "Ordered";
  if (s === "INVOICED") return "Invoiced";
  if (s === "DISPATCHED") return "Dispatched";
  if (s === "RECEIVED") return "Received";
  if (s === "PROCESSING") return "Processing";
  if (s === "COMPLETED") return "Completed";
  if (s === "REJECTED") return "Rejected";
  if (s === "CANCELLED") return "Cancelled";
  return String(s).replace(/_/g, " ");
}

export function canPrintInvoice(order: {
  status?: string;
  invoiceId?: number | null;
  invoiceReference?: string | null;
  source?: string;
}): boolean {
  return hasServerInvoice(order);
}

export const ORDER_STATUS_FILTERS = [
  "PRE_ORDER",
  "ORDERED",
  "PARTIAL",
  "BACKORDER",
  "INVOICED",
  "DISPATCHED",
  "RECEIVED",
  "PARTIALLY_RECEIVED",
  "COMPLETED",
  "REJECTED",
  "CANCELLED",
] as const;

/** Item count for list rows (API sends itemCount; detail sends items[]). */
export function orderItemCount(order: {
  itemCount?: number;
  items?: Array<{ quantity?: number }>;
}): number {
  if (order.itemCount != null && order.itemCount > 0) return order.itemCount;
  if (order.items && order.items.length > 0) {
    const sum = order.items.reduce((a, i) => a + (Number(i.quantity) || 0), 0);
    return sum > 0 ? sum : order.items.length;
  }
  return 0;
}

export function orderStatusTone(
  status: string
): "neutral" | "ok" | "warn" | "danger" | "info" {
  const s = normalizeOrderStatus(status);
  if (s === "COMPLETED" || s === "DISPATCHED" || s === "RECEIVED" || s === "INVOICED") return "ok";
  if (s === "PRE_ORDER" || s === "PROCESSING" || s === "PARTIAL" || s === "PARTIALLY_RECEIVED") return "warn";
  if (s === "ORDERED" || s === "BACKORDER") return "info";
  if (s === "REJECTED" || s === "CANCELLED") return "danger";
  return "neutral";
}
