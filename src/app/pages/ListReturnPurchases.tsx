import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";
import { getPurchaseReturns } from "../services/inventoryService";
import type { PurchaseReturnOut } from "../types/inventory";

function fmtDate(iso: string | undefined) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtAmt(val: number | string | undefined) {
  if (val == null) return "—";
  return Number(val).toLocaleString("en-ZA", { minimumFractionDigits: 2 });
}

export function ListReturnPurchases() {
  const [search, setSearch] = useState("");
  const [returnPurchasesData, setReturnPurchasesData] = useState<PurchaseReturnOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const loadReturns = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getPurchaseReturns();
      setReturnPurchasesData(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load purchase returns");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadReturns(); }, []);

  const returnPurchaseSuggestions = Array.from(
    new Set([
      ...returnPurchasesData.map((d) => String(d.reference ?? "")),
      ...returnPurchasesData.map((d) => String(d.supplier ?? "")),
    ])
  ).filter(Boolean).sort();

  const filteredReturnPurchases = search.trim()
    ? returnPurchasesData.filter(
        (d) =>
          String(d.reference ?? "").toLowerCase().includes(search.toLowerCase()) ||
          String(d.purchaseReference ?? "").toLowerCase().includes(search.toLowerCase()) ||
          String(d.supplier ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : returnPurchasesData;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded border border-gray-300">
        <div className="p-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Return Purchases</h2>
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
              <SearchAutosuggest
                value={search}
                onChange={setSearch}
                suggestions={returnPurchaseSuggestions}
                placeholder="Search reference, supplier..."
                inputClassName="!py-1 !rounded !border-gray-300 !text-sm"
                className="w-48"
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Reference No</th>
                  <th className="px-3 py-2 text-left font-medium">Purchase Reference</th>
                  <th className="px-3 py-2 text-left font-medium">Supplier</th>
                  <th className="px-3 py-2 text-left font-medium">Surcharge</th>
                  <th className="px-3 py-2 text-left font-medium">Grand Total</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {!loading && filteredReturnPurchases.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-sm text-gray-400">
                      No purchase returns found
                    </td>
                  </tr>
                )}
                {filteredReturnPurchases.map((item, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 text-xs">{fmtDate(item.date)}</td>
                    <td className="px-3 py-2 text-xs text-blue-600">{item.reference ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-blue-600">{(item as any).purchaseReference ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{item.supplier ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{fmtAmt(item.surcharge)}</td>
                    <td className="px-3 py-2 text-xs">{fmtAmt(item.grandTotal)}</td>
                    <td className="px-3 py-2">
                      <button className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                        Actions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">
              Showing {filteredReturnPurchases.length} of {returnPurchasesData.length} entries
            </div>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm" disabled>Previous</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
