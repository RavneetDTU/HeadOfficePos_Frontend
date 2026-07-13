import React, { useState, useEffect, useCallback } from "react";
import {
  Search,
  Loader2,
  AlertCircle,
  RefreshCw,
  Eye,
  FileText,
  Calendar,
  User,
  Building2,
  TrendingUp,
  DollarSign,
  Briefcase,
  X,
  Printer,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { apiFetch } from "../lib/api";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";

// ─── Types ────────────────────────────────────────────────────────────────────
interface QuoteRecord {
  id: number;
  quoteNumber: string;
  customerName: string;
  warehouse: string;
  totalAmount: number;
  status: string;
  createdAt: string;
}

interface QuoteItem {
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

interface QuoteDetails {
  id: number;
  quoteNumber: string;
  date: string;
  warehouse: string;
  biller: string;
  customerName: string;
  customerPhone: string | null;
  validDays: number;
  notes: string | null;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: QuoteItem[];
}

export function ListQuotations() {
  const [quotes, setQuotes] = useState<QuoteRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [warehouseFilter, setWarehouseFilter] = useState("All Warehouses");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Selected Quote Detail
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);
  const [quoteDetails, setQuoteDetails] = useState<QuoteDetails | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailsError, setDetailsError] = useState("");

  const loadQuotes = useCallback(async () => {
    setIsLoading(true);
    setError("");
    try {
      const raw = await apiFetch<unknown>("/quotes?limit=100");
      let list: QuoteRecord[] = [];
      if (Array.isArray(raw)) {
        list = raw as QuoteRecord[];
      } else if (raw && typeof raw === "object") {
        const obj = raw as Record<string, unknown>;
        const candidate = obj.data ?? obj.items ?? obj.quotes ?? obj.results ?? obj.records;
        if (Array.isArray(candidate)) {
          list = candidate as QuoteRecord[];
        }
      }
      // Sort by ID descending so that the newest quotes show at the top
      list.sort((a, b) => b.id - a.id);
      setQuotes(list);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load quotes");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadQuotes();
  }, [loadQuotes]);

  // Load details when a quote is clicked
  useEffect(() => {
    if (selectedQuoteId === null) {
      setQuoteDetails(null);
      return;
    }

    const fetchDetails = async () => {
      setIsLoadingDetails(true);
      setDetailsError("");
      try {
        const details = await apiFetch<QuoteDetails>(`/quotes/${selectedQuoteId}`);
        setQuoteDetails(details);
      } catch (err: unknown) {
        setDetailsError(err instanceof Error ? err.message : "Failed to load quote details");
      } finally {
        setIsLoadingDetails(false);
      }
    };

    fetchDetails();
  }, [selectedQuoteId]);

  // Filter logic
  const filteredQuotes = quotes.filter((q) => {
    const matchWarehouse =
      warehouseFilter === "All Warehouses" || q.warehouse === warehouseFilter;
    const query = search.toLowerCase();
    const matchSearch =
      !query ||
      (q.customerName ?? "").toLowerCase().includes(query) ||
      (q.quoteNumber ?? "").toLowerCase().includes(query) ||
      (q.warehouse ?? "").toLowerCase().includes(query);
    return matchWarehouse && matchSearch;
  });

  // Pagination values
  const totalPages = Math.ceil(filteredQuotes.length / pageSize);
  const paginatedQuotes = filteredQuotes.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalValue = filteredQuotes.reduce((sum, q) => sum + (q.totalAmount ?? 0), 0);
  const activeCount = filteredQuotes.filter((q) => q.status?.toLowerCase() === "active").length;

  const handlePrint = () => {
    const printContent = document.getElementById("quote-print-area");
    if (!printContent) return;

    const originalContent = document.body.innerHTML;
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Quotation #${quoteDetails?.quoteNumber}</title>
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
          <span>Quotations</span>
          <span>/</span>
          <span className="text-gray-900 font-medium">List Quotations</span>
        </div>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold text-gray-900">Quotations</h1>
            <p className="text-sm text-gray-600 mt-0.5">
              Manage and view all customer price estimates.
            </p>
          </div>
          <button
            onClick={loadQuotes}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 shadow-sm transition-colors"
          >
            <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-violet-50 flex items-center justify-center text-violet-600">
            <FileText size={20} />
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Total Estimates</p>
            <h3 className="text-lg font-bold text-gray-900 mt-0.5">{filteredQuotes.length}</h3>
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
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Active Estimates</p>
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
                  ...quotes.map((q) => q.quoteNumber),
                  ...quotes.map((q) => q.customerName),
                  ...quotes.map((q) => q.warehouse),
                ])
              ).filter(Boolean).sort()}
              placeholder="Search by quote # or customer name…"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-1.5">Warehouse</label>
            <select
              value={warehouseFilter}
              onChange={(e) => { setWarehouseFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-1.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-violet-500 text-xs bg-gray-50"
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
            <Loader2 size={32} className="animate-spin text-violet-600 mb-2" />
            <p className="text-sm font-medium">Fetching quotations list…</p>
          </div>
        ) : error ? (
          <div className="py-16 text-center text-red-600 flex flex-col items-center justify-center px-4">
            <AlertCircle size={36} className="mb-2 text-red-500" />
            <p className="font-semibold">Failed to load quotations</p>
            <p className="text-xs text-red-500 mt-1 max-w-md">{error}</p>
            <button
              onClick={loadQuotes}
              className="mt-4 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg text-xs font-medium transition-colors"
            >
              Try Again
            </button>
          </div>
        ) : filteredQuotes.length === 0 ? (
          <div className="py-20 text-center text-gray-400">
            <div className="text-4xl mb-2">📄</div>
            <p className="font-medium">No quotations found</p>
            <p className="text-xs text-gray-500 mt-0.5">Try adjusting your filters or search terms.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-violet-600 text-white border-b border-gray-200">
                    <th className="px-4 py-3 font-semibold">Quote Number</th>
                    <th className="px-4 py-3 font-semibold">Date Created</th>
                    <th className="px-4 py-3 font-semibold">Customer</th>
                    <th className="px-4 py-3 font-semibold">Warehouse</th>
                    <th className="px-4 py-3 font-semibold text-right">Total Amount</th>
                    <th className="px-4 py-3 font-semibold text-center">Status</th>
                    <th className="px-4 py-3 text-center" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {paginatedQuotes.map((q) => {
                    const isStatusActive = q.status?.toLowerCase() === "active";
                    return (
                      <tr key={q.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 py-3.5 font-bold text-gray-900">
                          {q.quoteNumber}
                        </td>
                        <td className="px-4 py-3.5 text-gray-600">
                          {new Date(q.createdAt).toLocaleString("en-ZA", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-gray-800">
                          {q.customerName}
                        </td>
                        <td className="px-4 py-3.5 text-gray-500">
                          {q.warehouse}
                        </td>
                        <td className="px-4 py-3.5 text-right font-bold text-gray-900">
                          R {q.totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <span
                            className={`inline-flex px-2 py-0.5 rounded-full font-semibold text-2xs uppercase tracking-wider ${
                              isStatusActive
                                ? "bg-green-100 text-green-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {q.status}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            onClick={() => setSelectedQuoteId(q.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-violet-50 text-violet-700 hover:bg-violet-100 rounded text-2xs font-semibold shadow-sm transition-colors"
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
                  {Math.min(currentPage * pageSize, filteredQuotes.length)} of {filteredQuotes.length} results
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

      {/* Quote Details Modal */}
      {selectedQuoteId !== null && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-violet-600 text-white">
              <div className="flex items-center gap-2">
                <FileText size={18} />
                <h3 className="font-bold text-sm">Quote Details</h3>
              </div>
              <button
                onClick={() => setSelectedQuoteId(null)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto p-6">
              {isLoadingDetails ? (
                <div className="py-20 flex flex-col items-center justify-center text-gray-500">
                  <Loader2 size={32} className="animate-spin text-violet-600 mb-2" />
                  <p className="text-sm font-medium">Fetching details…</p>
                </div>
              ) : detailsError ? (
                <div className="py-16 text-center text-red-600 flex flex-col items-center justify-center px-4">
                  <AlertCircle size={36} className="mb-2 text-red-500" />
                  <p className="font-semibold">Failed to load quote details</p>
                  <p className="text-xs mt-1">{detailsError}</p>
                </div>
              ) : quoteDetails ? (
                <div id="quote-print-area" className="bg-white p-2">
                  {/* Quote header */}
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900 tracking-tight">HEARING AID LABS</h2>
                      <p className="text-xs text-gray-500 mt-0.5">Professional Audiology & Hearing Solutions</p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block px-3 py-1 bg-violet-100 text-violet-800 rounded-full font-bold text-xs uppercase tracking-wide mb-2">
                        Quotation
                      </span>
                      <p className="text-xs text-gray-500">
                        Quote #: <strong className="text-gray-900">{quoteDetails.quoteNumber}</strong>
                      </p>
                      <p className="text-xs text-gray-500">
                        Date: <strong className="text-gray-900">
                          {new Date(quoteDetails.date).toLocaleString("en-ZA", { dateStyle: "medium" })}
                        </strong>
                      </p>
                      <p className="text-xs text-gray-500">
                        Valid for: <strong className="text-gray-900">{quoteDetails.validDays} days</strong>
                      </p>
                    </div>
                  </div>

                  {/* Customer / Prepared by info */}
                  <div className="grid grid-cols-2 gap-6 p-4 bg-gray-50 border border-gray-100 rounded-xl mb-6 text-xs">
                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Customer Details</p>
                      <p className="text-sm font-bold text-gray-900">{quoteDetails.customerName}</p>
                      {quoteDetails.customerPhone && (
                        <p className="text-gray-600 mt-0.5">Phone: {quoteDetails.customerPhone}</p>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-gray-400 uppercase tracking-wider mb-1">Estimate Details</p>
                      <p className="text-gray-900">Prepared By: <strong className="font-semibold">{quoteDetails.biller}</strong></p>
                      <p className="text-gray-900 mt-0.5">Warehouse: <strong className="font-semibold">{quoteDetails.warehouse}</strong></p>
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
                        {quoteDetails.items?.map((item) => (
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

                  {/* Summary Totals */}
                  <div className="flex justify-end mb-6 text-xs">
                    <div className="w-64 space-y-2.5">
                      <div className="flex justify-between text-gray-600 font-medium">
                        <span>Subtotal</span>
                        <span>
                          R {(quoteDetails.items ?? []).reduce((sum, item) => sum + item.subtotal, 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-gray-600 font-medium border-b border-gray-100 pb-2">
                        <span>VAT</span>
                        <span>
                          R {(quoteDetails.items ?? []).reduce((sum, item) => sum + (item.subtotal * item.tax / 100), 0).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-gray-900 pt-1">
                        <span>Grand Total</span>
                        <span>
                          R {quoteDetails.totalAmount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Notes / Terms */}
                  {quoteDetails.notes && (
                    <div className="border border-gray-150 rounded-xl p-4 bg-violet-50/50 text-xs">
                      <p className="font-bold text-violet-800 mb-1">Notes & Conditions</p>
                      <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{quoteDetails.notes}</p>
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-end gap-2 bg-gray-50">
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-violet-600 text-white rounded-lg text-xs font-semibold hover:bg-violet-700 transition-colors shadow-sm"
              >
                <Printer size={13} /> Print Quotation
              </button>
              <button
                type="button"
                onClick={() => setSelectedQuoteId(null)}
                className="px-4 py-2 border border-gray-200 text-gray-700 hover:bg-gray-100 bg-white rounded-lg text-xs font-semibold transition-colors"
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
