import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Users,
  Search,
  Shield,
  PlusCircle,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Loader2,
  X,
  Check,
  Lock,
  ChevronDown,
  ArrowUpDown,
  Eye,
  EyeOff,
} from "lucide-react";
import { useAuth, type User } from "../../context/AuthContext";

// ─── LocalStorage Keys ────────────────────────────────────────────────────────
const METADATA_KEY = "hal_pos_users_system_metadata";
const DELETED_USERS_KEY = "hal_pos_users_system_deleted";
const GUIDELINES_KEY = "hal_pos_permissions_guidelines";

// ─── Types ────────────────────────────────────────────────────────────────────
export type UserLevel = 1 | 2 | 3 | 4;
export type UserStatus = "Active" | "Inactive";

export interface MergedUser extends User {
  level: UserLevel;
  status: UserStatus;
}

interface UserMetadata {
  level: UserLevel;
  status: UserStatus;
}

interface GuidelinesData {
  1: string[];
  2: string[];
  3: string[];
  4: string[];
}

const DEFAULT_GUIDELINES: GuidelinesData = {
  1: [
    "Register and create new users",
    "Assign user levels (Level 2, 3, or 4)",
    "Change user levels at any time",
    "Edit user permissions and access guidelines",
    "Activate or deactivate any user",
    "Delete any user from the system",
    "View all modules and reports",
    "Access all Sales and Purchases data",
    "Manage system settings and configuration"
  ],
  2: [
    "View and create sales records",
    "Add and edit purchases",
    "View product listings",
    "Manage deliveries",
    "Access cashup listings",
    "View reports (read-only)",
    "Cannot create or modify users",
    "Cannot change user levels"
  ],
  3: [
    "View sales records (read-only)",
    "View purchase records (read-only)",
    "Access product listings",
    "View delivery status",
    "Cannot add or edit sales/purchases",
    "Cannot access reports",
    "Cannot create or modify users",
    "Cannot change user levels"
  ],
  4: [
    "View dashboard only",
    "View assigned tasks",
    "No data entry permissions",
    "Cannot access sales or purchases",
    "Cannot create or modify users",
    "Cannot change user levels"
  ]
};

// ─── Level Custom Configurations ──────────────────────────────────────────────
const LEVEL_CONFIG = {
  1: {
    label: "Level 1 – Admin",
    badgeLabel: "Admin",
    bgClass: "bg-red-50 text-red-700 border-red-200",
    dotClass: "bg-red-500",
    cardClass: "border-red-100 bg-red-50/10",
    headerBg: "bg-red-50/50",
    accentColor: "text-red-600",
    bulletColor: "text-red-500"
  },
  2: {
    label: "Level 2 – User",
    badgeLabel: "User L2",
    bgClass: "bg-blue-50 text-blue-700 border-blue-200",
    dotClass: "bg-blue-500",
    cardClass: "border-blue-100 bg-blue-50/10",
    headerBg: "bg-blue-50/50",
    accentColor: "text-blue-600",
    bulletColor: "text-blue-500"
  },
  3: {
    label: "Level 3 – User",
    badgeLabel: "User L3",
    bgClass: "bg-emerald-50 text-emerald-700 border-emerald-200",
    dotClass: "bg-emerald-500",
    cardClass: "border-emerald-100 bg-emerald-50/10",
    headerBg: "bg-emerald-50/50",
    accentColor: "text-emerald-600",
    bulletColor: "text-emerald-500"
  },
  4: {
    label: "Level 4 – User",
    badgeLabel: "User L4",
    bgClass: "bg-amber-50 text-amber-700 border-amber-200",
    dotClass: "bg-amber-500",
    cardClass: "border-amber-100 bg-amber-50/10",
    headerBg: "bg-amber-50/50",
    accentColor: "text-amber-600",
    bulletColor: "text-amber-500"
  }
};

export function UserManagementSystem() {
  const { fetchUsers, register, user: currentUser } = useAuth();

  // ── States ──────────────────────────────────────────────────────────────────
  const [users, setUsers] = useState<User[]>([]);
  const [metadataMap, setMetadataMap] = useState<Record<number, UserMetadata>>({});
  const [deletedUserIds, setDeletedUserIds] = useState<number[]>([]);
  const [guidelines, setGuidelines] = useState<GuidelinesData>(DEFAULT_GUIDELINES);

  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Search, Filters & Sorting
  const [searchQuery, setSearchQuery] = useState("");
  const [levelFilter, setLevelFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLevelModal, setShowLevelModal] = useState<MergedUser | null>(null);
  const [isEditingGuidelines, setIsEditingGuidelines] = useState(false);

  // Form Fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState<UserLevel>(2);

  // Guidelines Editable States
  const [editedGuidelines, setEditedGuidelines] = useState<GuidelinesData>(DEFAULT_GUIDELINES);

  // Current user's Level is derived: admin role = Level 1, otherwise retrieved from metadata
  const currentUserLevel: UserLevel = useMemo(() => {
    if (currentUser?.role === "admin") return 1;
    if (currentUser && metadataMap[currentUser.id]) {
      return metadataMap[currentUser.id].level;
    }
    return 2; // Default
  }, [currentUser, metadataMap]);

  const isAdmin = currentUserLevel === 1;

  // ── Load Data ───────────────────────────────────────────────────────────────
  const loadData = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await fetchUsers();
      setUsers(data);

      // Load Metadata from localStorage
      const storedMetadata = localStorage.getItem(METADATA_KEY);
      const metadata = storedMetadata ? JSON.parse(storedMetadata) : {};

      // Load Deleted Users
      const storedDeleted = localStorage.getItem(DELETED_USERS_KEY);
      const deletedIds = storedDeleted ? JSON.parse(storedDeleted) : [];
      setDeletedUserIds(deletedIds);

      // Load Guidelines
      const storedGuidelines = localStorage.getItem(GUIDELINES_KEY);
      const guidelinesData = storedGuidelines ? JSON.parse(storedGuidelines) : DEFAULT_GUIDELINES;
      setGuidelines(guidelinesData);
      setEditedGuidelines(guidelinesData);

      // Check for missing metadata and set defaults
      const updatedMetadata = { ...metadata };
      let updated = false;

      data.forEach((u) => {
        if (!updatedMetadata[u.id]) {
          updatedMetadata[u.id] = {
            level: u.role === "admin" ? 1 : 2,
            status: "Active"
          };
          updated = true;
        }
      });

      if (updated || !storedMetadata) {
        localStorage.setItem(METADATA_KEY, JSON.stringify(updatedMetadata));
      }
      setMetadataMap(updatedMetadata);

    } catch (err: unknown) {
      setLoadError(err instanceof Error ? err.message : "Failed to load users data");
    } finally {
      setIsLoading(false);
    }
  }, [fetchUsers]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Helpers ─────────────────────────────────────────────────────────────────
  const showToastMsg = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const saveMetadata = (newMap: Record<number, UserMetadata>) => {
    setMetadataMap(newMap);
    localStorage.setItem(METADATA_KEY, JSON.stringify(newMap));
  };

  // ── Admin Actions ───────────────────────────────────────────────────────────
  const handleToggleStatus = (userId: number) => {
    if (!isAdmin) return;
    if (userId === currentUser?.id) {
      showToastMsg("error", "You cannot deactivate your own account.");
      return;
    }
    const currentMeta = metadataMap[userId];
    const newStatus: UserStatus = currentMeta.status === "Active" ? "Inactive" : "Active";
    const updated = {
      ...metadataMap,
      [userId]: { ...currentMeta, status: newStatus }
    };
    saveMetadata(updated);
    showToastMsg("success", `User status updated to ${newStatus}.`);
  };

  const handleChangeLevel = (userId: number, newLevel: UserLevel) => {
    if (!isAdmin) return;
    if (userId === currentUser?.id) {
      showToastMsg("error", "You cannot change your own user level.");
      return;
    }
    const currentMeta = metadataMap[userId];
    const updated = {
      ...metadataMap,
      [userId]: { ...currentMeta, level: newLevel }
    };
    saveMetadata(updated);
    setShowLevelModal(null);
    showToastMsg("success", `User level updated to Level ${newLevel}.`);
  };

  const handleDeleteUser = (userId: number, username: string) => {
    if (!isAdmin) return;
    if (userId === currentUser?.id) {
      showToastMsg("error", "You cannot delete your own account.");
      return;
    }
    if (window.confirm(`Are you sure you want to delete user "${username}" from the system?`)) {
      const updatedDeleted = [...deletedUserIds, userId];
      setDeletedUserIds(updatedDeleted);
      localStorage.setItem(DELETED_USERS_KEY, JSON.stringify(updatedDeleted));
      showToastMsg("success", `User ${username} deleted successfully.`);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdmin) return;
    if (!fullName.trim() || !email.trim() || !password.trim()) {
      showToastMsg("error", "Please fill in all fields.");
      return;
    }
    if (password.length < 12) {
      showToastMsg("error", "Password must be at least 12 characters long.");
      return;
    }

    setIsRegistering(true);
    try {
      const result = await register({
        username: fullName.trim(),
        email: email.trim(),
        password: password,
        warehouse: "HEAD OFFICE"
      });

      if (result.success) {
        // Re-load to get the user ID
        const data = await fetchUsers();
        setUsers(data);

        // Find the new user and assign level
        const newUser = data.find(u => u.email === email.trim());
        if (newUser) {
          const updated = {
            ...metadataMap,
            [newUser.id]: {
              level: selectedLevel,
              status: "Active" as UserStatus
            }
          };
          saveMetadata(updated);
        }

        showToastMsg("success", `User ${fullName} registered successfully.`);
        // Reset Form
        setFullName("");
        setEmail("");
        setPassword("");
        setShowPassword(false);
        setSelectedLevel(2);
        setShowCreateModal(false);
      } else {
        showToastMsg("error", result.error ?? "Failed to create user.");
      }
    } catch (err: any) {
      showToastMsg("error", err.message || "An error occurred.");
    } finally {
      setIsRegistering(false);
    }
  };

  // Guidelines Save
  const handleSaveGuidelines = () => {
    setGuidelines(editedGuidelines);
    localStorage.setItem(GUIDELINES_KEY, JSON.stringify(editedGuidelines));
    setIsEditingGuidelines(false);
    showToastMsg("success", "Roles & Permissions guidelines saved successfully.");
  };

  // ── Data Computations ────────────────────────────────────────────────────────
  const mergedUsers = useMemo(() => {
    return users
      .filter(u => !deletedUserIds.includes(u.id))
      .map(u => {
        const meta = metadataMap[u.id] || { level: u.role === "admin" ? 1 : 2, status: "Active" as UserStatus };
        return {
          ...u,
          level: meta.level,
          status: meta.status
        };
      });
  }, [users, metadataMap, deletedUserIds]);

  const counts = useMemo(() => {
    const res = { 1: 0, 2: 0, 3: 0, 4: 0 };
    mergedUsers.forEach(u => {
      res[u.level] = (res[u.level] || 0) + 1;
    });
    return res;
  }, [mergedUsers]);

  // Filtered and Sorted Users
  const filteredUsers = useMemo(() => {
    return mergedUsers
      .filter(u => {
        const query = searchQuery.toLowerCase();
        const matchesSearch = u.username.toLowerCase().includes(query) || u.email.toLowerCase().includes(query);
        const matchesLevel = levelFilter === "all" || u.level.toString() === levelFilter;
        const matchesStatus = statusFilter === "all" || u.status === statusFilter;
        return matchesSearch && matchesLevel && matchesStatus;
      })
      .sort((a, b) => {
        let valA: any = a.username;
        let valB: any = b.username;

        if (sortBy === "email") {
          valA = a.email;
          valB = b.email;
        } else if (sortBy === "level") {
          valA = a.level;
          valB = b.level;
        } else if (sortBy === "status") {
          valA = a.status;
          valB = b.status;
        } else if (sortBy === "created") {
          valA = a.created_at || "";
          valB = b.created_at || "";
        }

        if (valA < valB) return sortOrder === "asc" ? -1 : 1;
        if (valA > valB) return sortOrder === "asc" ? 1 : -1;
        return 0;
      });
  }, [mergedUsers, searchQuery, levelFilter, statusFilter, sortBy, sortOrder]);

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("asc");
    }
  };

  return (
    <div className="p-6 bg-[#f8fafc] min-h-screen">
      {/* Toast Alert */}
      {toast && (
        <div
          className={`fixed top-6 right-6 z-[60] flex items-center gap-3 px-4 py-3.5 rounded-xl shadow-2xl border text-sm font-medium transition-all ${toast.type === "success"
            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
            : "bg-rose-50 border-rose-200 text-rose-800"
            }`}
        >
          {toast.type === "success" ? (
            <CheckCircle2 size={16} className="text-emerald-600" />
          ) : (
            <AlertCircle size={16} className="text-rose-500" />
          )}
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">User Management System</h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage users, roles, and access permissions
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all shadow-lg shadow-blue-500/20"
          >
            <PlusCircle size={16} />
            Create New User
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {(Object.keys(LEVEL_CONFIG) as unknown as UserLevel[]).map((levelNum) => {
          const cfg = LEVEL_CONFIG[levelNum];
          return (
            <div
              key={levelNum}
              className="bg-white border border-gray-200 rounded-2xl p-5 flex items-center justify-between shadow-sm"
            >
              <div>
                <p className="text-sm text-gray-500 mb-1">Level {levelNum}</p>
                <p className={`text-2xl font-bold ${cfg.accentColor}`}>{counts[levelNum] || 0}</p>
              </div>
              <span className={`px-3 py-1 text-xs font-semibold rounded-full border ${cfg.bgClass}`}>
                {cfg.badgeLabel}
              </span>
            </div>
          );
        })}
      </div>

      {/* Section 1: User List Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm overflow-hidden mb-8">
        <div className="p-5 border-b border-gray-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <h2 className="text-base font-bold text-gray-800">User List</h2>
          <div className="flex flex-wrap items-center gap-3">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 pr-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 w-full sm:w-64"
              />
            </div>
            {/* Filters */}
            <select
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="all">All Levels</option>
              <option value="1">Level 1 (Admin)</option>
              <option value="2">Level 2</option>
              <option value="3">Level 3</option>
              <option value="4">Level 4</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
            >
              <option value="all">All Status</option>
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
          </div>
        </div>

        {/* Loading / Error States */}
        {isLoading && (
          <div className="flex flex-col items-center justify-center py-20 text-gray-500">
            <Loader2 size={32} className="animate-spin text-blue-500 mb-2" />
            <p className="text-sm font-medium">Loading user list...</p>
          </div>
        )}

        {!isLoading && loadError && (
          <div className="flex flex-col items-center justify-center py-16 text-rose-500">
            <AlertCircle size={32} className="mb-2" />
            <p className="text-sm font-semibold">{loadError}</p>
            <button
              onClick={loadData}
              className="mt-4 px-4 py-2 text-xs font-semibold bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {!isLoading && !loadError && (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th
                    onClick={() => toggleSort("name")}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      User Name
                      <ArrowUpDown size={12} className="text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("email")}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Email
                      <ArrowUpDown size={12} className="text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("level")}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Level
                      <ArrowUpDown size={12} className="text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("status")}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Status
                      <ArrowUpDown size={12} className="text-gray-400" />
                    </div>
                  </th>
                  <th
                    onClick={() => toggleSort("created")}
                    className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100/50 transition-colors"
                  >
                    <div className="flex items-center gap-1.5">
                      Created Date
                      <ArrowUpDown size={12} className="text-gray-400" />
                    </div>
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredUsers.map((u) => {
                  const isCurrentUser = u.id === currentUser?.id;
                  const cfg = LEVEL_CONFIG[u.level as UserLevel];
                  const initials = u.username.split(/\s+/).map(n => n[0]).join("").slice(0, 2).toUpperCase();

                  return (
                    <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                      {/* Name */}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                            {initials || "U"}
                          </div>
                          <div>
                            <span className="text-sm font-semibold text-gray-800">{u.username}</span>
                            {isCurrentUser && (
                              <span className="ml-2 px-1.5 py-0.5 text-[9px] bg-blue-100 text-blue-700 font-bold rounded">
                                You
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.email}
                      </td>

                      {/* Level */}
                      <td className="px-6 py-4">
                        <span className={`inline-flex px-2.5 py-0.5 text-xs font-bold rounded-full border ${cfg.bgClass}`}>
                          {cfg.badgeLabel}
                        </span>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold border ${u.status === "Active"
                            ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                            : "bg-gray-50 border-gray-200 text-gray-500"
                            }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${u.status === "Active" ? "bg-emerald-500" : "bg-gray-400"}`} />
                          {u.status}
                        </span>
                      </td>

                      {/* Created Date */}
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {u.created_at
                          ? new Date(u.created_at).toLocaleDateString("en-ZA", {
                            year: "numeric",
                            month: "2-digit",
                            day: "2-digit",
                          })
                          : "—"}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-gray-400">
                        {isAdmin ? (
                          <div className="flex items-center gap-3">
                            {/* Change Level */}
                            <button
                              onClick={() => setShowLevelModal(u)}
                              disabled={isCurrentUser}
                              className="hover:text-blue-600 disabled:opacity-20 disabled:hover:text-gray-400 transition-colors p-1"
                              title="Change Level"
                            >
                              <Edit2 size={16} />
                            </button>
                            {/* Status toggle */}
                            <button
                              onClick={() => handleToggleStatus(u.id)}
                              disabled={isCurrentUser}
                              className="hover:text-teal-600 disabled:opacity-20 disabled:hover:text-gray-400 transition-colors p-1"
                              title={u.status === "Active" ? "Deactivate User" : "Activate User"}
                            >
                              {u.status === "Active" ? <UserX size={16} /> : <UserCheck size={16} />}
                            </button>
                            {/* Delete */}
                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={isCurrentUser}
                              className="hover:text-rose-600 disabled:opacity-20 disabled:hover:text-gray-400 transition-colors p-1"
                              title="Delete User"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ) : (
                          <span title="Admin access required">
                            <Lock size={15} className="text-gray-300" />
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}

                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-400 font-medium">
                      No matching users found in the system
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 3: Roles & Permissions Guidelines */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Shield className="text-blue-600" size={20} />
            <div>
              <h2 className="text-base font-bold text-gray-800">Roles & Permissions Guidelines</h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Overview of what each user level can access and perform within the system.
              </p>
            </div>
          </div>
          {isAdmin && (
            <button
              onClick={() => {
                if (isEditingGuidelines) {
                  handleSaveGuidelines();
                } else {
                  setEditedGuidelines({ ...guidelines });
                  setIsEditingGuidelines(true);
                }
              }}
              className={`flex items-center justify-center gap-1.5 px-4 py-2 border rounded-xl text-xs font-bold transition-all shadow-sm ${isEditingGuidelines
                ? "bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-600"
                : "bg-white hover:bg-gray-50 border-gray-200 text-gray-700"
                }`}
            >
              {isEditingGuidelines ? (
                <>
                  <CheckCircle2 size={14} />
                  Save Guidelines
                </>
              ) : (
                <>
                  <Edit2 size={13} />
                  Edit Guidelines
                </>
              )}
            </button>
          )}
        </div>

        {/* Guidelines Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {(Object.keys(LEVEL_CONFIG) as unknown as UserLevel[]).map((levelNum) => {
            const cfg = LEVEL_CONFIG[levelNum];
            return (
              <div
                key={levelNum}
                className={`border rounded-2xl overflow-hidden transition-all shadow-sm ${cfg.cardClass}`}
              >
                <div className={`px-4 py-3 border-b flex items-center justify-between border-inherit ${cfg.headerBg}`}>
                  <span className={`text-sm font-bold ${cfg.accentColor}`}>
                    {cfg.label}
                  </span>
                </div>
                <div className="p-5">
                  {isEditingGuidelines ? (
                    <textarea
                      value={editedGuidelines[levelNum].join("\n")}
                      onChange={(e) => {
                        const val = e.target.value;
                        setEditedGuidelines(prev => ({
                          ...prev,
                          [levelNum]: val.split("\n")
                        }));
                      }}
                      rows={10}
                      className="w-full px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                      placeholder="Enter each guideline on a new line..."
                    />
                  ) : (
                    <ul className="space-y-3">
                      {guidelines[levelNum]
                        .filter(bullet => bullet.trim() !== "")
                        .map((bullet, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-xs text-gray-600 leading-normal">
                            <Check size={14} className={`flex-shrink-0 mt-0.5 ${cfg.bulletColor}`} />
                            <span>{bullet}</span>
                          </li>
                        ))}
                    </ul>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Permission Comparison Matrix Table */}
      <div className="bg-white border border-gray-100 rounded-2xl shadow-sm p-6 overflow-hidden">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Permission Matrix</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="px-5 py-3 font-semibold text-gray-500">Permission</th>
                <th className="px-5 py-3 font-semibold text-center text-red-500">L1</th>
                <th className="px-5 py-3 font-semibold text-center text-blue-500">L2</th>
                <th className="px-5 py-3 font-semibold text-center text-emerald-500">L3</th>
                <th className="px-5 py-3 font-semibold text-center text-amber-500">L4</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {[
                { label: "Create/manage users", l1: true, l2: false, l3: false, l4: false },
                { label: "Assign user levels", l1: true, l2: false, l3: false, l4: false },
                { label: "Edit permissions", l1: true, l2: false, l3: false, l4: false },
                { label: "View Sales data", l1: true, l2: true, l3: true, l4: false },
                { label: "Add/Edit Sales", l1: true, l2: true, l3: false, l4: false },
                { label: "View Purchases data", l1: true, l2: true, l3: true, l4: false },
                { label: "Add/Edit Purchases", l1: true, l2: true, l3: false, l4: false },
                { label: "View Reports", l1: true, l2: true, l3: false, l4: false },
                { label: "System Settings", l1: true, l2: false, l3: false, l4: false },
                { label: "View Dashboard", l1: true, l2: true, l3: true, l4: true },
              ].map((row, idx) => (
                <tr key={idx} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-gray-700">{row.label}</td>
                  <td className="px-5 py-3.5 text-center">
                    {row.l1 ? (
                      <Check className="text-emerald-500 mx-auto" size={14} />
                    ) : (
                      <X className="text-gray-300 mx-auto" size={14} />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.l2 ? (
                      <Check className="text-emerald-500 mx-auto" size={14} />
                    ) : (
                      <X className="text-gray-300 mx-auto" size={14} />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.l3 ? (
                      <Check className="text-emerald-500 mx-auto" size={14} />
                    ) : (
                      <X className="text-gray-300 mx-auto" size={14} />
                    )}
                  </td>
                  <td className="px-5 py-3.5 text-center">
                    {row.l4 ? (
                      <Check className="text-emerald-500 mx-auto" size={14} />
                    ) : (
                      <X className="text-gray-300 mx-auto" size={14} />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── MODAL: Create New User ──────────────────────────────────────────────── */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md overflow-hidden shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Create New User</h3>
                <p className="text-xs text-gray-500 mt-0.5">Register a new user and assign a level</p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Form */}
            <form onSubmit={handleCreateUser}>
              <div className="p-6 space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="E.g. John Doe"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  />
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">Email Address</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="E.g. john@halpos.com"
                    className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  />
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                    Password
                    <span className="text-red-500 ml-0.5">*</span>
                    <span className="ml-2 text-[10px] font-normal text-gray-400">(min. 12 characters)</span>
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Min. 12 characters"
                      className={`w-full px-4 py-2.5 pr-10 border rounded-xl text-sm focus:outline-none focus:ring-2 bg-white transition-colors ${password.length > 0 && password.length < 12
                        ? "border-red-300 focus:ring-red-500/20"
                        : "border-gray-200 focus:ring-blue-500/20"
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    >
                      {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                    </button>
                  </div>
                  {/* Strength bar */}
                  {password.length > 0 && (
                    <div className="mt-2">
                      <div className="flex gap-1 mb-1">
                        {[1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className={`h-1 flex-1 rounded-full transition-all ${password.length >= i * 3
                              ? password.length < 12
                                ? "bg-red-400"
                                : password.length < 16
                                  ? "bg-amber-400"
                                  : "bg-emerald-500"
                              : "bg-gray-200"
                              }`}
                          />
                        ))}
                      </div>
                      <p className={`text-[10px] font-medium ${password.length < 12 ? "text-red-500" : "text-emerald-600"
                        }`}>
                        {password.length < 12
                          ? `${12 - password.length} more character${12 - password.length !== 1 ? "s" : ""} needed`
                          : "Password meets minimum requirement ✓"}
                      </p>
                    </div>
                  )}
                </div>

                {/* Level */}
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1.5">User Level</label>
                  <select
                    value={selectedLevel}
                    onChange={(e) => setSelectedLevel(Number(e.target.value) as UserLevel)}
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 bg-white"
                  >
                    <option value={2}>Level 2 – User (L2)</option>
                    <option value={3}>Level 3 – User (L3)</option>
                    <option value={4}>Level 4 – User (L4)</option>
                  </select>
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  disabled={isRegistering}
                  className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering}
                  className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold transition-all disabled:opacity-50"
                >
                  {isRegistering ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Creating...
                    </>
                  ) : (
                    "Create User"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL: Change User Level ────────────────────────────────────────────── */}
      {showLevelModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-white rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl border border-gray-100">
            {/* Header */}
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-gray-900">Change User Level</h3>
                <p className="text-xs text-gray-500 mt-0.5">Target: <span className="font-semibold text-gray-800">{showLevelModal.username}</span></p>
              </div>
              <button
                onClick={() => setShowLevelModal(null)}
                className="p-1 hover:bg-gray-200 text-gray-400 hover:text-gray-600 rounded-lg transition-all"
              >
                <X size={18} />
              </button>
            </div>

            {/* Options */}
            <div className="p-6 space-y-3">
              {([2, 3, 4] as UserLevel[]).map((levelNum) => {
                const cfg = LEVEL_CONFIG[levelNum];
                const isCurrent = showLevelModal.level === levelNum;
                return (
                  <button
                    key={levelNum}
                    onClick={() => handleChangeLevel(showLevelModal.id, levelNum)}
                    className={`w-full p-4 rounded-xl border-2 flex items-center justify-between text-left transition-all ${isCurrent
                      ? "border-blue-500 bg-blue-50 text-blue-700"
                      : "border-gray-100 text-gray-600 hover:border-gray-200 hover:bg-gray-50/50"
                      }`}
                  >
                    <div>
                      <p className="text-sm font-bold">{cfg.label}</p>
                      <p className="text-xs opacity-70 mt-0.5">{cfg.badgeLabel} permissions</p>
                    </div>
                    {isCurrent && <Check size={18} className="text-blue-600 flex-shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Footer */}
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setShowLevelModal(null)}
                className="px-4 py-2 text-sm font-semibold border border-gray-200 rounded-xl text-gray-600 hover:bg-gray-100 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
