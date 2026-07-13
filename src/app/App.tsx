import { Loader2 } from "lucide-react";
import { BrowserRouter, Navigate, Outlet, Route, Routes } from "react-router";
import { Navbar } from "./components/layout/Navbar";
import { Sidebar } from "./components/layout/Sidebar";
import { AuthProvider, useAuth } from "./context/AuthContext";

// ─── HeadOffice POS Pages ─────────────────────────────────────────────────────
import { AddTransfer } from "./pages/AddTransfer";
import { ListStockRequests } from "./pages/ListStockRequests";
import { ListTransfers } from "./pages/ListTransfers";
import { LoginPage } from "./pages/LoginPage";
import { AddProduct } from "./pages/products/AddProduct";
import { ListProducts } from "./pages/products/ListProducts";
import { UserManagement } from "./pages/settings/UserManagement";
import { UserManagementSystem } from "./pages/settings/UserManagementSystem";
import { WarehouseSettings } from "./pages/settings/WarehouseSettings";
import { StoreDetailPage } from "./pages/StoreDetailPage";
import { Unauthorized } from "./pages/Unauthorized";
import { UpcomingFeature } from "./pages/UpcomingFeature";

// ─── Protected layout — Admin only ────────────────────────────────────────────
function ProtectedLayout() {
  const { isAuthenticated, isLoading, isAdmin } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Non-admin gets Unauthorized page instead of the app
  if (!isAdmin) {
    return (
      <div className="flex h-screen bg-white">
        <Unauthorized />
      </div>
    );
  }

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

// ─── Public-only guard (redirect to app if already logged in) ─────────────────
function PublicOnly() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Loader2 size={32} className="text-indigo-500 animate-spin" />
      </div>
    );
  }

  return isAuthenticated ? <Navigate to="/" replace /> : <Outlet />;
}

// ─── App ──────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* Public routes */}
          <Route element={<PublicOnly />}>
            <Route path="/login" element={<LoginPage />} />
          </Route>

          {/* Protected admin routes */}
          <Route element={<ProtectedLayout />}>

            {/* HQ Dashboard — default landing */}
            {/* <Route path="/" element={<OfficePOSDashboard />} */}
            <Route path="/" element={<UpcomingFeature />} />

            {/* Stores Overview */}
            <Route path="/headoffice-pos" element={<Navigate to="/products" replace />} />
            <Route path="/headoffice-pos/store/:id" element={<StoreDetailPage />} />

            {/* Products */}
            <Route path="/products" element={<ListProducts />} />
            <Route path="/products/add" element={<AddProduct />} />



            {/* Transfers */}
            <Route path="/transfers" element={<ListTransfers />} />
            <Route path="/transfers/add" element={<AddTransfer />} />

            {/* Stock Requests — admin approve/reject */}
            <Route path="/requests" element={<ListStockRequests />} />

            {/* Settings */}
            <Route path="/settings/warehouse" element={<WarehouseSettings />} />
            <Route path="/settings/users" element={<UserManagement />} />

            {/* User Management System */}
            <Route path="/user-management-system" element={<UserManagementSystem />} />

            {/* Reports (upcoming) */}
            <Route path="/reports/sales" element={<UpcomingFeature />} />
            <Route path="/reports/purchases" element={<UpcomingFeature />} />
            <Route path="/reports/inventory" element={<UpcomingFeature />} />

            {/* Logs (upcoming) */}
            <Route path="/logs/activity" element={<UpcomingFeature />} />
            <Route path="/logs/system" element={<UpcomingFeature />} />

          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}