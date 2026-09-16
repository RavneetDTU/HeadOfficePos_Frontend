import { useAuth } from "@/app/context/AuthContext";

/** Shared Store POS product catalog paths for Admin and Store Manager. */
export function useCatalogBase() {
  const { isAdmin } = useAuth();
  return isAdmin ? "/catalog" : "/store/products";
}
