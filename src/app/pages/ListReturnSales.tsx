import { useEffect, useState } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { AddPaymentModal } from "../components/modals/AddPaymentModal";
import { EmailSaleModal } from "../components/modals/EmailSaleModal";
import { ViewDetailsModal } from "../components/modals/ViewDetailsModal";
import { ViewPaymentModal } from "../components/modals/ViewPaymentModal";
import { getSalesReturns } from "../services/inventoryService";
import type { SaleReturnOut } from "../types/inventory";

function fmtDate(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtAmt(val: number | undefined) {
  if (val == null) return "—";
  return val.toLocaleString("en-ZA", { minimumFractionDigits: 2 });
}

export function ListReturnSales() {
  const [returnSalesData, setReturnSalesData] = useState<SaleReturnOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [search, setSearch] = useState("");
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [viewDetailsModal, setViewDetailsModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [viewPaymentModal, setViewPaymentModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [addPaymentModal, setAddPaymentModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });
  const [emailSaleModal, setEmailSaleModal] = useState<{ isOpen: boolean; saleData: any }>({ isOpen: false, saleData: null });

  const loadReturns = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getSalesReturns();
      setReturnSalesData(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load return sales");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReturns(); }, []);

  const filteredReturns = search.trim()
    ? returnSalesData.filter((r) =>
        (r.reference ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (r.customer ?? "").toLowerCase().includes(search.toLowerCase()) ||
        (r.warehouse ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : returnSalesData;

  const toggleActionMenu = (id: number) => setOpenActionMenu(prev => prev === id ? null : id);
  const handleViewDetails = (sale: any) => { setViewDetailsModal({ isOpen: true, saleData: sale }); setOpenActionMenu(null); };
  const handleViewPayments = (sale: any) => { setViewPaymentModal({ isOpen: true, saleData: sale }); setOpenActionMenu(null); };
  const handleAddPayment = (sale: any) => { setAddPaymentModal({ isOpen: true, saleData: sale }); setOpenActionMenu(null); };
  const handleEmailSale = (sale: any) => { setEmailSaleModal({ isOpen: true, saleData: sale }); setOpenActionMenu(null); };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest("button") && !(e.target as HTMLElement).closest(".action-menu")) {
        setOpenActionMenu(null);
      }
    };
    if (openActionMenu !== null) document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [openActionMenu]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded border border-gray-300">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Return Sales</h2>
            <p className="text-sm text-gray-600">
              Please use the table below to navigate or filter the results. You can download the table as excel and pdf.
            </p>
          </div>
          <button onClick={loadReturns} className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
            <RefreshCw size={14} /> Refresh
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={24} className="animate-spin text-blue-600" />
          </div>
        )}
        {fetchError && (
          <div className="flex items-center gap-2 p-4 text-red-600 text-sm border-b border-gray-100">
            <AlertTriangle size={16} /> {fetchError}
            <button onClick={loadReturns} className="ml-2 underline">Retry</button>
          </div>
        )}

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Show</span>
              <select className="px-2 py-1 border border-gray-300 rounded text-sm">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>
              <span className="text-sm text-gray-600">entries</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">Search:</span>
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm w-48"
                placeholder="reference, customer..."
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded overflow-visible">
            <div className="relative overflow-visible">
              <table className="w-full text-xs">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Date</th>
                    <th className="px-3 py-2 text-left font-medium">Reference No</th>
                    <th className="px-3 py-2 text-left font-medium">Sale Reference</th>
                    <th className="px-3 py-2 text-left font-medium">Customer</th>
                    <th className="px-3 py-2 text-left font-medium">Warehouse</th>
                    <th className="px-3 py-2 text-left font-medium">Sales Status</th>
                    <th className="px-3 py-2 text-left font-medium">Grand Total</th>
                    <th className="px-3 py-2 text-left font-medium">Paid</th>
                    <th className="px-3 py-2 text-left font-medium">Balance</th>
                    <th className="px-3 py-2 text-left font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {!loading && filteredReturns.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-3 py-8 text-center text-sm text-gray-400">
                        No return sales found
                      </td>
                    </tr>
                  )}
                  {filteredReturns.map((item, index) => (
                    <tr key={item.id ?? index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                      <td className="px-3 py-2">{fmtDate(item.date)}</td>
                      <td className="px-3 py-2 text-blue-600">{item.reference ?? "—"}</td>
                      <td className="px-3 py-2 text-blue-600">{item.saleReference ?? "—"}</td>
                      <td className="px-3 py-2">{item.customer ?? "—"}</td>
                      <td className="px-3 py-2">{item.warehouse ?? "—"}</td>
                      <td className="px-3 py-2">
                        <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs">
                          {item.salesStatus ?? "—"}
                        </span>
                      </td>
                      <td className="px-3 py-2">{fmtAmt(item.grandTotal)}</td>
                      <td className="px-3 py-2">{fmtAmt(item.paid)}</td>
                      <td className="px-3 py-2">{fmtAmt(item.balance)}</td>
                      <td className="relative px-3 py-2 overflow-visible">
                        <button onClick={() => toggleActionMenu(item.id ?? index)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                          Actions
                        </button>
                        {openActionMenu === (item.id ?? index) && (
                          <div className="action-menu absolute right-0 top-full mt-2 z-[999] w-60 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-2xl">
                            <button onClick={() => handleViewDetails(item)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                              👁️ Sale Details
                            </button>
                            <button onClick={() => handleViewPayments(item)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                              💳 View Payment
                            </button>
                            <button onClick={() => handleAddPayment(item)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                              ➕ Add Payment
                            </button>
                            <button className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                              📄 Download as PDF
                            </button>
                            <button onClick={() => handleEmailSale(item)} className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                              📧 Email Sale
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredReturns.length} of {returnSalesData.length} entries
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" disabled>Previous</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>

      <ViewDetailsModal isOpen={viewDetailsModal.isOpen} onClose={() => setViewDetailsModal({ isOpen: false, saleData: null })} saleData={viewDetailsModal.saleData} />
      <ViewPaymentModal isOpen={viewPaymentModal.isOpen} onClose={() => setViewPaymentModal({ isOpen: false, saleData: null })} saleData={viewPaymentModal.saleData} />
      <AddPaymentModal isOpen={addPaymentModal.isOpen} onClose={() => setAddPaymentModal({ isOpen: false, saleData: null })} saleData={addPaymentModal.saleData} />
      <EmailSaleModal isOpen={emailSaleModal.isOpen} onClose={() => setEmailSaleModal({ isOpen: false, saleData: null })} saleData={emailSaleModal.saleData} />
    </div>
  );
}
