import { NavLink, Outlet, useNavigate } from "react-router";
import {
  Boxes,
  ClipboardList,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ShoppingBag,
  ShoppingCart,
  Truck,
} from "lucide-react";
import { useAuth } from "@/app/context/AuthContext";
import { useCart } from "@/app/store-portal/context/CartContext";

const storeNav = [
  { to: "/store", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/store/products", label: "Products", icon: Package },
  { to: "/store/shop", label: "Shop", icon: ShoppingBag },
  { to: "/store/cart", label: "Cart", icon: ShoppingCart },
  { to: "/store/orders", label: "My Orders", icon: ClipboardList },
  { to: "/store/stock", label: "Stock Availability", icon: Boxes },
  { to: "/store/incoming", label: "Incoming", icon: Truck },
  { to: "/store/profile", label: "Profile", icon: Settings },
];

export function StoreLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { totalUnits } = useCart();
  const storeLabel =
    user?.storeName || user?.warehouse || (user?.storeId != null ? `Store #${user.storeId}` : "Store");

  return (
    <div className="h-screen flex overflow-hidden bg-white">
      <aside className="w-56 shrink-0 bg-[#1a1d29] text-white flex flex-col h-full overflow-hidden">
        <div className="px-4 py-3 border-b border-white/10">
          <h1 className="text-base font-semibold">Hearing Aid Labs</h1>
          <p className="text-xs text-blue-400 font-medium mt-0.5">Store POS</p>
          <p className="text-[11px] text-white/60 mt-1 truncate" title={storeLabel}>
            {storeLabel}
          </p>
        </div>
        <nav className="flex-1 overflow-y-auto py-2">
          {storeNav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2 text-sm transition-colors ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-white/80 hover:bg-white/5 hover:text-white"
                }`
              }
            >
              <item.icon size={16} />
              <span className="flex-1">{item.label}</span>
              {item.to === "/store/cart" && totalUnits > 0 && (
                <span className="text-[10px] bg-white text-blue-700 rounded-full px-1.5 py-0.5 font-semibold">
                  {totalUnits}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10">
          <p className="text-[11px] text-white/50 truncate px-1 mb-1">
            {user?.name || user?.username}
          </p>
          <button
            type="button"
            onClick={() => {
              logout();
              navigate("/login", { replace: true });
            }}
            className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-white/80 hover:bg-white/5"
          >
            <LogOut size={16} /> Sign out
          </button>
        </div>
      </aside>
      <main className="flex-1 min-h-0 overflow-y-auto bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 sm:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
