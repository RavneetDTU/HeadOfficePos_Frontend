import { X } from "lucide-react";

interface AddPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
}

export function AddPaymentModal({ isOpen, onClose, saleData }: AddPaymentModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-2xl">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Add Payment</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Payment Form */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                <input
                  type="date"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  defaultValue="2025-05-13"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reference No</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="Enter reference number"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Paying By *</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option>Cash</option>
                  <option>Card</option>
                  <option>Bank Transfer</option>
                  <option>Cheque</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Type</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option>Received</option>
                  <option>Sent</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account</label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded text-sm">
                  <option>Select Account</option>
                  <option>Main Account</option>
                  <option>Secondary Account</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Note</label>
              <textarea
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm resize-none"
                placeholder="Enter payment note..."
              ></textarea>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Attachment</label>
              <input
                type="file"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end gap-3 mt-6 pt-4 border-t">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              Submit Payment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
