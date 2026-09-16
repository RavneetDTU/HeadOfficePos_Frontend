import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { CartLine } from "@/app/store-portal/types";
import { useAuth } from "@/app/context/AuthContext";
import { toast } from "sonner";

interface CartState {
  lines: CartLine[];
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

function writeStoredCart(userId: number, lines: CartLine[]) {
  try {
    localStorage.setItem(cartStorageKey(userId), JSON.stringify(lines));
  } catch {
    /* ignore quota */
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [lines, setLines] = useState<CartLine[]>(() =>
    userId != null ? readStoredCart(userId) : []
  );

  useEffect(() => {
    if (userId == null) {
      setLines([]);
      return;
    }
    setLines(readStoredCart(userId));
  }, [userId]);

  const commit = useCallback(
    (updater: (prev: CartLine[]) => CartLine[]) => {
      setLines((prev) => {
        const next = updater(prev);
        if (userId != null) writeStoredCart(userId, next);
        return next;
      });
    },
    [userId]
  );

  const addItem = (item: Omit<CartLine, "qty">, qty = 1) => {
    const isBackorder = item.isBackorder || item.availableQty <= 0;

    if (!isBackorder && item.availableQty <= 0) {
      toast.error("Out of stock — use Request / Backorder if allowed.");
      return;
    }

    let rejected = false;
    commit((prev) => {
      const existing = prev.find((l) => l.sku === item.sku);
      const nextQty = (existing?.qty ?? 0) + qty;

      if (!isBackorder && nextQty > item.availableQty) {
        rejected = true;
        return prev;
      }

      const line: CartLine = {
        ...item,
        qty: nextQty,
        isBackorder,
        availableQty: item.availableQty,
      };

      if (existing) {
        return prev.map((l) => (l.sku === item.sku ? { ...l, ...line } : l));
      }
      return [...prev, line];
    });
    if (rejected) {
      toast.error(`Only ${item.availableQty} units are currently available.`);
      return;
    }
    toast.success(isBackorder ? "Added as backorder request" : "Added to order");
  };

  const setQty = (sku: string, qty: number) => {
    commit((prev) =>
      prev
        .map((l) => {
          if (l.sku !== sku) return l;
          const max = l.isBackorder ? 9999 : l.availableQty;
          const q = Math.max(0, Math.min(max, Math.floor(qty)));
          if (!l.isBackorder && qty > l.availableQty) {
            toast.error(`Only ${l.availableQty} units are currently available.`);
          }
          return { ...l, qty: q };
        })
        .filter((l) => l.qty > 0)
    );
  };

  const remove = (sku: string) => commit((prev) => prev.filter((l) => l.sku !== sku));
  const clear = () => commit(() => []);

  const value = useMemo(() => {
    const totalUnits = lines.reduce((a, l) => a + l.qty, 0);
    const totalAmount = lines.reduce((a, l) => a + l.qty * l.unitCost, 0);
    return { lines, addItem, setQty, remove, clear, totalUnits, totalAmount };
  }, [lines, commit]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
