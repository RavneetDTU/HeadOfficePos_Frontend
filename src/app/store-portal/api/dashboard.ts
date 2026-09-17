import { apiFetch, buildQuery } from "@/app/lib/api";
import { normalizeOrderStatus } from "@/app/store-portal/api/orders";

export interface StoreDashboard {
  currentInventory: number;
  inventoryValue: number;
  todaysSales: number;
  monthlySales: number;
  pendingOrders: number;
  recentOrders: Array<{
    id: number;
    reference: string;
    status: string;
    total: number;
    createdAt?: string;
  }>;
  myStockRequests: {
    pending: number;
    approved: number;
    rejected: number;
    inTransit: number;
    delivered: number;
  };
  recentRequests: Record<string, unknown>[];
}

function num(...vals: unknown[]) {
  for (const v of vals) {
    if (v != null && v !== "") return Number(v);
  }
  return 0;
}

export async function fetchWarehouseDashboard(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>("/dashboard/warehouse");
}

export async function fetchAdminDashboard(): Promise<Record<string, unknown>> {
  return apiFetch<Record<string, unknown>>("/dashboard/admin");
}

/** GET /dashboard/store — live StoreDashboardOut */
export async function fetchStoreDashboard(): Promise<StoreDashboard> {
  const raw = await apiFetch<Record<string, unknown>>("/dashboard/store");
  const req = (raw.myStockRequests ?? {}) as Record<string, unknown>;
  const recentOrdersRaw = Array.isArray(raw.recentOrders) ? raw.recentOrders : [];
  return {
    currentInventory: num(raw.currentInventory),
    inventoryValue: num(raw.inventoryValue),
    todaysSales: num(raw.todaysSales),
    monthlySales: num(raw.monthlySales),
    pendingOrders: num(raw.pendingOrders),
    recentOrders: recentOrdersRaw.map((row) => {
      const o = (row ?? {}) as Record<string, unknown>;
      return {
        id: num(o.id),
        reference: String(o.reference ?? `ORD-${o.id ?? "?"}`),
        status: normalizeOrderStatus(o.status ?? "PRE_ORDER"),
        total: num(o.total),
        createdAt: (o.createdAt ?? o.created_at) as string | undefined,
      };
    }),
    myStockRequests: {
      pending: num(req.pending),
      approved: num(req.approved),
      rejected: num(req.rejected),
      inTransit: num(req.inTransit, req.in_transit),
      delivered: num(req.delivered),
    },
    recentRequests: Array.isArray(raw.recentRequests)
      ? (raw.recentRequests as Record<string, unknown>[])
      : [],
  };
}
