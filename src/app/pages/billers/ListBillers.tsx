import {
    AlertTriangle,
    ChevronLeft,
    ChevronRight,
    Mail,
    MapPin,
    Phone,
    PlusCircle,
    Trash2,
    UserCheck,
    XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { deleteBiller, getBillers } from "../../services/inventoryService";
import type { BillerOut } from "../../types/inventory";

export function ListBillers() {
  const { isAdmin } = useAuth();

  // API States
  const [billers, setBillers] = useState<BillerOut[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  // Filter/Search States
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<BillerOut | null>(null);
  const [viewBiller, setViewBiller] = useState<BillerOut | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    setError("");
    try {
      const res = await getBillers({
        page: currentPage,
        limit: pageSize,
        search: search || undefined,
        status: statusFilter,
      });
      setBillers(res.billers ?? []);
      setTotal(res.total ?? 0);
      setTotalPages(res.total_pages ?? 1);
    } catch (e) {
      console.error("Failed to load billers list:", e);
      setError(
        e instanceof Error ? e.message : "Failed to load billers."
      );
      setBillers([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter]);

  useEffect(() => {
    const t = setTimeout(() => {
      setCurrentPage(1);
      loadData();
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteBiller(deleteTarget.id);
      setDeleteTarget(null);
      loadData();
    } catch (e) {
      console.error("Failed to delete biller:", e);
      setError(e instanceof Error ? e.message : "Failed to delete biller.");
      setDeleteTarget(null);
    }
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span>People</span><span>/</span>
        <span className="text-gray-900 font-medium">List Biller</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Billers</h1>
          <p className="text-sm text-gray-500 mt-0.5">Browse and manage all biller profiles</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 border border-gray-200 bg-white rounded-lg hover:bg-gray-50 transition-colors text-sm text-gray-600"
          >
            Refresh
          </button>
          {isAdmin && (
            <a
              href="/billers/add"
              id="go-to-add-biller"
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
            >
              <PlusCircle size={15} /> Add Biller
            </a>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex flex-wrap items-center gap-3">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by company, name, or email..."
          className="flex-1 min-w-48 px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 bg-white"
        >
          <option value="All">All Statuses</option>
          <option value="Active">Active</option>
          <option value="Inactive">Inactive</option>
        </select>
      </div>

      {/* Error display */}
      {error && (
        <div className="flex items-center gap-3 p-4 mb-4 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <AlertTriangle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={loadData} className="ml-auto underline text-xs shrink-0">
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-max">
            <thead className="bg-blue-600 text-white">
              <tr>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">Company</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">Contact Name</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">Email</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">Phone</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">City</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">Country</th>
                <th className="px-4 py-2.5 text-center text-xs font-medium whitespace-nowrap">Status</th>
                <th className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-32" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-24" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-32" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-20" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-100 rounded w-16" /></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-100 rounded w-12 mx-auto" /></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-100 rounded w-12" /></td>
                  </tr>
                ))
              ) : billers.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-4 py-16 text-center">
                    <UserCheck size={40} className="text-gray-200 mx-auto mb-3" />
                    <p className="text-gray-400 text-sm">
                      {error ? "No billers to display yet." : "No billers found matching your filters"}
                    </p>
                  </td>
                </tr>
              ) : (
                billers.map((s, i) => (
                  <tr
                    key={s.id}
                    onClick={() => setViewBiller(s)}
                    className={`cursor-pointer hover:bg-blue-50/30 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}
                  >
                    <td className="px-4 py-3">
                      <p className="text-sm font-medium text-gray-900">{s.company}</p>
                      {s.vatNumber && (
                        <p className="text-xs text-gray-500 font-mono bg-gray-100/80 inline-block px-1 rounded mt-0.5">
                          VAT: {s.vatNumber}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.phone}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.city}</td>
                    <td className="px-4 py-3 text-sm text-gray-700">{s.country || "—"}</td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          s.status === "Inactive"
                            ? "bg-gray-100 text-gray-600"
                            : "bg-green-100 text-green-700"
                        }`}
                      >
                        {s.status || "Active"}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        {isAdmin && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteTarget(s);
                            }}
                            className="p-1.5 rounded hover:bg-red-50 text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between bg-gray-50/50">
          <p className="text-xs text-gray-500">
            Showing {billers.length === 0 ? 0 : (currentPage - 1) * pageSize + 1} to{" "}
            {Math.min(total, currentPage * pageSize)} of {total} billers
          </p>
          <div className="flex items-center gap-1">
            <button
              disabled={currentPage === 1}
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors disabled:opacity-40"
            >
              <ChevronLeft size={14} />
            </button>
            <span className="text-xs font-medium px-3">
              Page {currentPage} of {totalPages}
            </span>
            <button
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors disabled:opacity-40"
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* View Biller Modal */}
      {viewBiller && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
            <div className="flex items-center justify-between p-5 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">Biller Details</h2>
              <button onClick={() => setViewBiller(null)} className="text-gray-400 hover:text-gray-600">
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-5 space-y-3">
              <div className="flex items-center gap-3 pb-3 border-b border-gray-100">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                  <UserCheck size={24} className="text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-gray-900 text-sm">{viewBiller.company}</p>
                  <p className="text-xs text-gray-500">{viewBiller.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Mail size={14} className="text-gray-400" /> {viewBiller.email}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <Phone size={14} className="text-gray-400" /> {viewBiller.phone}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <MapPin size={14} className="text-gray-400" />
                {[viewBiller.address, viewBiller.city, viewBiller.state, viewBiller.postalCode, viewBiller.country]
                  .filter(Boolean)
                  .join(", ")}
              </div>
              {viewBiller.vatNumber && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">VAT Number</span>
                  <span className="font-medium text-gray-900">{viewBiller.vatNumber}</span>
                </div>
              )}
              {viewBiller.customField1 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Custom Field</span>
                  <span className="font-medium text-gray-900">{viewBiller.customField1}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Status</span>
                <span className="font-medium text-gray-900">{viewBiller.status || "Active"}</span>
              </div>
            </div>
            <div className="p-5 border-t border-gray-100">
              <button
                onClick={() => setViewBiller(null)}
                className="w-full py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg w-full max-w-sm">
            <div className="p-6">
              <div className="flex items-center justify-between mb-4 pb-3 border-b">
                <h2 className="text-base font-semibold text-gray-900">Confirm Delete</h2>
                <button onClick={() => setDeleteTarget(null)} className="text-gray-400 hover:text-gray-600">
                  <XCircle size={20} />
                </button>
              </div>
              <div className="mb-6">
                <p className="text-sm text-gray-700">
                  Are you sure you want to delete biller <span className="font-semibold">{deleteTarget.company}</span>?
                </p>
              </div>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setDeleteTarget(null)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
                >
                  No
                </button>
                <button
                  onClick={handleDelete}
                  className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
                >
                  Yes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
