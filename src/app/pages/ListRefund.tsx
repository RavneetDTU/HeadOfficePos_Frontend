import { ChevronLeft, ChevronRight, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { DeleteConfirmModal } from "../components/modals/DeleteConfirmModal";
import { ProcessModal } from "../components/modals/ProcessModal";
import { ViewDetailsModal } from "../components/modals/ViewDetailsModal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";
import { getSalesRefunds } from "../services/inventoryService";
import type { RefundOut } from "../types/inventory";

function getStatusVariant(status: string): "success" | "warning" | "error" | "info" | "default" {
  switch ((status ?? "").toLowerCase()) {
    case "completed":
    case "approved":
      return "success";
    case "pending":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

function fmtDate(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtAmt(val: number | undefined) {
  if (val == null) return "—";
  return val.toLocaleString("en-ZA", { minimumFractionDigits: 2 });
}

export function ListRefund() {
  const [refundData, setRefundData] = useState<RefundOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [selectedRows, setSelectedRows] = useState<number[]>([]);
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [activeRefund, setActiveRefund] = useState<RefundOut | null>(null);
  const [search, setSearch] = useState("");
  const menuRef = useRef<HTMLDivElement>(null);
  const [viewDetailsModal, setViewDetailsModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [approveModal, setApproveModal] = useState(false);
  const [rejectModal, setRejectModal] = useState(false);

  const loadRefunds = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getSalesRefunds();
      setRefundData(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load refunds");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRefunds(); }, []);

  const refundSuggestions = Array.from(
    new Set([
      ...refundData.map((r) => String(r.id)),
      ...refundData.map((r) => r.customer ?? ""),
    ])
  ).filter(Boolean).sort();

  const filteredRefunds = search.trim()
    ? refundData.filter((r) =>
        String(r.id).includes(search) ||
        String(r.sale_id).includes(search) ||
        (r.customer ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : refundData;

  const toggleRow = (id: number) => {
    setSelectedRows(prev =>
      prev.includes(id) ? prev.filter(rowId => rowId !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    setSelectedRows(prev =>
      prev.length === refundData.length ? [] : refundData.map(row => row.id)
    );
  };

  const toggleActionMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openActionMenu === id) { setOpenActionMenu(null); setMenuPos(null); return; }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const dropdownHeight = 160;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4;
    setMenuPos({ top, left: rect.right - 240 });
    setOpenActionMenu(id);
    setActiveRefund(refundData.find((r) => r.id === id) ?? null);
  };

  const handleViewDetails = (refund: any) => {
    setViewDetailsModal({ isOpen: true, saleData: refund });
    setOpenActionMenu(null);
    setMenuPos(null);
  };

  const handleDeleteRefund = () => {
    setDeleteConfirmModal(true);
    setOpenActionMenu(null);
    setMenuPos(null);
  };

  const confirmDeleteRefund = () => {
    console.log("Refund deleted");
    setOpenActionMenu(null);
  };

  const handleApprove = () => { setApproveModal(true); setOpenActionMenu(null); setMenuPos(null); };
  const handleReject = () => { setRejectModal(true); setOpenActionMenu(null); setMenuPos(null); };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest("button") && !target.closest(".action-menu-fixed")) {
        setOpenActionMenu(null);
        setMenuPos(null);
      }
    };
    const handleScroll = () => { setOpenActionMenu(null); setMenuPos(null); };
    if (openActionMenu !== null) {
      document.addEventListener("click", handleClickOutside);
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => {
      document.removeEventListener("click", handleClickOutside);
      window.removeEventListener("scroll", handleScroll, true);
    };
  }, [openActionMenu]);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span>Home</span><span>/</span><span>Sales</span><span>/</span>
          <span className="text-gray-900">List Refund</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Refunds (All Warehouses)</h1>
            <p className="text-sm text-gray-600 mt-1">
              Please use the table below to navigate or filter the results.
            </p>
          </div>
          <button onClick={loadRefunds} className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>
      </div>

      {loading && (
        <div className="flex items-center justify-center py-16">
          <Loader2 size={28} className="animate-spin text-blue-600" />
        </div>
      )}
      {fetchError && (
        <div className="flex items-center gap-2 p-4 mb-4 rounded-lg bg-red-50 border border-red-200 text-red-600 text-sm">
          <AlertTriangle size={16} /> {fetchError}
          <button onClick={loadRefunds} className="ml-2 underline">Retry</button>
        </div>
      )}

      {!loading && (
        <div className="bg-white rounded border border-gray-200">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select className="px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm">
                <option value="10">10</option>
                <option value="25">25</option>
                <option value="50">50</option>
              </select>
              <span className="text-sm text-gray-600">records</span>
            </div>
            <div className="flex items-center gap-2">
              <SearchAutosuggest
                value={search}
                onChange={setSearch}
                suggestions={refundSuggestions}
                placeholder="Search refunds..."
                inputClassName="py-1.5 rounded border-gray-200 text-sm"
                className="w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-max">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      checked={selectedRows.length > 0 && selectedRows.length === refundData.length}
                      onChange={toggleAll}
                      className="rounded border-white/30"
                    />
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-medium">ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Sale ID</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Customer</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Amount</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Method</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredRefunds.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-12 text-center text-sm text-gray-400">
                      No refunds found
                    </td>
                  </tr>
                ) : filteredRefunds.map((refund, index) => (
                  <tr key={refund.id} className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={selectedRows.includes(refund.id)}
                        onChange={() => toggleRow(refund.id)}
                        className="rounded border-gray-300"
                      />
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-900">{refund.id}</td>
                    <td className="px-3 py-3 text-xs font-medium text-blue-600">{refund.sale_id}</td>
                    <td className="px-3 py-3 text-xs text-gray-900">{refund.customer ?? "—"}</td>
                    <td className="px-3 py-3 text-xs font-medium text-gray-900">R {fmtAmt(refund.amount)}</td>
                    <td className="px-3 py-3 text-xs text-gray-600">{refund.method ?? "—"}</td>
                    <td className="px-3 py-3">
                      <StatusBadge status={refund.status ?? "Unknown"} variant={getStatusVariant(refund.status ?? "")} />
                    </td>
                    <td className="px-3 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(refund.created_at)}</td>
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => toggleActionMenu(refund.id, e)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors"
                      >
                        Actions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <div className="text-sm text-gray-600">
              Showing <span className="font-medium">{filteredRefunds.length}</span> of <span className="font-medium">{refundData.length}</span> results
            </div>
            <div className="flex items-center gap-2">
              <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white transition-colors text-sm" disabled>
                <ChevronLeft size={16} />
              </button>
              <button className="px-3 py-1.5 bg-blue-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1.5 border border-gray-200 rounded hover:bg-white transition-colors text-sm" disabled>
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      <ViewDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={() => setViewDetailsModal({ isOpen: false, saleData: null })}
        saleData={viewDetailsModal.saleData}
      />
      <DeleteConfirmModal
        isOpen={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        onConfirm={confirmDeleteRefund}
      />
      <ProcessModal isOpen={approveModal} onClose={() => setApproveModal(false)} type="approve" />
      <ProcessModal isOpen={rejectModal} onClose={() => setRejectModal(false)} type="reject" />

      {openActionMenu !== null && menuPos && activeRefund && (
        <div
          ref={menuRef}
          className="action-menu-fixed fixed w-60 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
        >
          <button onClick={() => handleViewDetails(activeRefund)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 transition-colors flex items-center gap-2">
            👁️ View Details
          </button>
          <button onClick={handleDeleteRefund} className="w-full px-4 py-2 text-left text-xs hover:bg-red-50 text-red-600 transition-colors flex items-center gap-2">
            🗑️ Delete Refund
          </button>
          <button onClick={handleApprove} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 transition-colors flex items-center gap-2">
            ✅ Approve
          </button>
          <button onClick={handleReject} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 transition-colors flex items-center gap-2">
            ❌ Reject
          </button>
        </div>
      )}
    </div>
  );
}
