import {
  AlertCircle, ChevronLeft, ChevronRight,
  Loader2,
  RefreshCw,
  Search,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { AddPaymentModal } from "../components/modals/AddPaymentModal";
import { DeleteConfirmModal } from "../components/modals/DeleteConfirmModal";
import { EmailSaleModal } from "../components/modals/EmailSaleModal";
import { ViewDetailsModal } from "../components/modals/ViewDetailsModal";
import { ViewPaymentModal } from "../components/modals/ViewPaymentModal";
import { StatusBadge } from "../components/ui/StatusBadge";
import { apiFetch } from "../lib/api";
import { NotWorking } from "./NotWorking";

// ─── Type ─────────────────────────────────────────────────────────────────────
interface PurchaseRecord {
  id: number;
  date: string;
  reference?: string;
  supplier?: string;
  supplierPhone?: string;
  warehouse?: string;
  purchaseStatus?: string;
  status?: string;
  paymentStatus?: string;
  grandTotal?: number | string;
  paid?: number | string;
  balance?: number | string;
  notes?: string;
  [key: string]: unknown;
}

function getStatusVariant(
  status: string,
): "success" | "warning" | "error" | "info" | "default" {
  switch (status.toLowerCase()) {
    case "received":
    case "completed":
      return "success";
    case "ordered":
    case "preordered":
      return "info";
    case "in transit":
      return "info";
    case "pending":
      return "warning";
    case "cancelled":
      return "error";
    default:
      return "default";
  }
}

function formatDate(raw: string): string {
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
}

function fmtAmt(val: number | string | undefined): string {
  if (val == null) return "—";
  return Number(val).toLocaleString("en-ZA", { minimumFractionDigits: 2 });
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ListPurchases() {
  // ── API and Pagination state ───────────────────────────────────────────────
  const [purchaseData, setPurchaseData] = useState<PurchaseRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [search]);

  const loadPurchases = useCallback(async () => {
    setIsLoading(true);
    setFetchError("");
    try {
      let url = `/purchases?page=${page}&limit=${limit}`;
      // Only send non-numeric search terms to the backend.
      // Purely numeric input (phone numbers) is handled by the client-side filter below,
      // because the backend does not search supplierPhone.
      const isPhoneSearch = /^\d+$/.test(debouncedSearch.trim());
      if (debouncedSearch.trim() && !isPhoneSearch) {
        url += `&search=${encodeURIComponent(debouncedSearch.trim())}`;
      }
      const raw = await apiFetch<unknown>(url);
      let records: PurchaseRecord[] = [];
      let total = 0;
      let pages = 1;

      if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        const candidate = obj.purchases ?? obj.data ?? obj.items ?? obj.results;
        if (Array.isArray(candidate)) records = candidate as PurchaseRecord[];
        else if (Array.isArray(raw)) records = raw as PurchaseRecord[];
        total = typeof obj.total === "number" ? obj.total : records.length;
        pages = typeof obj.totalPages === "number" ? obj.totalPages : Math.ceil(total / limit);
      } else if (Array.isArray(raw)) {
        records = raw as PurchaseRecord[];
        total = records.length;
        pages = Math.ceil(total / limit);
      }

      // Sort by date descending so that the newest purchases show at the top on the current page
      records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setPurchaseData(records);
      setTotalRecords(total);
      setTotalPages(Math.max(1, pages));
    } catch (err: unknown) {
      setFetchError(err instanceof Error ? err.message : "Failed to load purchases");
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, debouncedSearch]);

  useEffect(() => { loadPurchases(); }, [loadPurchases]);

  // ── Table state ───────────────────────────────────────────────────────────
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // ── Modals ────────────────────────────────────────────────────────────────
  const [viewDetailsModal, setViewDetailsModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [viewPaymentModal, setViewPaymentModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [addPaymentModal, setAddPaymentModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [emailModal, setEmailModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [notWorkingModal, setNotWorkingModal] = useState(false);
  const [activePurchase, setActivePurchase] = useState<PurchaseRecord | null>(null);

  const toggleActionMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openActionMenu === id) {
      setOpenActionMenu(null);
      setMenuPos(null);
      return;
    }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const dropdownHeight = 320;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= dropdownHeight
      ? rect.bottom + 4
      : rect.top - dropdownHeight - 4;
    setMenuPos({ top, left: rect.right - 208 });
    setOpenActionMenu(id);
    setActivePurchase(purchaseData.find((p) => p.id === id) ?? null);
  };

  const handleViewDetails = (p: any) => { setViewDetailsModal({ isOpen: true, saleData: p }); setOpenActionMenu(null); };
  const handleViewPayments = (p: any) => { setViewPaymentModal({ isOpen: true, saleData: p }); setOpenActionMenu(null); };
  const handleAddPayment = (p: any) => { setAddPaymentModal({ isOpen: true, saleData: p }); setOpenActionMenu(null); };
  const handleEmail = (p: any) => { setEmailModal({ isOpen: true, saleData: p }); setOpenActionMenu(null); };
  const handleDelete = () => setDeleteConfirmModal(true);
  const confirmDelete = () => { setOpenActionMenu(null); };
  const handleNotWorking = () => { setNotWorkingModal(true); setOpenActionMenu(null); };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest("button") &&
        !(e.target as HTMLElement).closest(".action-menu-fixed")
      ) { setOpenActionMenu(null); setMenuPos(null); }
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
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded border border-gray-300">
        {/* Header */}
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">
              Purchases (All Warehouses)
            </h2>
            <p className="text-sm text-gray-600">
              Please use the table below to navigate or filter the results.
            </p>
          </div>
          <a
            href="/purchases/add"
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 transition-colors font-medium"
          >
            + Add Purchase
          </a>
        </div>

        {/* Show / per-page selector */}
        <div className="px-4 pt-3 flex items-center gap-2">
          <span className="text-sm text-gray-600">Show</span>
          <select
            value={limit}
            onChange={(e) => { setLimit(parseInt(e.target.value)); setPage(1); }}
            className="px-3 py-1.5 border border-gray-200 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm bg-white"
          >
            <option value="10">10</option>
            <option value="25">25</option>
            <option value="50">50</option>
            <option value="100">100</option>
          </select>
          <span className="text-sm text-gray-600">records</span>
        </div>

        <div className="p-4">
          {/* Search + Refresh */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={loadPurchases}
              disabled={isLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded text-sm text-gray-600 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <RefreshCw size={14} className={isLoading ? "animate-spin" : ""} />
              Refresh
            </button>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
              <input
                type="text"
                placeholder="Search supplier, reference..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-3 py-1.5 border border-gray-200 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500 w-64"
              />
            </div>
          </div>

          {/* Table */}
          <div className="border border-gray-300 rounded overflow-x-auto relative">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Date</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Reference No</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Supplier</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Supplier Phone</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Warehouse</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Purchase Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Grand Total</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Paid</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Balance</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Payment Status</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Note</th>
                  <th className="px-3 py-2 text-left text-xs font-medium whitespace-nowrap">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {/* Loading */}
                {isLoading && (
                  <tr>
                    <td colSpan={12} className="px-4 py-16 text-center">
                      <div className="flex items-center justify-center gap-2 text-gray-500 text-sm">
                        <Loader2 size={18} className="animate-spin text-blue-500" />
                        Loading purchases…
                      </div>
                    </td>
                  </tr>
                )}
                {/* Error */}
                {!isLoading && fetchError && (
                  <tr>
                    <td colSpan={12} className="px-4 py-16 text-center">
                      <div className="flex items-center justify-center gap-2 text-red-500 text-sm">
                        <AlertCircle size={16} />
                        {fetchError}
                      </div>
                    </td>
                  </tr>
                )}
                {/* Empty */}
                {!isLoading && !fetchError && purchaseData.length === 0 && (
                  <tr>
                    <td colSpan={12} className="px-4 py-16 text-center text-gray-400 text-sm">
                      No purchases found
                    </td>
                  </tr>
                )}
                {/* Data rows */}
                {!isLoading && !fetchError && purchaseData
                  .filter((purchase) => {
                    if (!debouncedSearch.trim()) return true;
                    const q = debouncedSearch.trim().toLowerCase();
                    return (
                      (purchase.supplier ?? "").toLowerCase().includes(q) ||
                      (purchase.reference ?? "").toLowerCase().includes(q) ||
                      (purchase.supplierPhone ?? "").toLowerCase().includes(q)
                    );
                  })
                  .map((purchase, index) => (
                  <tr
                    key={purchase.id}
                    className={`hover:bg-gray-100 transition-colors ${index % 2 === 0 ? "bg-white" : "bg-gray-50"}`}
                  >
                    <td className="px-3 py-2 text-xs text-gray-900">
                      {purchase.date ? formatDate(purchase.date) : ""}
                    </td>
                    <td className="px-3 py-2 text-xs text-blue-600 font-medium">
                      {purchase.reference ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900">
                      {purchase.supplier ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {purchase.supplierPhone ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600">
                      {purchase.warehouse ?? "—"}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        status={(purchase.status || purchase.purchaseStatus || "") as string}
                        variant={getStatusVariant((purchase.status || purchase.purchaseStatus || "") as string)}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs font-medium text-gray-900">
                      {fmtAmt(purchase.grandTotal)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900">
                      {fmtAmt(purchase.paid)}
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-900">
                      {fmtAmt(purchase.balance)}
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge
                        status={purchase.paymentStatus ?? ""}
                        variant={getStatusVariant(purchase.paymentStatus ?? "")}
                      />
                    </td>
                    <td className="px-3 py-2 text-xs text-gray-600 max-w-[140px] truncate">
                      {purchase.notes ?? ""}
                    </td>
                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => toggleActionMenu(purchase.id, e)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 transition-colors whitespace-nowrap"
                      >
                        Actions
                      </button>
                    </td>
                  </tr>
                  ))
                }
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing{" "}
              <span className="font-medium">{purchaseData.length > 0 ? (page - 1) * limit + 1 : 0}</span>{" "}
              to{" "}
              <span className="font-medium">{Math.min(page * limit, totalRecords)}</span>{" "}
              of{" "}
              <span className="font-medium">{totalRecords}</span>{" "}
              results
            </div>
            <div className="flex gap-1 items-center">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors text-sm disabled:opacity-50"
              >
                <ChevronLeft size={14} />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .map((p, idx, arr) => {
                  const prev = arr[idx - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <span key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="text-gray-400 text-xs">...</span>}
                      <button
                        onClick={() => setPage(p)}
                        className={`px-3 py-1 rounded text-xs font-medium transition-all ${page === p
                          ? "bg-blue-600 text-white"
                          : "border border-gray-200 hover:bg-white text-gray-600 bg-white"
                          }`}
                      >
                        {p}
                      </button>
                    </span>
                  );
                })}

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-1.5 rounded border border-gray-200 hover:bg-white transition-colors text-sm disabled:opacity-50"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <ViewDetailsModal
        isOpen={viewDetailsModal.isOpen}
        onClose={() => setViewDetailsModal({ isOpen: false, saleData: null })}
        saleData={viewDetailsModal.saleData}
      />
      <ViewPaymentModal
        isOpen={viewPaymentModal.isOpen}
        onClose={() => setViewPaymentModal({ isOpen: false, saleData: null })}
        saleData={viewPaymentModal.saleData}
      />
      <AddPaymentModal
        isOpen={addPaymentModal.isOpen}
        onClose={() => setAddPaymentModal({ isOpen: false, saleData: null })}
        saleData={addPaymentModal.saleData}
      />
      <EmailSaleModal
        isOpen={emailModal.isOpen}
        onClose={() => setEmailModal({ isOpen: false, saleData: null })}
        saleData={emailModal.saleData}
      />
      <DeleteConfirmModal
        isOpen={deleteConfirmModal}
        onClose={() => setDeleteConfirmModal(false)}
        onConfirm={confirmDelete}
      />
      {notWorkingModal && (
        <div className="fixed inset-0 z-50" onClick={() => setNotWorkingModal(false)}>
          <NotWorking />
        </div>
      )}

      {/* Fixed-position action dropdown — always visible regardless of scroll */}
      {openActionMenu !== null && menuPos && activePurchase && (
        <div
          ref={menuRef}
          className="action-menu-fixed fixed w-52 bg-white border border-gray-200 rounded-xl shadow-2xl overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
        >
          <button onClick={() => handleViewDetails(activePurchase)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
            <span>👁️</span> Purchase Details
          </button>
          <button onClick={() => handleViewPayments(activePurchase)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
            <span>💳</span> View Payment
          </button>
          <button onClick={() => handleAddPayment(activePurchase)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
            <span>➕</span> Add Payment
          </button>
          <button onClick={handleNotWorking} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
            <span>✏️</span> Edit Purchase
          </button>
          <button className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
            <span>📄</span> Download as PDF
          </button>
          <button onClick={() => handleEmail(activePurchase)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
            <span>📧</span> Email Purchase
          </button>
          <button onClick={handleNotWorking} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
            <span>↩️</span> Return Purchase
          </button>
          <button onClick={() => { handleDelete(); setOpenActionMenu(null); setMenuPos(null); }} className="w-full px-4 py-2 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2">
            <span>🗑️</span> Delete Purchase
          </button>
        </div>
      )}
    </div>
  );
}