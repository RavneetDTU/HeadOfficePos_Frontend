import { apiFetch, buildQuery } from "@/app/lib/api";
import type { Transfer, TransferItem, TransferStatus } from "@/app/store-portal/types";

function mapItem(raw: Record<string, unknown>): TransferItem {
  return {
    productId: raw.productId != null ? Number(raw.productId) : undefined,
    productSku: String(raw.productSku ?? raw.sku ?? ""),
    productName: String(raw.productName ?? raw.name ?? ""),
    quantity: Number(raw.quantity ?? 0),
    purchasePrice: Number(raw.purchasePrice ?? raw.purchase_price ?? raw.unitCost ?? 0),
  };
}

export function mapTransfer(raw: Record<string, unknown>): Transfer {
  const itemsRaw = (raw.items as Record<string, unknown>[]) ?? [];
  const items = itemsRaw.map(mapItem);
  const totalValue =
    Number(raw.totalValue ?? raw.total_value ?? 0) ||
    items.reduce((a, i) => a + i.quantity * i.purchasePrice, 0);
  return {
    id: Number(raw.transferId ?? raw.id ?? 0),
    transferNumber: String(
      raw.transferNumber ?? raw.transfer_number ?? raw.reference ?? `TRF-${raw.id}`
    ),
    warehouseId: raw.warehouseId != null ? Number(raw.warehouseId) : undefined,
    warehouseName: (raw.warehouseName ?? raw.warehouse_name) as string | undefined,
    storeId: raw.storeId != null ? Number(raw.storeId) : undefined,
    storeName: (raw.storeName ?? raw.store_name) as string | undefined,
    status: String(raw.status ?? "Pending") as TransferStatus,
    createdAt: (raw.createdAt ?? raw.created_at) as string | undefined,
    remarks: (raw.remarks ?? raw.notes) as string | undefined,
    itemCount: Number(raw.itemCount ?? raw.item_count ?? items.length),
    items,
    totalValue,
  };
}

function unwrapTransferList(raw: unknown): Record<string, unknown>[] {
  if (Array.isArray(raw)) return raw as Record<string, unknown>[];
  if (raw && typeof raw === "object") {
    const o = raw as Record<string, unknown>;
    return (o.transfers ?? o.sells ?? o.items ?? o.data ?? []) as Record<string, unknown>[];
  }
  return [];
}

export async function fetchTransfers(params: {
  page?: number;
  limit?: number;
  storeId?: number;
  warehouseId?: number;
  status?: string;
  search?: string;
} = {}): Promise<{ transfers: Transfer[]; total: number }> {
  const query = {
    page: params.page ?? 1,
    limit: params.limit ?? 50,
    warehouseId: params.warehouseId,
    status: params.status,
    search: params.search,
  };

  // Do not send storeId — GET /warehouse/transfers?storeId= causes a 500 on the live API.
  const raw = await apiFetch<unknown>(`/warehouse/transfers${buildQuery(query)}`);
  let transfers = unwrapTransferList(raw).map(mapTransfer);
  if (params.storeId != null) {
    transfers = transfers.filter((t) => t.storeId == null || t.storeId === params.storeId);
  }
  const total =
    raw && typeof raw === "object" && !Array.isArray(raw)
      ? Number((raw as Record<string, unknown>).total ?? transfers.length)
      : transfers.length;
  return { transfers, total };
}

/** Store-manager incoming list. Prefer GET /store/purchases (scoped to the logged-in store). */
export async function fetchIncomingForStore(storeId: number): Promise<Transfer[]> {
  try {
    const raw = await apiFetch<unknown>("/store/purchases");
    return unwrapTransferList(raw)
      .map(mapTransfer)
      .filter((t) => t.storeId == null || t.storeId === storeId);
  } catch {
    try {
      const res = await fetchTransfers({ storeId, limit: 100 });
      return res.transfers;
    } catch {
      return [];
    }
  }
}

export async function fetchTransfer(id: number): Promise<Transfer> {
  const raw = await apiFetch<Record<string, unknown>>(`/warehouse/transfers/${id}`);
  return mapTransfer(raw);
}

export async function createTransfer(payload: {
  warehouseId: number;
  storeId: number;
  remarks?: string;
  items: Array<{ productId: number; quantity: number; purchasePrice: number }>;
}): Promise<Transfer> {
  const raw = await apiFetch<Record<string, unknown>>("/warehouse/transfers", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return mapTransfer(raw);
}

/** Interim dispatch/receive until dedicated endpoints exist. */
export async function updateTransferStatus(
  id: number,
  status: string,
  remarks?: string
): Promise<Transfer> {
  const raw = await apiFetch<Record<string, unknown>>(`/warehouse/transfers/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status, remarks }),
  });
  return mapTransfer(raw);
}

export function isIncomingStatus(status: string) {
  const s = status.toLowerCase();
  return (
    s.includes("transit") ||
    s === "approved" ||
    s === "pending" ||
    s === "dispatched"
  );
}

export function isReceivedStatus(status: string) {
  const s = status.toLowerCase();
  return s === "delivered" || s === "completed" || s === "received";
}
