import { X } from "lucide-react";

interface ViewPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
}

export function ViewPaymentModal({ isOpen, onClose, saleData }: ViewPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Sale Details</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Sale Information */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Sale Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sale Number:</span>
                  <span className="font-medium">SAL2724</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Reference:</span>
                  <span className="font-medium">SAL/2026/05/29/14477</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Date:</span>
                  <span className="font-medium">13/05/2025 15:10</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Sale Status:</span>
                  <span className="font-medium text-green-600">Completed</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Payment Status:</span>
                  <span className="font-medium text-green-600">Paid</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Customer Information</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Customer:</span>
                  <span className="font-medium">Phillip</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Address:</span>
                  <span className="font-medium">14 CARNATION ROAD</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">City:</span>
                  <span className="font-medium">BLUFF HILZON</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Postal Code:</span>
                  <span className="font-medium">4026537</span>
                </div>
              </div>
            </div>
          </div>

          {/* Products */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Products</h3>
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Product</th>
                    <th className="px-3 py-2 text-left font-medium">Quantity</th>
                    <th className="px-3 py-2 text-left font-medium">Unit Price</th>
                    <th className="px-3 py-2 text-left font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="bg-gray-50">
                    <td className="px-3 py-2">Rentry Mini Printer - audibox - 123 Stock of A3 LOT1-002-IW4-17200</td>
                    <td className="px-3 py-2">1</td>
                    <td className="px-3 py-2">50.00</td>
                    <td className="px-3 py-2">50.00</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals */}
          <div className="flex justify-end mb-6">
            <div className="w-64 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount (ZAR)</span>
                <span className="font-semibold">50.00</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Paid (ZAR)</span>
                <span className="font-semibold text-green-600">50.00</span>
              </div>
              <div className="flex justify-between pt-2 border-t">
                <span className="font-semibold">Balance (ZAR)</span>
                <span className="font-semibold">0.00</span>
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-gray-50 rounded p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-2">Additional Information</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>Created by: Joshua Blatter</p>
              <p>Created Date: 13/05/2025 15:10</p>
              <p>Delivered Date: 20/05/2025 15:10</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Close
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Print
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
