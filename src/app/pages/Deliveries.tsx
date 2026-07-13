import { useEffect, useState } from "react";
import { DeleteConfirmModal } from "../components/modals/DeleteConfirmModal";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";

export function Deliveries() {
  const [openActionMenu, setOpenActionMenu] = useState<number | null>(null);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState(false);
  const [search, setSearch] = useState("");

  const deliveriesData = [
    {
      date: "19/01/2024 09:46:00",
      reference: "DOSS72024/0A/",
      saleReference: "SAL/2024/03/19/978",
      customer: "Mrs Sarah Nene Caroline",
      customerPhone: "No cell given 0848491414 babalasekoloSM@gmail.com",
    },
    {
      date: "11/02/2024",
      reference: "SAL/22024/049/2024/9175",
      saleReference: "SAL/22024/049/2024/9173",
      customer: "Rebone",
      customerPhone: "Marake NO 435 10 938 kobo12@realestatemoz.co.za Rebone Marake Africa",
    },
    {
      date: "08/02/2024 15:19:01",
      reference: "SAL/2024/038/43516",
      saleReference: "SAL/2024/03/19/794",
      customer: "Lesego",
      customerPhone: "No contact NO cell given Lesego Lesego",
    },
    {
      date: "11/02/2024",
      reference: "SAL/22024/049/2024/9175",
      saleReference: "SAL/22024/049/2024/9173",
      customer: "Rebone",
      customerPhone: "Marake NO 435 10 938 kobo12@realestatemoz.co.za Rebone Marake Africa",
    },
    {
      date: "11/02/2024",
      reference: "SAL/22024/049/2024/9175",
      saleReference: "SAL/22024/049/2024/9173",
      customer: "Rebone",
      customerPhone: "Marake NO 435 10 938 kobo12@realestatemoz.co.za Rebone Marake Africa",
    },
  ].map((d, i) => ({ ...d, id: i + 1 }));

  const deliverySuggestions = Array.from(
    new Set([
      ...deliveriesData.map((d) => d.customer),
      ...deliveriesData.map((d) => d.reference),
      ...deliveriesData.map((d) => d.saleReference),
    ])
  ).sort();

  const filteredDeliveries = search.trim()
    ? deliveriesData.filter(
        (d) =>
          d.customer.toLowerCase().includes(search.toLowerCase()) ||
          d.reference.toLowerCase().includes(search.toLowerCase()) ||
          d.saleReference.toLowerCase().includes(search.toLowerCase())
      )
    : deliveriesData;

  const toggleActionMenu = (id: number) => setOpenActionMenu(prev => prev === id ? null : id);
  const handleDeleteDelivery = () => setDeleteConfirmModal(true);
  const confirmDeleteDelivery = () => { console.log('Deleted'); setOpenActionMenu(null); };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('button') && !(e.target as HTMLElement).closest('.action-menu')) {
        setOpenActionMenu(null);
      }
    };
    if (openActionMenu !== null) document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [openActionMenu]);

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded border border-gray-300">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Deliveries</h2>
          <p className="text-sm text-gray-600">
            Please use the table below to navigate or filter the results. You can download the table as excel and pdf.
          </p>
        </div>

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
                suggestions={deliverySuggestions}
                placeholder="Search customer, reference..."
                inputClassName="py-1 rounded border-gray-300 text-sm"
                className="w-48"
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded overflow-visible">
            <div className="relative overflow-visible">
              <table className="w-full text-sm">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Date</th>
                  <th className="px-3 py-2 text-left font-medium">Reference No</th>
                  <th className="px-3 py-2 text-left font-medium">Sale Reference No</th>
                  <th className="px-3 py-2 text-left font-medium">Customer</th>
                  <th className="px-3 py-2 text-left font-medium">Address</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredDeliveries.map((delivery, index) => (
                  <tr key={index} className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 text-xs">{delivery.date}</td>
                    <td className="px-3 py-2 text-xs text-blue-600">{delivery.reference}</td>
                    <td className="px-3 py-2 text-xs text-blue-600">{delivery.saleReference}</td>
                    <td className="px-3 py-2 text-xs">{delivery.customer}</td>
                    <td className="px-3 py-2 text-xs">{delivery.customerPhone}</td>
                    <td className="relative px-3 py-2 overflow-visible">
                      <button onClick={() => toggleActionMenu(delivery.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700">
                        Actions
                      </button>
                      {openActionMenu === delivery.id && (
                        <div className="
    action-menu
    absolute
    right-0
    top-full
    mt-2
    z-[999]
    w-60
    overflow-hidden
    rounded-xl
    border
    border-gray-200
    bg-white
    shadow-2xl
  ">
                          <button className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                            <span>📋</span> Delivery Details
                          </button>
                          <button className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                            <span>✏️</span> Edit Delivery
                          </button>
                          <button className="w-full px-4 py-2 text-left text-xs hover:bg-gray-100 flex items-center gap-2">
                            <span>📄</span> Download as PDF
                          </button>
                          <button onClick={handleDeleteDelivery} className="w-full px-4 py-2 text-left text-xs hover:bg-red-50 text-red-600 flex items-center gap-2">
                            <span>🗑️</span> Delete Delivery
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
            <div className="text-sm text-gray-600">Showing 1 to 3 of 3 entries</div>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Previous</button>
              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">1</button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">Next</button>
            </div>
          </div>
        </div>
      </div>
      <DeleteConfirmModal isOpen={deleteConfirmModal} onClose={() => setDeleteConfirmModal(false)} onConfirm={confirmDeleteDelivery} />
    </div>
  );
}
