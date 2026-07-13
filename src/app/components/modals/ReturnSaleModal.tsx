import { X } from "lucide-react";

interface ReturnSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
}

export function ReturnSaleModal({ isOpen, onClose, saleData }: ReturnSaleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-5xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Return Sale</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Sale Info Text */}
          <p className="text-xs text-gray-600 mb-4">
            Please fill in the information below. This Sale status and QTY will required from Sales.
          </p>

          {/* Top Form Fields */}
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Date *
              </label>
              <input
                type="date"
                defaultValue="2026-05-13"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reference No
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Return Received *
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500">
                <option>Select Option</option>
              </select>
            </div>
          </div>

          {/* Attach Document */}
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attach Document
            </label>
            <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
              Choose File
            </button>
          </div>

          {/* Note Text */}
          <p className="text-xs text-gray-600 mb-4">
            Note: You can upload sales documents like invoice if you don't use point of sale, but only if it needs delivered
          </p>

          {/* Product Name Table */}
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Product Name</h3>
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-2 py-2 text-left">Reference No</th>
                    <th className="px-2 py-2 text-left">Product name</th>
                    <th className="px-2 py-2 text-left">Warranty</th>
                    <th className="px-2 py-2 text-left">Delivered Quantity</th>
                    <th className="px-2 py-2 text-left">Delivered</th>
                    <th className="px-2 py-2 text-left">Comment</th>
                    <th className="px-2 py-2 text-left">Product No</th>
                    <th className="px-2 py-2 text-left">Delivered Qty</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="px-2 py-2">2 TH: Need</td>
                    <td className="px-2 py-2">100.00 - Product No</td>
                    <td className="px-2 py-2">USD</td>
                    <td className="px-2 py-2">Sale No</td>
                    <td className="px-2 py-2">USD</td>
                    <td className="px-2 py-2">Deliver Ammout</td>
                    <td className="px-2 py-2">100.00</td>
                    <td className="px-2 py-2">(Insert Amount)</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Yellow Highlighted Section */}
          <div className="bg-yellow-100 border border-yellow-300 rounded p-3 mb-4">
            <p className="text-xs font-medium">
              Payment Reference No Return 2 TH: Need Delivered: Product No USD: Sale No USD: Deliver Ammout 100.00
            </p>
          </div>

          {/* Payment Reference No */}
          <div className="bg-green-50 border border-green-200 rounded p-4 mb-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Payment Reference No</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Paying By
                </label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Return Note */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Return Note
            </label>
            <div className="border border-gray-300 rounded">
              <div className="border-b border-gray-300 bg-gray-50 px-2 py-1 flex gap-1 text-xs">
                <button className="px-1 hover:bg-gray-200 rounded font-semibold">B</button>
                <button className="px-1 hover:bg-gray-200 rounded italic">I</button>
                <button className="px-1 hover:bg-gray-200 rounded underline">U</button>
                <span className="text-gray-300 mx-1">|</span>
                <button className="px-1 hover:bg-gray-200 rounded">≡</button>
                <button className="px-1 hover:bg-gray-200 rounded">≣</button>
                <button className="px-1 hover:bg-gray-200 rounded">☰</button>
              </div>
              <textarea
                rows={3}
                className="w-full px-3 py-2 text-sm focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
