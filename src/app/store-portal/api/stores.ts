import { apiFetch } from "@/app/lib/api";
import type { Store, Warehouse } from "@/app/store-portal/types";

function mapLoc(raw: Record<string, unknown>, type: "warehouse" | "store"): Store | Warehouse {
  return {
    id: Number(raw.id ?? 0),
    name: String(raw.name ?? ""),
    code: (raw.code as string) ?? undefined,
    address: (raw.address as string) ?? undefined,
    city: (raw.city as string) ?? undefined,
    phone: (raw.phone as string) ?? undefined,
    email: (raw.email as string) ?? undefined,
    manager: (raw.manager as string) ?? undefined,
    status: (raw.status as string) ?? "Active",
    type,
  } as Store & Warehouse;
}

export async function fetchWarehouses(): Promise<Warehouse[]> {
  const raw = await apiFetch<Record<string, unknown>[]>("/warehouses");
  return (raw ?? [])
    .map((w) => mapLoc(w, "warehouse") as Warehouse)
    .filter((w) => !w.name.toLowerCase().includes("smoke"));
}

export async function fetchStores(): Promise<Store[]> {
  const raw = await apiFetch<Record<string, unknown>[]>("/stores");
  return (raw ?? [])
    .map((s) => mapLoc(s, "store") as Store)
    .filter((s) => {
      const n = s.name.toLowerCase().trim();
      return !n.includes("smoke") && n !== "head office";
    });
}
