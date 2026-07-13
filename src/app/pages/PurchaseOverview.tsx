import { useState, useEffect } from "react";
import { Loader2, AlertTriangle, RefreshCw } from "lucide-react";
import { NotWorking } from "./NotWorking";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";
import { getPurchasesOverview } from "../services/inventoryService";
import type { PurchaseOverview as PurchaseOverviewType } from "../types/inventory";

export function PurchaseOverview() {
  const [notWorkingModal, setNotWorkingModal] = useState(false);
  const [search, setSearch] = useState("");
  const [overview, setOverview] = useState<PurchaseOverviewType | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const data = await getPurchasesOverview();
        setOverview(data);
      } catch (e) {
        setFetchError(e instanceof Error ? e.message : "Failed to load overview");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const overviewData = [
    {
      subject: "[Image]",
      problemsCode: "01/17/936 CN-V170 1101",
      productStatus:
        "Hearing Aids/Labs - another - To [not set]",
      quantity: "2,511",
      preordered: "10",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "365",
      productStatus: "11 years of AS",
      quantity: "0.006",
      preordered: "10",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "091/06200 CN-ZN2 1105",
      productStatus:
        "Hearing Aids/Labs - another - To [not set]",
      quantity: "3,677",
      preordered: "0",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "03/1746 77A-17178 1104",
      productStatus: "KTHZALR Ellement and Mold Re 1178",
      quantity: "4",
      preordered: "1",
      received: "1",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "03/1746 77A-17178 1104",
      productStatus:
        "Will Sale 1 - Left (Small Size-) AudioFit (digital)6",
      quantity: "21",
      preordered: "1",
      received: "1",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "03/1746 77A-11178 1104",
      productStatus: "KTHZALR Ellement and Mold Re 1178",
      quantity: "1",
      preordered: "0",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "03/1746 77A-11178 1104",
      productStatus:
        "KTHZALR Ellement and Mold Re AudioFit (digital)6",
      quantity: "21",
      preordered: "0",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "03/1746 77A-11178 1104",
      productStatus: "KTHZALR Ellement and Mold Re 1178",
      quantity: "21",
      preordered: "0",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "01/1213 RRR-12-170 1104",
      productStatus: "VAG 31 CHARCOAL METALLIC",
      quantity: "14",
      preordered: "0",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "01/1621 MH-NAJ-11181 1105",
      productStatus: "WIDEX - Starlight 6 (right) 6",
      quantity: "49",
      preordered: "0",
      received: "0",
      returned: "0",
    },
    {
      subject: "[Select Finance]",
      problemsCode: "01/1621 MH-NAJ-11181 1105",
      productStatus: "WIDEX - Starlight 6 (right) 6",
      quantity: "21",
      preordered: "0",
      received: "0",
      returned: "0",
    },
  ];

  const overviewSuggestions = Array.from(
    new Set([
      ...overviewData.map((d) => d.problemsCode),
      ...overviewData.map((d) => d.productStatus),
    ])
  ).sort();

  const filteredOverview = search.trim()
    ? overviewData.filter(
        (d) =>
          d.problemsCode.toLowerCase().includes(search.toLowerCase()) ||
          d.productStatus.toLowerCase().includes(search.toLowerCase())
      )
    : overviewData;

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded border border-gray-300">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">
            Purchases (Ordered/Preordered/Backordered)
          </h2>

          <p className="text-sm text-gray-600">
            Please use the table below to navigate or filter the
            results. You can download the table as excel and
            pdf.
          </p>
        </div>

        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">
                Show
              </span>

              <select className="px-2 py-1 border border-gray-300 rounded text-sm">
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
                suggestions={overviewSuggestions}
                placeholder="Search product code or name..."
                inputClassName="!py-1 !rounded !border-gray-300 !text-sm"
                className="w-48"
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">
                    Image
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Product Code
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Product Name
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Quantity
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Preordered
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Ordered
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Backordered
                  </th>

                  <th className="px-3 py-2 text-left font-medium">
                    Actions
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {filteredOverview.map((item, index) => (
                  <tr
                    key={index}
                    className={
                      index % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    }
                  >
                    <td className="px-3 py-2 text-xs">
                      {item.subject}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.problemsCode}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.productStatus}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.quantity}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.preordered}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.received}
                    </td>

                    <td className="px-3 py-2 text-xs">
                      {item.returned}
                    </td>

                    <td className="px-3 py-2">
                      <button
                        onClick={() => setNotWorkingModal(true)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                      >
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
              Showing 1 to 10 of 10,339 entries
            </div>

            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Previous
              </button>

              <button className="px-3 py-1 bg-blue-600 text-white rounded text-sm">
                1
              </button>

              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                2
              </button>

              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                3
              </button>

              <button className="px-3 py-1 border border-gray-300 rounded text-sm hover:bg-gray-50">
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      {notWorkingModal && (
        <div
          className="fixed inset-0 z-[9999]"
          onClick={() => setNotWorkingModal(false)}
        >
          <NotWorking />
        </div>
      )}
    </div>
  );
}