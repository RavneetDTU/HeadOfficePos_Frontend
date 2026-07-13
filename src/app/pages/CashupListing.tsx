import { useState, useEffect, useRef } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";
import { getSalesCashups } from "../services/inventoryService";
import type { CashupOut } from "../types/inventory";

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

export function CashupListing() {
  const [search, setSearch] = useState("");
  const [cashupData, setCashupData] = useState<CashupOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const loadCashups = async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getSalesCashups();
      setCashupData(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load cashups");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadCashups(); }, []);

  // Legacy shape compatibility — API returns CashupOut
  const cashupDataLegacy = cashupData.map(c => ({
    id: c.id,
    warehouse: c.warehouse,
    closeDate: fmtDate(c.date),
    branchSlip: c.entered_by ?? "—",
    attachmentSlip: "",
    cashupAmount: c.actual_counted.toLocaleString("en-ZA", { minimumFractionDigits: 2 }),
    creditCard: c.difference.toLocaleString("en-ZA", { minimumFractionDigits: 2 }),
  }));

  const STATIC_LEGACY: typeof cashupDataLegacy = [
    {
      id: 7,
      warehouse: "WARTLES",
      closeDate: "2025-06-05",
      branchSlip: "N",
      attachmentSlip: "7ec9A62b/U/sNXbM4XJqbPy9/XbZesoj",
      cashupAmount: "0",
      creditCard: "0",
    },
    {
      id: 3,
      warehouse: "LOMPOBFACH",
      closeDate: "2025-06-05",
      branchSlip: "0",
      attachmentSlip: "",
      cashupAmount: "0",
      creditCard: "0",
    },
    {
      id: 8,
      warehouse: "CAPETOWN1",
      closeDate: "2025-06-05",
      branchSlip: "1398",
      attachmentSlip: "",
      cashupAmount: "1400",
      creditCard: "0",
    },
    {
      id: 4,
      warehouse: "BLUET",
      closeDate: "2025-06-05",
      branchSlip: "1398",
      attachmentSlip: "d/Y31sVxfYa0F3E9/H/1Jx6z3h/gvxg",
      cashupAmount: "122",
      creditCard: "0",
    },
    {
      id: 9,
      warehouse: "NEWCASTLE",
      closeDate: "2025-06-05",
      branchSlip: "1398",
      attachmentSlip: "7Rc9A62b/U/sNXbM4XJqbPy9/XbZesoj",
      cashupAmount: "1335",
      creditCard: "0",
    },
    {
      id: 10,
      warehouse: "WELKOM",
      closeDate: "2025-06-05",
      branchSlip: "1398",
      attachmentSlip: "d/Ac9A62b/U/sNXbM4XJqbPy9/XbZesoj",
      cashupAmount: "1195",
      creditCard: "0",
    },
    {
      id: 11,
      warehouse: "KLEOF",
      closeDate: "2025-06-12",
      branchSlip: "1799",
      attachmentSlip: "dzx95j911j39b8911j01/1z/Yoce9P0j09",
      cashupAmount: "2550",
      creditCard: "0",
    },
    {
      id: 12,
      warehouse: "MPUMALNGA",
      closeDate: "2025-06-08",
      branchSlip: "1639",
      attachmentSlip: "cP/JYe7Yb21da20Zs11k/0Px9X71",
      cashupAmount: "0",
      creditCard: "0",
    },
    {
      id: 13,
      warehouse: "CASCADES",
      closeDate: "2025-06-10",
      branchSlip: "918",
      attachmentSlip: "1994xccUbZdh1HSHa0P4m7r723.jpg",
      cashupAmount: "3142",
      creditCard: "0",
    },
    {
      id: 14,
      warehouse: "MUSGRARE",
      closeDate: "2025-06-09",
      branchSlip: "1601",
      attachmentSlip: "a6a9f2334847121a62f489/a3a18375.png",
      cashupAmount: "125",
      creditCard: "0",
    },
  ];

  // Use real API data if loaded, else fall back to static demo data
  const displayData = !loading && cashupDataLegacy.length > 0 ? cashupDataLegacy : (!loading ? STATIC_LEGACY : []);

  // Build suggestions and filter
  const cashupSuggestions = Array.from(
    new Set(displayData.map((c) => c.warehouse))
  ).sort();

  const filteredCashup = search.trim()
    ? displayData.filter(
        (c) =>
          c.warehouse.toLowerCase().includes(search.toLowerCase()) ||
          String(c.id).includes(search) ||
          c.branchSlip.toLowerCase().includes(search.toLowerCase())
      )
    : displayData;

  const [openActionMenu, setOpenActionMenu] = useState<
    number | null
  >(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [activeCashup, setActiveCashup] = useState<(typeof displayData)[0] | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [deleteModal, setDeleteModal] = useState<{
    isOpen: boolean;
    cashupId: number | null;
  }>({
    isOpen: false,
    cashupId: null,
  });

  const toggleActionMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openActionMenu === id) { setOpenActionMenu(null); setMenuPos(null); return; }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const dropdownHeight = 110;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4;
    setMenuPos({ top, left: rect.right - 208 });
    setOpenActionMenu(id);
    setActiveCashup(displayData.find((c) => c.id === id) ?? null);
  };

  const handleDeleteClick = (id: number) => {
    setDeleteModal({ isOpen: true, cashupId: id });
    setOpenActionMenu(null);
    setMenuPos(null);
  };

  const handleDeleteConfirm = () => {
    console.log("Deleted:", deleteModal.cashupId);
    setDeleteModal({ isOpen: false, cashupId: null });
  };

  const handleDownload = (item: any) => {
    console.log("Download:", item);
    setOpenActionMenu(null);
    setMenuPos(null);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest(".action-menu-fixed") && !target.closest(".action-btn")) {
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="rounded border border-gray-300 bg-white overflow-visible">
        <div className="border-b border-gray-200 p-4 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Cashup (All Warehouses)
            </h2>
            <p className="text-sm text-gray-600">
              Please use the table below to navigate or filter the results. You can download the table as excel and pdf.
            </p>
          </div>
          <button onClick={loadCashups} className="flex items-center gap-1 text-sm text-gray-500 border border-gray-200 rounded-lg px-3 py-1.5 hover:bg-gray-50">
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
            <button onClick={loadCashups} className="ml-2 underline">Retry</button>
          </div>
        )}

        <div className="p-4">
          <div className="mb-4 grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Start Date
              </label>

              <input
                type="date"
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                End Date
              </label>

              <input
                type="date"
                className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
              />
            </div>
          </div>

          <div className="mb-4 flex items-center justify-end">
            <button className="rounded bg-blue-600 px-4 py-1.5 text-sm text-white hover:bg-blue-700">
              Search
            </button>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Show
              </span>

              <select className="rounded border border-gray-300 px-2 py-1 text-sm">
                <option>10</option>
                <option>25</option>
                <option>50</option>
              </select>

              <span className="text-sm text-gray-600">
                entries
              </span>
            </div>

            <div className="flex items-center gap-2">
              <SearchAutosuggest
                value={search}
                onChange={setSearch}
                suggestions={cashupSuggestions}
                placeholder="Search warehouse..."
                inputClassName="!py-1 !rounded !border-gray-300 !text-sm"
                className="w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-gray-300">
            <table className="relative w-full min-w-max text-sm">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    ID
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Warehouse
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Close Date
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Branch Slip Number
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Attachment Slip
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Cashup Amount
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Credit-card Amount
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredCashup.map((item, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }
                  >
                    <td className="px-3 py-2 text-xs">
                      {item.id}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.warehouse}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.closeDate}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.branchSlip}
                    </td>

                    <td className="break-all px-3 py-2 text-xs text-blue-600">
                      {item.attachmentSlip}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.cashupAmount}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.creditCard}
                    </td>

                    <td className="px-3 py-2">
                      <button
                        onClick={(e) => toggleActionMenu(item.id, e)}
                        className="action-btn rounded bg-blue-600 px-3 py-1 text-xs text-white hover:bg-blue-700"
                      >
                        Actions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              Showing 1 to 10 of 26 entries
            </div>

            <div className="flex gap-1">
              <button className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                Previous
              </button>

              <button className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
                1
              </button>

              <button className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                2
              </button>

              <button className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                3
              </button>

              <button className="rounded border border-gray-300 px-3 py-1 text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {deleteModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/30 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gray-100 px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-800">Delete Cashup</h2>
            </div>
            <div className="px-4 py-6">
              <p className="text-gray-700">Are you sure?</p>
              <div className="mt-6 flex justify-end gap-2">
                <button onClick={handleDeleteConfirm} className="bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600">
                  Yes I'm sure
                </button>
                <button onClick={() => setDeleteModal({ isOpen: false, cashupId: null })} className="bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300">
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Fixed-position action dropdown */}
      {openActionMenu !== null && menuPos && activeCashup && (
        <div
          ref={menuRef}
          className="action-menu-fixed fixed w-52 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
        >
          <button
            onClick={() => handleDeleteClick(activeCashup.id)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
          >
            🗑️ Delete Cashup
          </button>
          <button
            onClick={() => handleDownload(activeCashup)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
          >
            📄 Download Slip
          </button>
        </div>
      )}
    </div>
  );
}