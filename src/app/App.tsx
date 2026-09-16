import { Loader2 } from "lucide-react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { Toaster } from "sonner";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { AuthProvider, homePathForUser, useAuth } from "./context/AuthContext";
import { CartProvider } from "./store-portal/context/CartContext";
import { StoreLayout } from "./store-portal/layout/StoreLayout";

// ─── HeadOffice POS Pages ─────────────────────────────────────────────────────
import { AddSale } from "./pages/AddSale";
import { AddSell } from "./pages/AddSell";
import { ListProformas } from "./pages/ListProformas";
import { ListQuotations } from "./pages/ListQuotations";
import { ListStockRequests } from "./pages/ListStockRequests";
import { ListSells } from "./pages/ListSells";
import { LoginPage } from "./pages/LoginPage";
import { AddProduct } from "./pages/products/AddProduct";
import { ListProducts } from "./pages/products/ListProducts";
import { UserManagement } from "./pages/settings/UserManagement";
import { UserManagementSystem } from "./pages/settings/UserManagementSystem";
import { WarehouseSettings } from "./pages/settings/WarehouseSettings";
import { StoreDetailPage } from "./pages/StoreDetailPage";
import { AddBiller } from "./pages/billers/AddBiller";
import { ListBillers } from "./pages/billers/ListBillers";
import { AddCustomer } from "./pages/customers/AddCustomer";
import { ListCustomers } from "./pages/customers/ListCustomers";
import { AddSupplier } from "./pages/suppliers/AddSupplier";
import { ListSuppliers } from "./pages/suppliers/ListSuppliers";
import { AddPurchase } from "./pages/AddPurchase";
import { ListPurchases } from "./pages/ListPurchases";
import { Unauthorized } from "./pages/Unauthorized";
import { UpcomingFeature } from "./pages/UpcomingFeature";

// ─── Store POS pages (merged from Store_pos) ──────────────────────────────────
import { StoreDashboardPage } from "./store-portal/pages/store/StoreDashboardPage";
import { ShopPage } from "./store-portal/pages/store/ShopPage";
import { ProductDetailPage } from "./store-portal/pages/store/ProductDetailPage";
import { CartPage } from "./store-portal/pages/store/CartPage";
import { InventoryPage } from "./store-portal/pages/store/InventoryPage";
import { IncomingPage } from "./store-portal/pages/store/IncomingPage";
import { OrdersPage as StoreOrdersPage } from "./store-portal/pages/store/OrdersPage";
import { OrderDetailPage as StoreOrderDetailPage } from "./store-portal/pages/store/OrderDetailPage";
import { ProfilePage } from "./store-portal/pages/store/ProfilePage";
import { OrdersPage as BranchOrdersPage } from "./store-portal/pages/admin/OrdersPage";
import { OrderDetailPage as BranchOrderDetailPage } from "./store-portal/pages/admin/OrderDetailPage";
import { ProductsPage as CatalogProductsPage } from "./store-portal/pages/catalog/ProductsPage";
import { AdminProductDetailPage as CatalogProductDetailPage } from "./store-portal/pages/catalog/ProductDetailPage";

function BootSpinner() {
  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <Loader2 size={32} className="text-indigo-500 animate-spin" />
    </div>
  );
}

function CatalogShell() {
  return (
    <div className="bg-slate-50 min-h-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-6">
        <Outlet />
      </div>
    </div>
  );
}

function RoleHomeRedirect() {
  const { isAuthenticated, isLoading, user } = useAuth();
  if (isLoading) return <BootSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Navigate to={homePathForUser(user)} replace />;
}

// ─── Admin-only layout (existing Head Office UI) ──────────────────────────────
function RequireAdmin() {
  const { isAuthenticated, isLoading, isAdmin, isStoreManager } = useAuth();

  if (isLoading) return <BootSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isStoreManager) return <Navigate to="/store" replace />;
  if (!isAdmin) return <Unauthorized />;

  return (
    <div className="flex h-screen bg-white">
      <Sidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Navbar />
        <main className="flex-1 overflow-y-auto bg-white">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

// ─── Store Manager layout (Store POS journey) ─────────────────────────────────
function RequireStoreManager() {
  const { isAuthenticated, isLoading, isStoreManager, isAdmin } = useAuth();

  if (isLoading) return <BootSpinner />;
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isAdmin) return <Navigate to="/" replace />;
  if (!isStoreManager) return <Unauthorized />;

  return (
    <CartProvider>
      <Outlet />
    </CartProvider>
  );
}

function PublicOnly() {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <BootSpinner />;
  if (isAuthenticated) {
    return <Navigate to={homePathForUser(user)} replace />;
  }
  return <Outlet />;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors closeButton />
        <Routes>
          <Route element={<PublicOnly />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          <Route path="/unauthorized" element={<Unauthorized />} />

          <Route element={<RequireAdmin />}>
            <Route path="/" element={<UpcomingFeature />} />

            <Route path="/headoffice-pos" element={<Navigate to="/products" replace />} />
            <Route path="/headoffice-pos/store/:id" element={<StoreDetailPage />} />

            <Route path="/products" element={<ListProducts />} />
            <Route path="/products/add" element={<AddProduct />} />
            <Route path="/catalog" element={<CatalogShell />}>
              <Route index element={<CatalogProductsPage />} />
              <Route path=":sku" element={<CatalogProductDetailPage />} />
            </Route>

            <Route path="/sells" element={<ListSells />} />
            <Route path="/sells/add" element={<AddSell />} />
            <Route path="/transfers" element={<Navigate to="/sells" replace />} />
            <Route path="/transfers/add" element={<Navigate to="/sells/add" replace />} />

            <Route path="/quotations" element={<ListQuotations />} />
            <Route path="/quotations/add" element={<AddSale />} />

            <Route path="/proforma" element={<ListProformas />} />
            <Route path="/proforma/add" element={<AddSale />} />

            <Route path="/requests" element={<ListStockRequests />} />
            <Route path="/purchases" element={<ListPurchases />} />
            <Route path="/purchases/add" element={<AddPurchase />} />

            <Route path="/branch-orders" element={<BranchOrdersPage />} />
            <Route path="/branch-orders/:id" element={<BranchOrderDetailPage />} />

            <Route path="/billers" element={<ListBillers />} />
            <Route path="/billers/add" element={<AddBiller />} />
            <Route path="/customers" element={<ListCustomers />} />
            <Route path="/customers/add" element={<AddCustomer />} />
            <Route path="/suppliers" element={<ListSuppliers />} />
            <Route path="/suppliers/add" element={<AddSupplier />} />

            <Route path="/settings/warehouse" element={<WarehouseSettings />} />
            <Route path="/settings/users" element={<UserManagement />} />
            <Route path="/user-management-system" element={<UserManagementSystem />} />

            <Route path="/reports/sales" element={<UpcomingFeature />} />
            <Route path="/reports/purchases" element={<UpcomingFeature />} />
            <Route path="/reports/inventory" element={<UpcomingFeature />} />

            <Route path="/logs/activity" element={<UpcomingFeature />} />
            <Route path="/logs/system" element={<UpcomingFeature />} />
          </Route>

          <Route element={<RequireStoreManager />}>
            <Route path="/store" element={<StoreLayout />}>
              <Route index element={<StoreDashboardPage />} />
              <Route path="shop" element={<ShopPage />} />
              <Route path="shop/:sku" element={<ProductDetailPage />} />
              <Route path="products" element={<CatalogProductsPage />} />
              <Route path="products/:sku" element={<CatalogProductDetailPage />} />
              <Route path="cart" element={<CartPage />} />
              <Route path="orders" element={<StoreOrdersPage />} />
              <Route path="orders/:id" element={<StoreOrderDetailPage />} />
              <Route path="stock" element={<InventoryPage />} />
              <Route path="incoming" element={<IncomingPage />} />
              <Route path="profile" element={<ProfilePage />} />
            </Route>
          </Route>

          <Route path="*" element={<RoleHomeRedirect />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
