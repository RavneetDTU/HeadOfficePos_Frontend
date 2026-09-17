import { apiFetch } from "@/app/lib/api";
import { resolveMediaUrl } from "@/app/store-portal/lib/media";
import type { CartLine } from "@/app/store-portal/types";

interface CartOut {
  id?: number;
  items?: Record<string, unknown>[];
  subtotal?: number;
  totalUnits?: number;
}

export function mapCartLines(raw: unknown): CartLine[] {
  const o = (raw ?? {}) as CartOut;
  const items = Array.isArray(o.items) ? o.items : [];
  return items.map((item) => {
    const qty = Number(item.quantity ?? item.qty ?? 0);
    const unitPrice = Number(item.unitPrice ?? item.unit_price ?? item.unitCost ?? 0);
    return {
      cartItemId: item.id != null ? Number(item.id) : undefined,
      productId: Number(item.productId ?? item.product_id ?? 0),
      sku: String(item.sku ?? ""),
      name: String(item.name ?? item.productName ?? ""),
      imageUrl: resolveMediaUrl(item.imageUrl, item.image_url),
      unitCost: unitPrice,
      availableQty: Number(item.availableQty ?? item.available_qty ?? 0),
      qty,
      isBackorder: Boolean(item.isBackorder ?? item.is_backorder),
    };
  });
}

export async function fetchCart(): Promise<CartLine[]> {
  return mapCartLines(await apiFetch<CartOut>("/cart"));
}

export async function replaceCart(lines: CartLine[]): Promise<CartLine[]> {
  const raw = await apiFetch<CartOut>("/cart", {
    method: "PUT",
    body: JSON.stringify({
      items: lines.map((l) => ({
        productId: l.productId,
        sku: l.sku,
        quantity: l.qty,
        isBackorder: Boolean(l.isBackorder),
      })),
    }),
  });
  return mapCartLines(raw);
}

export async function addCartItem(line: {
  productId: number;
  sku: string;
  quantity: number;
  isBackorder?: boolean;
}): Promise<CartLine[]> {
  const raw = await apiFetch<CartOut>("/cart/items", {
    method: "POST",
    body: JSON.stringify({
      productId: line.productId,
      sku: line.sku,
      quantity: line.quantity,
      isBackorder: Boolean(line.isBackorder),
    }),
  });
  return mapCartLines(raw);
}

export async function patchCartItem(
  itemId: number,
  patch: { quantity?: number; isBackorder?: boolean }
): Promise<CartLine[]> {
  const raw = await apiFetch<CartOut>(`/cart/items/${itemId}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return mapCartLines(raw);
}

export async function deleteCartItem(itemId: number): Promise<CartLine[]> {
  const raw = await apiFetch<CartOut>(`/cart/items/${itemId}`, { method: "DELETE" });
  return mapCartLines(raw);
}

export async function emptyCart(): Promise<void> {
  await apiFetch("/cart", { method: "DELETE" });
}
