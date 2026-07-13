import { useState, useEffect, useCallback } from "react";
import {
  Users,
  Search,
  Shield,
  ShieldOff,
  Building2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Crown,
  User as UserIcon,
  Mail,
  Calendar,
  ChevronDown,
  X,
} from "lucide-react";
import { useAuth, type User, type Role } from "../../context/AuthContext";

// ─── Warehouses (mirrors LoginPage) ──────────────────────────────────────────
const WAREHOUSES = [
  "HEAD OFFICE",
  "BRANCH 1",
  "BRANCH 2",
  "BRANCH 3",
  "BRANCH 4",
];

// ─── Role-change modal ────────────────────────────────────────────────────────
interface EditModalProps {
  target: User;
  onClose: () => void;
  onSave: (role: Role, warehouse: string | null) => Promise<void>;
  isSaving: boolean;
}

function EditRoleModal({ target, onClose, onSave, isSaving }: EditModalProps) {
  const [role, setRole] = useState<Role>(target.role);
  const [warehouse, setWarehouse] = useState<string>(
    target.warehouse ?? WAREHOUSES[0]
  );

  const isAdmin = role === "admin";

  const handleSave = () => {
    onSave(role, isAdmin ? null : warehouse);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <h2 className="text-base font-semibold text-gray-900">Edit User Role</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Updating: <span className="font-medium text-gray-700">{target.username}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isSaving}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-lg hover:bg-gray-100"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">

          {/* Role selector */}
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-2">Role</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole("admin")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "admin"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <Crown size={22} className={role === "admin" ? "text-blue-600" : "text-gray-400"} />
                <span className="text-sm font-semibold">Admin</span>
                <span className="text-xs text-center leading-tight opacity-70">Full system access · No warehouse</span>
              </button>

              <button
                type="button"
                onClick={() => setRole("user")}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === "user"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 text-gray-500 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <UserIcon size={22} className={role === "user" ? "text-blue-600" : "text-gray-400"} />
                <span className="text-sm font-semibold">User</span>
                <span className="text-xs text-center leading-tight opacity-70">Branch access · Requires warehouse</span>
              </button>
            </div>
          </div>

          {/* Warehouse selector (only for users) */}
          {!isAdmin && (
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1.5">
                Warehouse <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Building2
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
                <select
                  value={warehouse}
                  onChange={(e) => setWarehouse(e.target.value)}
                  className="w-full pl-9 pr-9 py-2.5 border border-gray-200 rounded-xl text-sm text-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500/30 appearance-none bg-white"
                >
                  {WAREHOUSES.map((w) => (
                    <option key={w} value={w}>{w}</option>
                  ))}
                </select>
                <ChevronDown
                  size={14}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                />
              </div>
            </div>
          )}

          {/* Admin note */}
          {isAdmin && (
            <div className="flex items-start gap-2.5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <AlertCircle size={15} className="text-amber-500 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-amber-700">
                Admin users are not assigned to a warehouse. The warehouse will be set to <strong>null</strong>.
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-100 transition-colors"
          >
            Cancel
          </button>
          <button
            id="save-role-btn"
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSaving ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Shield size={14} />
                Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export function UserManagement() {
  const { fetchUsers, updateUserRole, user: currentUser } = useAuth();

  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // ── Fetch users ──────────────────────────────────────────────────────────
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await fetchUsers();
      setUsers(data);
    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load users");
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // ── Toast helper ─────────────────────────────────────────────────────────
  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  // ── Save role ─────────────────────────────────────────────────────────────
  const handleSaveRole = async (role: Role, warehouse: string | null) => {
    if (!editingUser) return;
    setIsSaving(true);
    const result = await updateUserRole(editingUser.id, role, warehouse);
    setIsSaving(false);

    if (result.success) {
      setUsers((prev) =>
        prev.map((u) =>
          u.id === editingUser.id ? { ...u, role, warehouse } : u
        )
      );
      setEditingUser(null);
      showToast("success", `${editingUser.username}'s role updated to ${role}.`);
    } else {
      showToast("error", result.error ?? "Failed to update role");
    }
  };

  // ── Filter ───────────────────────────────────────────────────────────────
  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      u.username.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.warehouse ?? "").toLowerCase().includes(q) ||
      u.role.toLowerCase().includes(q)
    );
  });

  const adminCount = users.filter((u) => u.role === "admin").length;
  const userCount = users.filter((u) => u.role === "user").length;

  return (
    <div className="p-4 bg-white min-h-screen">

      {/* Toast */}
      {toast && (
        <div
          className={`fixed top-4 right-4 z-[60] flex items-center gap-3 px-4 py-3 rounded-xl shadow-2xl border text-sm font-medium transition-all ${
            toast.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="text-green-600" />
          ) : (
            <AlertCircle size={16} className="text-red-500" />
          )}
          {toast.message}
        </div>
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span>
        <span>/</span>
        <span>Settings</span>
        <span>/</span>
        <span className="text-gray-900 font-medium">User Management</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">User Management</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Manage user roles and warehouse assignments
          </p>
        </div>
        <button
          id="refresh-users-btn"
          onClick={loadUsers}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 border border-gray-200 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium shadow-sm disabled:opacity-50"
        >
          <RefreshCw size={15} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
            <Users size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Total Users</p>
            <p className="text-2xl font-bold text-gray-900">{users.length}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
            <Crown size={20} className="text-purple-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Admins</p>
            <p className="text-2xl font-bold text-gray-900">{adminCount}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
            <UserIcon size={20} className="text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-500">Users</p>
            <p className="text-2xl font-bold text-gray-900">{userCount}</p>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-gray-700">All Users</h2>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
            <input
              id="user-search"
              type="text"
              placeholder="Search users…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-3 py-1.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-60"
            />
          </div>
        </div>

        {/* Loading / Error states */}
        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-gray-500 text-sm">
            <Loader2 size={20} className="animate-spin text-blue-500" />
            Loading users…
          </div>
        )}

        {!isLoading && loadError && (
          <div className="flex items-center justify-center gap-2 py-16 text-red-500 text-sm">
            <AlertCircle size={16} />
            {loadError}
          </div>
        )}

        {!isLoading && !loadError && (
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium">#</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">User</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Role</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Warehouse</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Joined</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filtered.map((u, i) => {
                const isCurrentUser = u.id === currentUser?.id;
                return (
                  <tr
                    key={u.id}
                    className={`hover:bg-gray-50 transition-colors ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    } ${isCurrentUser ? "ring-1 ring-inset ring-blue-200" : ""}`}
                  >
                    <td className="px-4 py-3 text-xs text-gray-400">{i + 1}</td>

                    {/* User */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {u.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {u.username}
                            {isCurrentUser && (
                              <span className="ml-1.5 text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-semibold">
                                You
                              </span>
                            )}
                          </p>
                        </div>
                      </div>
                    </td>

                    {/* Email */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5 text-xs text-gray-600">
                        <Mail size={12} className="text-gray-400 flex-shrink-0" />
                        {u.email}
                      </div>
                    </td>

                    {/* Role badge */}
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          u.role === "admin"
                            ? "bg-purple-100 text-purple-700"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {u.role === "admin" ? (
                          <Crown size={11} />
                        ) : (
                          <UserIcon size={11} />
                        )}
                        {u.role}
                      </span>
                    </td>

                    {/* Warehouse */}
                    <td className="px-4 py-3">
                      {u.warehouse ? (
                        <div className="flex items-center gap-1 text-xs text-gray-700">
                          <Building2 size={12} className="text-gray-400" />
                          {u.warehouse}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400 italic">— global admin</span>
                      )}
                    </td>

                    {/* Joined */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Calendar size={11} className="text-gray-400" />
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("en-ZA", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })
                          : "—"}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <button
                        id={`edit-role-btn-${u.id}`}
                        onClick={() => setEditingUser(u)}
                        disabled={isCurrentUser}
                        title={isCurrentUser ? "Cannot edit your own role" : "Edit role"}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors disabled:opacity-30 disabled:cursor-not-allowed border-blue-200 text-blue-700 hover:bg-blue-50"
                      >
                        {u.role === "admin" ? (
                          <ShieldOff size={13} />
                        ) : (
                          <Shield size={13} />
                        )}
                        Edit Role
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-gray-400 text-sm">
                    No users found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <EditRoleModal
          target={editingUser}
          onClose={() => setEditingUser(null)}
          onSave={handleSaveRole}
          isSaving={isSaving}
        />
      )}
    </div>
  );
}
