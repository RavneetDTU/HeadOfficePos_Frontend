import { useState } from "react";
import { SearchAutosuggest } from "../components/ui/SearchAutosuggest";

export function ListGiftCards() {
  const [search, setSearch] = useState("");
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded border border-gray-300">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Gift Cards</h2>
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
                suggestions={[]}
                placeholder="Search card, customer..."
                inputClassName="py-1 rounded border-gray-300 text-sm"
                className="w-48"
              />
            </div>
          </div>

          <div className="border border-gray-300 rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-blue-500 text-white">
                <tr>
                  <th className="px-3 py-2 text-left font-medium">Card No</th>
                  <th className="px-3 py-2 text-left font-medium">Value</th>
                  <th className="px-3 py-2 text-left font-medium">Balance</th>
                  <th className="px-3 py-2 text-left font-medium">Created by</th>
                  <th className="px-3 py-2 text-left font-medium">Customer</th>
                  <th className="px-3 py-2 text-left font-medium">Expiry</th>
                  <th className="px-3 py-2 text-left font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-gray-500">
                    No data available in table
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between mt-4">
            <div className="text-sm text-gray-600">Showing 0 to 0 of 0 entries</div>
            <div className="flex gap-1">
              <button className="px-3 py-1 border border-gray-300 rounded text-sm" disabled>Previous</button>
              <button className="px-3 py-1 border border-gray-300 rounded text-sm" disabled>Next</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
