import {
  AlertCircle,
  Briefcase,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  RefreshCw as ConvertIcon,
  DollarSign,
  Eye,
  FileCheck,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  X
} from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "../lib/api";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";

// ─── Types ────────────────────────────────────────────────────────────────────
interface ProformaRecord {
  id: number;
  proformaNumber: string;
  customerName: string;
  warehouse: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface ProformaItem {
  id: number;
  sku: string | null;
  name: string;
  qty: number;
  unitCost: number;
  discount: number;
  tax: number;
  serialNo1: string | null;
  serialNo2: string | null;
  subtotal: number;
}

interface ProformaDetails {
  id: number;
  proformaNumber: string;
  date: string;
  warehouse: string;
  biller: string;
  customerName: string;
  customerPhone: string | null;
  purpose: string | null;
  paymentMethod: string | null;
  advancePercent: number | null;
  notes: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: ProformaItem[];
}

export function ListProformas() {
  const [proformas, setProformas] = useState<ProformaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Proforma Detail
  const [selectedProformaId, setSelectedProformaId] = useState<number | null>(null);
  const [proformaDetails, setProformaDetails] = useState<ProformaDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  // Convert state
  const [isConverting, setIsConverting] = useState(false);
  const [convertError, setConvertError] = useState("");
  const [convertSuccess, setConvertSuccess] = useState(false);

  const loadProformas = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const raw = await apiFetch<unknown>("/proforma?limit=100");
      let list: ProformaRecord[] = [];
      if (Array.isArray(raw)) {
        list = raw as ProformaRecord[];
      } else if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        const candidate = obj.data ?? obj.items ?? obj.proformas ?? obj.results ?? obj.records;
        if (Array.isArray(candidate)) {
          list = candidate as ProformaRecord[];
        }
      }
      // Sort by ID descending so that the newest proformas show at the top
      list.sort((a, b) => b.id - a.id);
      setProformas(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load proformas");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProformas();
  }, [loadProformas]);

  // Load details when a proforma is clicked
  useEffect(() => {
    if (selectedProformaId === null) {
      setProformaDetails(null);
      setConvertError("");
      setConvertSuccess(false);
      return;
    }

    const fetchDetails = async () => {
      setIsLoadingDetails(true);
      setDetailsError("");
      try {
        const details = await apiFetch<ProformaDetails>(`/proforma/${selectedProformaId}`);
        setProformaDetails(details);
      } catch (err: unknown) {
        setDetailsError(err instanceof Error ? err.message : "Failed to load proforma details");
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedProformaId]);

  // Convert Proforma to Sale
  const handleConvertToSale = async (id: number) => {
    setIsConverting(true);
    setConvertError("");
    setConvertSuccess(false);
    try {
      await apiFetch(`/proforma/${id}/convert`, { method: "PATCH" });
      setConvertSuccess(true);
      // Reload list and details
      loadProformas();
      // Reload details after 1s
      setTimeout(async () => {
        try {
          const details = await apiFetch<ProformaDetails>(`/proforma/${id}`);
          setProformaDetails(details);
        } catch { /* ignore details reload failure on success */ }
      }, 1000);
    } catch (err: unknown) {
      setConvertError(err instanceof Error ? err.message : "Failed to convert proforma");
    } finally {
      setIsConverting(false);
    }
  };

  // Filter logic
  const filteredProformas = proformas.filter((p) => {
    const matchWarehouse =
      warehouseFilter === "All Warehouses" || p.warehouse === warehouseFilter;
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (p.customerName ?? "").toLowerCase().includes(query) ||
      (p.proformaNumber ?? "").toLowerCase().includes(query) ||
      (p.warehouse ?? "").toLowerCase().includes(query);
    return matchWarehouse && matchSearch;
  });

  // Pagination values
  const totalPages = Math.ceil(filteredProformas.length / pageSize);
  const paginatedProformas = filteredProformas.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalValue = filteredProformas.reduce((sum, p) => sum + (p.totalAmount ?? 0), 0);
  const activeCount = filteredProformas.filter((p) => p.status?.toLowerCase() === "active" || p.status?.toLowerCase() === "pending").length;

  const handlePrint = () => {
    const printContent = document.getElementById("proforma-print-area");
    if (!printContent) return;

    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Proforma Invoice #${proformaDetails?.proformaNumber}</title>
            <link href="https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css" rel="stylesheet">
            <style>
              body { font-family: system-ui, -apple-system, sans-serif; padding: 40px; color: #1f2937; }
              @media print {
                body { padding: 0; }
                .no-print { display: none; }
              }
            </style>
          </head>
          <body>
            ${printContent.innerHTML}
            <script>
              window.onload = function() {
                window.print();
                window.close();
              }
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Breadcrumb */}
      <div className="mb-4">
        <div className="flex items-center gap-2 text-sm text-gray-600 mb-2">
          <span>Home</span>
          <span>/</span>
          <span>Proformas</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">List Proformas</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Proforma Invoices</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage, print, and convert proforma invoices into completed sales.
            </p>
          </div>
          <button
            onClick={loadProformas}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
            <FileCheck size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Proformas</p>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">{filteredProformas.length}</h3>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
            <DollarSign size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Value (ZAR)</p>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">
              R {totalValue.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
            </h3>
          </div>
        </div>
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-sky-50 flex items-center justify-center text-sky-600">
            <Briefcase size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Pending/Active</p>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">{activeCount}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 p-4 mb-4 shadow-sm">
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Search</label>
            <SearchAutosuggest
              value={search}
              onChange={(v) => { setSearch(v); setCurrentPage(1); }}
              suggestions={Array.from(
                new Set<string>([
                  ...proformas.map((p) => p.proformaNumber),
                  ...proformas.map((p) => p.customerName),
                  ...proformas.map((p) => p.warehouse),
                ])
              ).filter(Boolean).sort()}
              placeholder="Search by proforma # or customer name…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(e) => { setWarehouseFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500 text-xs bg-gray-50"
            >
              {["All Warehouses", "HEAD OFFICE", "BRANCH 1", "BRANCH 2", "BRANCH 3", "BRANCH 4"].map((w) => (
                <option key={w}>{w}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        {isLoading ? (
          <div className="py-20 flex flex-col items-center justify-center text-gray-500">
            <Loader2 size={32} className="animate-spin text-amber-600 mb-2" />
            <p className="text-sm font-medium">Fetching proformas list…</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600 flex flex-col items-center justify-center px-4">
            <AlertCircle size={36} className="mb-2 text-red-500" />
            <p className="font-semibold">Failed to load proformas</p>
            <p className="text-xs text-red-500 mt-1 max-w-md">{error}</p>
            <button
              onClick={loadProformas}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredProformas.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium">No proformas found</p>
            <p className="text-xs text-gray-500 mt-0.5">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-amber-500 text-white border-b border-gray-200">
                    <th className="px-4 py-3 font-semibold">Proforma Number</th>
                    <th className="px-4 py-3 font-semibold">Date Created</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Warehouse</th>
                    <th className="px-4 py-3 font-semibold text-right">Total Amount</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 text-center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedProformas.map((p) => {
                    const statusLower = p.status?.toLowerCase();
                    const isConverted = statusLower === "converted" || statusLower === "completed";
                    const statusColor = isConverted
                      ? "bg-green-100 text-green-800"
                      : "bg-amber-100 text-amber-855";
                    return (
                      <tr key={p.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-900">
                          {p.proformaNumber}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {new Date(p.createdAt).toLocaleString("en-ZA", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-800">
                          {p.customerName}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500">
                          {p.warehouse}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                          R {p.totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-2xs uppercase tracking-wider ${statusColor}`}
                          >
                            {p.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedProformaId(p.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-50 text-amber-700 hover:bg-amber-100 rounded text-2xs font-semibold shadow-sm transition-colors"
                          >
                            <Eye size={12} /> View Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-gray-100 flex items-center justify-between text-xs">
                <span className="text-gray-500 font-medium">
                  Showing {(currentPage - 1) * pageSize + 1} to{" "}
                  {Math.min(currentPage * pageSize, filteredProformas.length)} of {filteredProformas.length} results
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronLeft size={16} />
                  </button>
                  <span className="font-semibold text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1 border border-gray-200 rounded bg-white hover:bg-gray-50 disabled:opacity-50 transition-colors"
                  >
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Proforma Details Modal */}
      {selectedProformaId !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-amber-500 text-white">
              <div className="flex items-center gap-2">
                <FileCheck size={18} />
                <h3 className="font-bold text-sm">Proforma Invoice Details</h3>
              </div>
              <button
                onClick={() => setSelectedProformaId(null)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetails ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                  <Loader2 size={32} className="animate-spin text-amber-600 mb-2" />
                  <p className="text-sm font-medium">Fetching details…</p>
                </div>
              ) : detailsError ? (
                <div className="py-16 text-center text-red-600 flex flex-col items-center justify-center px-4">
                  <AlertCircle size={36} className="mb-2 text-red-500" />
                  <p className="font-semibold">Failed to load proforma details</p>
                  <p className="text-xs mt-1">{detailsError}</p>
                </div>
              ) : proformaDetails ? (
                <div>
                  {convertSuccess && (
                    <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-xs flex items-center gap-2 font-medium">
                      <CheckCircle size={15} /> Proforma converted to Sale successfully!
                    </div>
                  )}
                  {convertError && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-xs flex items-center gap-2 font-medium">
                      <AlertCircle size={15} /> {convertError}
                    </div>
                  )}

                  <div id="proforma-print-area" className="bg-white p-2">
                    {/* Proforma header */}
                    <div className="flex justify-between items-start mb-6 text-xs">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900 tracking-tight">HEARING AID LABS</h2>
                        <p className="text-xs text-gray-500 mt-0.5">Professional Audiology & Hearing Solutions</p>
                      </div>
                      <div className="text-right">
                        <span className="inline-block px-3 py-1 bg-amber-100 text-amber-800 rounded-full font-bold text-xs uppercase tracking-wide mb-2">
                          Proforma Invoice
                        </span>
                        <p className="text-xs text-gray-500">
                          Proforma #: <strong className="text-gray-900">{proformaDetails.proformaNumber}</strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          Date: <strong className="text-gray-900">
                            {new Date(proformaDetails.date).toLocaleString("en-ZA", { dateStyle: "medium" })}
                          </strong>
                        </p>
                        <p className="text-xs text-gray-500">
                          Status: <strong className="text-gray-900 uppercase">{proformaDetails.status}</strong>
                        </p>
                      </div>
                    </div>

                    {/* Customer / Prepared by info */}
                    <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 border border-gray-100 rounded-xl mb-6 text-xs">
                      <div>
                        <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Details</p>
                        <p className="text-sm font-bold text-gray-900">{proformaDetails.customerName}</p>
                        {proformaDetails.customerPhone && (
                          <p className="text-gray-600 mt-0.5">Phone: {proformaDetails.customerPhone}</p>
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Invoice Details</p>
                        <p className="text-gray-900">Prepared By: <strong className="font-semibold">{proformaDetails.biller}</strong></p>
                        <p className="text-gray-900 mt-0.5">Warehouse: <strong className="font-semibold">{proformaDetails.warehouse}</strong></p>
                        {proformaDetails.purpose && (
                          <p className="text-gray-900 mt-0.5">Purpose: <strong className="font-semibold">{proformaDetails.purpose}</strong></p>
                        )}
                      </div>
                    </div>

                    {/* Items list */}
                    <div className="border border-gray-200 rounded-xl overflow-hidden mb-6">
                      <table className="w-full text-xs">
                        <thead className="bg-gray-100 border-b border-gray-200">
                          <tr>
                            <th className="px-4 py-2 text-left font-bold text-gray-700">Product (SKU)</th>
                            <th className="px-4 py-2 text-left font-bold text-gray-700">Serial No 1 / 2</th>
                            <th className="px-4 py-2 text-center font-bold text-gray-700">Unit Cost</th>
                            <th className="px-4 py-2 text-center font-bold text-gray-700">Qty</th>
                            <th className="px-4 py-2 text-center font-bold text-gray-700">Discount</th>
                            <th className="px-4 py-2 text-center font-bold text-gray-700">Tax</th>
                            <th className="px-4 py-2 text-right font-bold text-gray-700">Subtotal</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {proformaDetails.items?.map((item) => (
                            <tr key={item.id}>
                              <td className="px-4 py-3">
                                <p className="font-semibold text-gray-900">{item.name}</p>
                                {item.sku && <p className="text-gray-500 mt-0.5">{item.sku}</p>}
                              </td>
                              <td className="px-4 py-3 text-gray-600">
                                {item.serialNo1 ? (
                                  <div>
                                    <p>SN1: {item.serialNo1}</p>
                                    {item.serialNo2 && <p className="mt-0.5">SN2: {item.serialNo2}</p>}
                                  </div>
                                ) : (
                                  <span className="text-gray-400">—</span>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-800">
                                R {item.unitCost.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-800">{item.qty}</td>
                              <td className="px-4 py-3 text-center text-gray-800">
                                {item.discount > 0 ? `${item.discount}%` : "0%"}
                              </td>
                              <td className="px-4 py-3 text-center text-gray-800">
                                {item.tax > 0 ? `${item.tax}%` : "0%"}
                              </td>
                              <td className="px-4 py-3 text-right font-bold text-gray-900">
                                R {item.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>

                    {/* Summary Totals & Advance Breakdown */}
                    <div className="grid grid-cols-2 gap-4 mb-6 text-xs">
                      <div className="p-4 bg-amber-50/50 border border-amber-100 rounded-xl space-y-2">
                        <p className="font-bold text-amber-800">Payment Summary</p>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Advance %:</span>
                          <span className="font-semibold">{proformaDetails.advancePercent ?? 0}%</span>
                        </div>
                        {proformaDetails.paymentMethod && (
                          <div className="flex justify-between">
                            <span className="text-gray-600">Payment Method:</span>
                            <span className="font-semibold">{proformaDetails.paymentMethod}</span>
                          </div>
                        )}
                        <div className="flex justify-between border-t border-amber-100 pt-1.5">
                          <span className="text-gray-600 font-medium">Advance Amount Paid:</span>
                          <span className="font-bold text-amber-800">
                            R {((proformaDetails.totalAmount * (proformaDetails.advancePercent ?? 0)) / 100).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600 font-medium">Balance Outstanding:</span>
                          <span className="font-bold text-gray-950">
                            R {(proformaDetails.totalAmount - ((proformaDetails.totalAmount * (proformaDetails.advancePercent ?? 0)) / 100)).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                          </span>
                        </div>
                      </div>

                      <div className="flex justify-end">
                        <div className="w-64 space-y-2.5">
                          <div className="flex justify-between text-gray-600 font-medium">
                            <span>Subtotal</span>
                            <span>
                              R {(proformaDetails.items ?? []).reduce((sum, item) => sum + item.subtotal, 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between text-gray-600 font-medium border-b border-gray-100 pb-2">
                            <span>VAT</span>
                            <span>
                              R {(proformaDetails.items ?? []).reduce((sum, item) => sum + (item.subtotal * item.tax / 100), 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                          <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
                            <span>Grand Total</span>
                            <span>
                              R {proformaDetails.totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Notes */}
                    {proformaDetails.notes && (
                      <div className="border border-gray-150 rounded-xl p-4 bg-amber-50/20 text-xs">
                        <p className="font-bold text-amber-800 mb-1">Notes & Instructions</p>
                        <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{proformaDetails.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
              <div>
                {proformaDetails && proformaDetails.status?.toLowerCase() !== "converted" && proformaDetails.status?.toLowerCase() !== "completed" && (
                  <button
                    type="button"
                    disabled={isConverting}
                    onClick={() => handleConvertToSale(proformaDetails.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 rounded-lg text-xs font-semibold transition-colors shadow-sm"
                  >
                    {isConverting ? (
                      <><Loader2 size={13} className="animate-spin" /> Converting…</>
                    ) : (
                      <><ConvertIcon size={13} /> Convert to Sale</>
                    )}
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handlePrint}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-lg text-xs font-semibold hover:bg-amber-600 transition-colors shadow-sm"
                >
                  <Printer size={13} /> Print Proforma
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedProformaId(null)}
                  className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 bg-white rounded-lg text-xs font-semibold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
