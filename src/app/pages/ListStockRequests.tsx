import {
  AlertTriangle,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Eye,
  Loader2,
  PackageSearch,
  Plus,
  RefreshCw,
  Search,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import { useAuth } from "../context/AuthContext";
import {
  getStockRequest,
  getStockRequests,
  updateStockRequestStatus,
} from "../services/inventoryService";
import type { StockRequest, StockRequestStatus } from "../types/inventory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const STATUS_STYLES: Record<StockRequestStatus, { badge: string; dot: string }> = {
  Pending: { badge: "bg-amber-100 text-amber-700", dot: "bg-amber-500" },
  Approved: { badge: "bg-blue-100 text-blue-700", dot: "bg-blue-500" },
  Rejected: { badge: "bg-red-100 text-red-600", dot: "bg-red-400" },
  "Transfer Created": { badge: "bg-indigo-100 text-indigo-700", dot: "bg-indigo-500" },
  "In Transit": { badge: "bg-purple-100 text-purple-700", dot: "bg-purple-500" },
  Delivered: { badge: "bg-green-100 text-green-700", dot: "bg-green-500" },
  Cancelled: { badge: "bg-gray-100 text-gray-600", dot: "bg-gray-400" },
};

function StatusBadge({ status }: { status: StockRequestStatus }) {
  const s = STATUS_STYLES[status] ?? STATUS_STYLES["Pending"];
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${s.badge}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot}`} />
      {status}
    </span>
  );
}

// ─── Detail Modal ─────────────────────────────────────────────────────────────

interface DetailModalProps {
  requestId: number;
  isAdmin: boolean;
  onClose: () => void;
  onStatusChanged: () => void;
}

function DetailModal({ requestId, isAdmin, onClose, onStatusChanged }: DetailModalProps) {
  const [req, setReq] = useState<StockRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [toast, setToast] = useState("");

  useEffect(() => {
    setLoading(true);
    getStockRequest(requestId)
      .then(setReq)
      .catch(() => setToast("Failed to load request details."))
      .finally(() => setLoading(false));
  }, [requestId]);

  const handleAction = async (status: "Approved" | "Rejected") => {
    if (!req) return;
    setActionLoading(true);
    try {
      await updateStockRequestStatus(req.id, { status, remarks: remarks || undefined });
      setToast(`Request ${status.toLowerCase()} successfully.`);
      setTimeout(() => {
        onStatusChanged();
        onClose();
      }, 900);
    } catch (e) {
      setToast(e instanceof Error ? e.message : "Action failed.");
    } finally {
      setActionLoading(false);
    }
  };

  const canAction = isAdmin && req?.status === "Pending";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50">
          <div>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wide">Stock Request</p>
            <h2 className="text-base font-bold text-gray-900 mt-0.5">
              {loading ? "Loading…" : req?.request_number ?? `#${requestId}`}
            </h2>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 size={28} className="text-blue-500 animate-spin" />
            </div>
          ) : !req ? (
            <p className="text-sm text-red-500 text-center py-8">Could not load request.</p>
          ) : (
            <div className="space-y-4">
              {/* Meta */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Store</p>
                  <p className="text-sm font-semibold text-gray-900">{req.store_name ?? `Store #${req.store_id}`}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Status</p>
                  <StatusBadge status={req.status} />
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Purchased By</p>
                  <p className="text-sm font-semibold text-gray-900">{req.requested_by ?? `User #${req.requested_by_id}`}</p>
                </div>
                <div className="bg-gray-50 rounded-xl p-3">
                  <p className="text-xs text-gray-500 mb-0.5">Submitted</p>
                  <p className="text-sm font-semibold text-gray-900">{fmtDate(req.created_at)}</p>
                </div>
              </div>

              {/* Remarks */}
              {req.remarks && (
                <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
                  <p className="text-xs font-medium text-amber-700 mb-0.5">Remarks</p>
                  <p className="text-sm text-amber-900">{req.remarks}</p>
                </div>
              )}

              {/* Transfer link */}
              {req.transfer_id && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-3 flex items-center gap-2">
                  <PackageSearch size={16} className="text-indigo-500 shrink-0" />
                  <p className="text-sm text-indigo-700">Linked to Transfer <span className="font-bold">#{req.transfer_id}</span></p>
                </div>
              )}

              {/* Items table */}
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Requested Items</p>
                <div className="rounded-xl border border-gray-100 overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">SKU</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-500">Product</th>
                        <th className="px-3 py-2 text-right text-xs font-semibold text-gray-500">Qty</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50">
                      {req.items.length === 0 ? (
                        <tr><td colSpan={3} className="px-3 py-4 text-center text-gray-400 text-xs">No items</td></tr>
                      ) : req.items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-3 py-2.5">
                            <span className="text-xs font-mono bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded">{item.sku}</span>
                          </td>
                          <td className="px-3 py-2.5 text-gray-700 font-medium text-xs">{item.product_name || item.sku}</td>
                          <td className="px-3 py-2.5 text-right font-bold text-gray-900">{item.quantity}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Reject form */}
              {showRejectForm && (
                <div className="bg-red-50 border border-red-100 rounded-xl p-4 space-y-2">
                  <p className="text-xs font-semibold text-red-700">Reason for rejection (optional)</p>
                  <textarea
                    rows={3}
                    value={remarks}
                    onChange={(e) => setRemarks(e.target.value)}
                    placeholder="Enter rejection reason..."
                    className="w-full text-sm px-3 py-2 border border-red-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300/50 resize-none"
                  />
                </div>
              )}

              {toast && (
                <div className={`text-sm px-3 py-2 rounded-lg font-medium ${toast.includes("success") ? "bg-green-50 text-green-700" : "bg-red-50 text-red-600"}`}>
                  {toast}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer actions */}
        {canAction && !loading && (
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex items-center justify-end gap-2">
            {!showRejectForm ? (
              <>
                <button
                  onClick={() => setShowRejectForm(true)}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                >
                  <X size={14} /> Reject
                </button>
                <button
                  onClick={() => handleAction("Approved")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-green-600 text-white text-sm font-semibold hover:bg-green-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                  Approve
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={() => { setShowRejectForm(false); setRemarks(""); }}
                  disabled={actionLoading}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-gray-600 text-sm hover:bg-gray-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleAction("Rejected")}
                  disabled={actionLoading}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-lg bg-red-600 text-white text-sm font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 size={14} className="animate-spin" /> : <X size={14} />}
                  Confirm Reject
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

const STATUS_FILTERS: Array<{ label: string; value: string }> = [
  { label: "All", value: "" },
  { label: "Pending", value: "Pending" },
  { label: "Approved", value: "Approved" },
  { label: "Rejected", value: "Rejected" },
  { label: "Transfer Created", value: "Transfer Created" },
  { label: "In Transit", value: "In Transit" },
  { label: "Delivered", value: "Delivered" },
  { label: "Cancelled", value: "Cancelled" },
];

export function ListStockRequests() {
  const { isAdmin, isStoreManager, user } = useAuth();

  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [page, setPage] = useState(1);
  const LIMIT = 20;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [selectedId, setSelectedId] = useState<number | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: { status?: string; storeId?: number; page: number; limit: number } = {
        page,
        limit: LIMIT,
      };
      if (statusFilter) params.status = statusFilter;
      // Store managers are automatically scoped by the backend
      const result = await getStockRequests(params);
      // Client-side search filter (request_number / store_name)
      const q = debouncedSearch.toLowerCase();
      const filtered = q
        ? result.requests.filter(
          (r) =>
            r.request_number.toLowerCase().includes(q) ||
            (r.store_name ?? "").toLowerCase().includes(q) ||
            (r.requested_by ?? "").toLowerCase().includes(q)
        )
        : result.requests;
      setRequests(filtered);
      setTotal(result.total);
      setTotalPages(result.totalPages);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load stock requests.");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  // Debounce search
  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 350);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const canCreate = isStoreManager && !!user?.storeId;

  return (
    <div className="min-h-screen bg-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ClipboardList size={22} className="text-blue-600" />
            Stock Requests
          </h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {isAdmin
              ? "Review and manage stock requests from all stores"
              : "Your store's stock requests"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={load}
            className="p-2 rounded-lg border border-gray-200 text-gray-500 hover:text-gray-800 hover:bg-gray-50 transition-colors"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
          {canCreate && (
            <Link
              to="/requests/add"
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={15} /> New Request
            </Link>
          )}
          {isAdmin && (
            <Link
              to="/requests/add"
              className="hidden"
            />
          )}
        </div>
      </div>

      {/* Filters bar */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm mb-4">
        <div className="flex items-center gap-3 px-4 py-3 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-48">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search request #, store, or manager…"
              className="w-full pl-8 pr-3 py-2 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            />
          </div>
          {/* Status pills */}
          <div className="flex items-center gap-1 flex-wrap">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => { setStatusFilter(f.value); setPage(1); }}
                className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${statusFilter === f.value
                    ? "bg-blue-600 text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xs text-gray-500 font-medium">
          {loading ? "Loading…" : `${total} total request${total !== 1 ? "s" : ""}`}
        </span>
        {statusFilter && (
          <span className="text-xs text-blue-600 font-medium">· filtered by "{statusFilter}"</span>
        )}
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        {error ? (
          <div className="flex items-center gap-2 p-6 text-red-600 text-sm">
            <AlertTriangle size={16} /> {error}
          </div>
        ) : loading && requests.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 size={28} className="text-blue-500 animate-spin" />
          </div>
        ) : requests.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-gray-400">
            <PackageSearch size={40} strokeWidth={1.5} className="mb-3" />
            <p className="text-sm font-medium text-gray-500">No stock requests found</p>
            <p className="text-xs mt-1">
              {canCreate ? "Create your first request using the button above." : "No requests match the current filters."}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Request #</th>
                  {isAdmin && (
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Store</th>
                  )}
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Purchased By</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Items</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Submitted</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide">Transfer</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {requests.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-blue-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedId(r.id)}
                  >
                    <td className="px-4 py-3">
                      <span className="text-xs font-mono font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
                        {r.request_number || `REQ-${r.id}`}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3 text-gray-700 font-medium text-xs">
                        {r.store_name ?? `Store #${r.store_id}`}
                      </td>
                    )}
                    <td className="px-4 py-3 text-gray-600 text-xs">
                      {r.requested_by ?? `User #${r.requested_by_id}`}
                    </td>
                    <td className="px-4 py-3 text-gray-700 font-semibold text-xs">
                      {r.items.length} {r.items.length === 1 ? "item" : "items"}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge status={r.status} />
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                      {fmtDate(r.created_at)}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {r.transfer_id ? (
                        <span className="text-indigo-600 font-medium">#{r.transfer_id}</span>
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); setSelectedId(r.id); }}
                        className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-600 transition-colors"
                        title="View details"
                      >
                        <Eye size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{total} records · Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft size={14} />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Detail modal */}
      {selectedId !== null && (
        <DetailModal
          requestId={selectedId}
          isAdmin={isAdmin}
          onClose={() => setSelectedId(null)}
          onStatusChanged={load}
        />
      )}
    </div>
  );
}
