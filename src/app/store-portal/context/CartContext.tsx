import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/app/store-portal/types";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";
import {
  addCartItem,
  deleteCartItem,
  emptyCart,
  fetchCart,
  patchCartItem,
  replaceCart,
} from "@/app/store-portal/api/cart";

interface CartState {
  lines: CartLine[];
  loading: boolean;
  addItem: (line: Omit<CartLine, "qty">, qty?: number) => void;
  setQty: (sku: string, qty: number) => void;
  remove: (sku: string) => void;
  clear: () => void;
  totalUnits: number;
  totalAmount: number;
}

const CartContext = createContext<CartState | null>(null);

const CART_KEY_PREFIX = "hal_pos_store_cart";

function cartStorageKey(userId: number) {
  return `${CART_KEY_PREFIX}:${userId}`;
}

function readStoredCart(userId: number): CartLine[] {
  try {
    const raw = localStorage.getItem(cartStorageKey(userId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as CartLine[]) : [];
  } catch {
    return [];
  }
}

function clearStoredCart(userId: number) {
  try {
    localStorage.removeItem(cartStorageKey(userId));
  } catch {
    /* ignore */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [lines, setLines] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(false);
  const linesRef = useRef(lines);
  linesRef.current = lines;

  useEffect(() => {
    if (userId == null) {
      setLines([]);
      return;
    }

    let cancelled = false;
    setLoading(true);

    const load = async () => {
      const local = readStoredCart(userId);
      try {
        let remote = await fetchCart();
        if (local.length > 0 && remote.length === 0) {
          remote = await replaceCart(local);
        }
        if (!cancelled) {
          setLines(remote);
          clearStoredCart(userId);
        }
      } catch {
        if (!cancelled) setLines(local);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void load();
    return () => {
      cancelled = true;
    };
  }, [userId]);

  const addItem = useCallback(
    async (item: Omit<CartLine, "qty">, qty = 1) => {
      const isBackorder = item.isBackorder || item.availableQty <= 0;

      if (!isBackorder && item.availableQty <= 0) {
        toast.error("Out of stock — use Request if you still need this item.");
        return;
      }

      try {
        const next = await addCartItem({
          productId: item.productId,
          sku: item.sku,
          quantity: qty,
          isBackorder,
        });
        setLines(next);
        if (userId != null) clearStoredCart(userId);
        toast.success(isBackorder ? "Added (out of stock at Head Office)" : "Added to order");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not add to cart");
      }
    },
    [userId]
  );

  const setQty = useCallback(async (sku: string, qty: number) => {
    const line = linesRef.current.find((l) => l.sku === sku);
    if (!line) return;
    const max = line.isBackorder ? 9999 : line.availableQty;
    if (!line.isBackorder && qty > line.availableQty) {
      toast.error(`Only ${line.availableQty} units are currently available.`);
    }
    const q = Math.max(0, Math.min(max, Math.floor(qty)));
    try {
      if (line.cartItemId != null) {
        const next =
          q <= 0 ? await deleteCartItem(line.cartItemId) : await patchCartItem(line.cartItemId, { quantity: q });
        setLines(next);
      } else {
        const draft = linesRef.current
          .map((l) => (l.sku === sku ? { ...l, qty: q } : l))
          .filter((l) => l.qty > 0);
        setLines(await replaceCart(draft));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not update cart");
    }
  }, []);

  const remove = useCallback(async (sku: string) => {
    const line = linesRef.current.find((l) => l.sku === sku);
    if (!line) return;
    try {
      if (line.cartItemId != null) {
        setLines(await deleteCartItem(line.cartItemId));
      } else {
        setLines(await replaceCart(linesRef.current.filter((l) => l.sku !== sku)));
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not remove item");
    }
  }, []);

  const clear = useCallback(async () => {
    try {
      await emptyCart();
      setLines([]);
      if (userId != null) clearStoredCart(userId);
    } catch {
      setLines([]);
    }
  }, [userId]);

  const value = useMemo(() => {
    const totalUnits = lines.reduce((a, l) => a + l.qty, 0);
    const totalAmount = lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
    return { lines, loading, addItem, setQty, remove, clear, totalUnits, totalAmount };
  }, [lines, loading, addItem, setQty, remove, clear]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
