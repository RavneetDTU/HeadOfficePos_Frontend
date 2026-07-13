import { Download, Upload } from "lucide-react";

export function AddPurchaseByCSV() {
  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <div className="bg-white rounded border border-gray-300 p-4">
        <div className="mb-4">
          <h2 className="text-lg font-semibold text-gray-900 mb-1">Add Purchase by CSV</h2>
          <p className="text-sm text-gray-600">
            Please fill in the information below. The field labels marked with * are required input fields.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
            <input
              type="datetime-local"
              defaultValue="2025-12-24T13:08"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
            <input
              type="text"
              defaultValue="PO2025/045/V1/0013"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm bg-gray-50"
              readOnly
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse *</label>
            <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>HEAD OFFICE</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>Received</option>
              <option>Preordered</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Supplier *</label>
            <div className="flex items-center gap-2">
              <select className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>Hearing Aid Labs - HEAD OFFICE</option>
              </select>
              <button className="p-1.5 text-blue-600">
                <Upload size={16} />
              </button>
            </div>
          </div>
        </div>

        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-900 mb-2">
            The first line in downloaded csv file should remain as it is. Please do not change the order of columns.
          </p>
          <p className="text-sm text-blue-900 mb-2">
            The correct column order is (Product Code, Net Unit Price, Quantity, Product Variant, Tax Rate Name, Discount, Serial No. End Date) & you must follow this.
          </p>
          <p className="text-sm text-blue-900">
            Make sure you configure all tax rates before you start importing.
          </p>
          <p className="text-sm text-blue-900 mt-2">
            The date format should be: yyyy-mm-dd
          </p>
          <p className="text-sm text-blue-900">
            Price three columns are optional.
          </p>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">CSV File *</label>
          <div className="flex items-center gap-2">
            <input
              type="file"
              accept=".csv"
              className="flex-1 px-2 py-1.5 border border-gray-300 rounded text-sm"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Attach Document</label>
          <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700 flex items-center gap-2">
            <Upload size={14} />
            Browse
          </button>
        </div>

        <div className="mb-2">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" className="rounded border-gray-300" />
            More Options
          </label>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Order Tax</label>
            <select className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
              <option>NO VAT</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Discount (0/0%)</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Shipping</label>
            <input
              type="text"
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
          <div className="border border-gray-300 rounded">
            <div className="border-b border-gray-300 bg-gray-50 px-2 py-1 flex gap-1 text-xs">
              <button className="px-1 hover:bg-gray-200 rounded">B</button>
              <button className="px-1 hover:bg-gray-200 rounded">I</button>
              <button className="px-1 hover:bg-gray-200 rounded">U</button>
            </div>
            <textarea
              rows={3}
              className="w-full px-2 py-1.5 text-sm focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="flex justify-start gap-2 mt-4">
          <button className="px-4 py-1.5 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}
