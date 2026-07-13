import { Upload, Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";
import { getExpenses } from "../services/inventoryService";
import type { ExpenseOut } from "../types/inventory";

function fmtDate(iso: string) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function fmtAmt(val: number | string | undefined): string {
  if (val == null) return "—";
  return Number(val).toLocaleString("en-ZA", { minimumFractionDigits: 2 });
}

export function ListExpenses() {
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [search, setSearch] = useState("");
  const [expensesData, setExpensesData] = useState<ExpenseOut[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [menuPos, setMenuPos] = useState<{ top: number; left: number } | null>(null);
  const [activeExpense, setActiveExpense] = useState<ExpenseOut | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const [expenseNoteModal, setExpenseNoteModal] = useState<any>(null);
  const [editExpenseModal, setEditExpenseModal] = useState<any>(null);
  const [deleteExpenseModal, setDeleteExpenseModal] = useState<{
    isOpen: boolean;
    expenseId: number | null;
  }>({
    isOpen: false,
    expenseId: null,
  });

  const loadExpenses = useCallback(async () => {
    setLoading(true);
    setFetchError("");
    try {
      const data = await getExpenses();
      setExpensesData(data);
    } catch (e) {
      setFetchError(e instanceof Error ? e.message : "Failed to load expenses");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadExpenses(); }, [loadExpenses]);

  // Build autosuggestions from expense fields
  const expenseSuggestions = Array.from(
    new Set([
      ...expensesData.map((e) => e.reference ?? ""),
      ...expensesData.map((e) => e.warehouse),
      ...expensesData.map((e) => e.category),
    ])
  ).filter(Boolean).sort();

  // Filter by search
  const filteredExpenses = search.trim()
    ? expensesData.filter((e) =>
      (e.reference ?? "").toLowerCase().includes(search.toLowerCase()) ||
      e.warehouse.toLowerCase().includes(search.toLowerCase()) ||
      e.category.toLowerCase().includes(search.toLowerCase()) ||
      (e.note ?? "").toLowerCase().includes(search.toLowerCase())
    )
    : expensesData;

  const toggleActionMenu = (id: number, e: React.MouseEvent<HTMLButtonElement>) => {
    if (openActionMenu === id) { setOpenActionMenu(null); setMenuPos(null); return; }
    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
    const dropdownHeight = 140;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow >= dropdownHeight ? rect.bottom + 4 : rect.top - dropdownHeight - 4;
    setMenuPos({ top, left: rect.right - 224 });
    setOpenActionMenu(id);
    setActiveExpense(expensesData.find((d) => d.id === id) ?? null);
  };

  const handleExpenseNote = (item: any) => {
    setExpenseNoteModal(item);
    setOpenActionMenu(null);
    setMenuPos(null);
  };

  const handleEditExpense = (item: any) => {
    setEditExpenseModal(item);
    setOpenActionMenu(null);
    setMenuPos(null);
  };

  const handleDeleteExpense = (id: number) => {
    setDeleteExpenseModal({ isOpen: true, expenseId: id });
    setOpenActionMenu(null);
    setMenuPos(null);
  };

  const confirmDeleteExpense = () => {
    console.log("Deleted Expense");

    setDeleteExpenseModal({
      isOpen: false,
      expenseId: null,
    });
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        !(e.target as HTMLElement).closest(".action-btn") &&
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
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="rounded border border-gray-300 bg-white overflow-visible">
        <div className="flex items-center justify-between border-b border-gray-200 p-4">
          <div>
            <h2 className="mb-1 text-lg font-semibold text-gray-900">
              Expenses
            </h2>

            <p className="text-sm text-gray-600">
              Please use the table below to navigate or
              filter the results.
            </p>
          </div>

          <button
            onClick={() => setShowAddExpense(true)}
            className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
          >
            Add Expense
          </button>
        </div>

        <div className="p-4">
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
                suggestions={expenseSuggestions}
                placeholder="Search expenses..."
                inputClassName="!py-1 !rounded !border-gray-300 !text-sm"
                className="w-48"
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded border border-gray-300">
            <table className="w-full min-w-max text-sm">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Date
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Reference
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Warehouse
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Category
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Amount
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Note
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Created by
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredExpenses.map((item, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }
                  >
                    <td className="px-3 py-2 text-xs">
                      {item.date}
                    </td>

                    <td className="px-3 py-2 text-xs text-blue-600">
                      {item.reference}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.warehouse}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.category}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.amount}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.note}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.createdBy}
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
              Showing 1 to 5 of 15,339 entries
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
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl overflow-hidden rounded bg-white shadow-2xl">

            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
              <h3 className="text-lg font-semibold text-gray-800">
                ADD EXPENSE
              </h3>

              <button
                onClick={() => setShowAddExpense(false)}
                className="text-4xl leading-none text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <p className="mb-5 text-sm text-gray-600">
                Please fill in the information below.
                The field labels marked with * are required input fields.
              </p>

              <div className="space-y-4">

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Date *
                  </label>

                  <input
                    type="text"
                    defaultValue="14/05/2026 12:26"
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Reference
                  </label>

                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category
                  </label>

                  <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                    <option>Select Category</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Warehouse
                  </label>

                  <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                    <option>Select Warehouse</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Amount *
                  </label>

                  <input
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Attachment *
                  </label>

                  <div className="flex">
                    <input
                      className="flex-1 border border-gray-300 px-3 py-2 text-sm"
                    />

                    <button className="flex items-center gap-2 bg-blue-500 px-4 text-white">
                      <Upload size={14} />
                      Browse...
                    </button>
                  </div>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Note *
                  </label>

                  <div className="rounded border border-gray-300">

                    <div className="flex gap-3 border-b bg-gray-50 px-3 py-2 text-xs">
                      <button>B</button>
                      <button>I</button>
                      <button>U</button>
                      <button>≡</button>
                      <button>≣</button>
                      <button>🔗</button>
                      <button>{"</>"}</button>
                    </div>

                    <textarea
                      rows={6}
                      className="w-full resize-none px-3 py-3 outline-none"
                    />
                  </div>
                </div>

              </div>

              <div className="mt-6 flex justify-end">
                <button className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700">
                  Add Expense
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Expense Note Modal */}
      {expenseNoteModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-4xl rounded bg-white shadow-2xl">
            <div className="flex items-center justify-end p-4">
              <button
                onClick={() =>
                  setExpenseNoteModal(null)
                }
                className="text-4xl text-gray-300 hover:text-gray-500"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <h2 className="mb-8 text-5xl font-light text-gray-100">
                StockManager
              </h2>

              <h3 className="mb-8 text-2xl font-semibold">
                Hearing Aid Labs
              </h3>

              <div className="border border-gray-200 bg-gray-50 p-6">
                <div className="grid grid-cols-2 gap-y-6">
                  <div className="font-semibold">
                    Date
                  </div>

                  <div>
                    {expenseNoteModal.date}
                  </div>

                  <div className="font-semibold">
                    Reference
                  </div>

                  <div>
                    {expenseNoteModal.reference}
                  </div>

                  <div className="font-semibold">
                    Warehouse
                  </div>

                  <div>
                    {expenseNoteModal.warehouse}
                  </div>

                  <div className="font-semibold">
                    Amount
                  </div>

                  <div>
                    {expenseNoteModal.amount}
                  </div>
                </div>

                <div className="mt-6">
                  {expenseNoteModal.note}
                </div>
              </div>

              <div className="mt-24">
                <div className="w-60 border-t border-gray-400 pt-2 text-sm">
                  Stamp & Signature
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Expense Modal */}
      {editExpenseModal && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-2xl rounded bg-white shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-200 p-4">
              <h2 className="text-lg font-semibold">
                EDIT EXPENSE
              </h2>

              <button
                onClick={() =>
                  setEditExpenseModal(null)
                }
                className="text-4xl text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>

            <div className="p-4">
              <p className="mb-4 text-sm text-gray-600">
                Please fill in the information below.
              </p>

              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Date *
                  </label>

                  <input
                    type="text"
                    defaultValue={
                      editExpenseModal.date
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Reference *
                  </label>

                  <input
                    type="text"
                    defaultValue={
                      editExpenseModal.reference
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Category
                  </label>

                  <select className="w-full rounded border border-gray-300 px-3 py-2 text-sm">
                    <option>Select Category</option>
                  </select>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Warehouse
                  </label>

                  <input
                    type="text"
                    defaultValue={
                      editExpenseModal.warehouse
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Amount *
                  </label>

                  <input
                    type="text"
                    defaultValue={
                      editExpenseModal.amount
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Attachment
                  </label>

                  <button className="flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm text-white">
                    <Upload size={14} />
                    Browse
                  </button>
                </div>

                <div>
                  <label className="mb-1 block text-sm font-medium">
                    Note
                  </label>

                  <textarea
                    rows={5}
                    defaultValue={
                      editExpenseModal.note
                    }
                    className="w-full rounded border border-gray-300 px-3 py-2 text-sm"
                  />
                </div>
              </div>

              <div className="mt-6 flex justify-end">
                <button className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700">
                  Edit Expense
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Expense Modal */}
      {deleteExpenseModal.isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm overflow-hidden rounded bg-white shadow-2xl">
            <div className="border-b border-gray-200 bg-gray-100 px-4 py-3">
              <h2 className="text-lg font-semibold text-gray-800">
                Delete Expense
              </h2>
            </div>

            <div className="px-4 py-6">
              <p className="text-gray-700">
                Are you sure?
              </p>

              <div className="mt-6 flex justify-end gap-2">
                <button
                  onClick={confirmDeleteExpense}
                  className="bg-red-500 px-4 py-2 text-sm text-white hover:bg-red-600"
                >
                  Yes I'm sure
                </button>

                <button
                  onClick={() =>
                    setDeleteExpenseModal({
                      isOpen: false,
                      expenseId: null,
                    })
                  }
                  className="bg-gray-200 px-4 py-2 text-sm text-gray-700 hover:bg-gray-300"
                >
                  No
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Fixed-position action dropdown */}
      {openActionMenu !== null && menuPos && activeExpense && (
        <div
          ref={menuRef}
          className="action-menu-fixed fixed w-56 bg-white border border-gray-200 rounded-lg shadow-2xl overflow-hidden"
          style={{ top: menuPos.top, left: menuPos.left, zIndex: 99999 }}
        >
          <button
            onClick={() => handleExpenseNote(activeExpense)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
          >
            📝 Expense Note
          </button>
          <button
            onClick={() => handleEditExpense(activeExpense)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-700 transition hover:bg-gray-100"
          >
            ✏️ Edit Expense
          </button>
          <button
            onClick={() => handleDeleteExpense(activeExpense.id)}
            className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-red-600 transition hover:bg-red-50"
          >
            🗑️ Delete Expense
          </button>
        </div>
      )}
    </div>
  );
}