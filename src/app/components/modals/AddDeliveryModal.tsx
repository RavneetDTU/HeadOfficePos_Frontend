import { X } from "lucide-react";

interface AddDeliveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
}

export function AddDeliveryModal({ isOpen, onClose, saleData }: AddDeliveryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Add delivery</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Sale Info Text */}
          <p className="text-xs text-gray-600 mb-4">
            Please fill in the information below. This Sale status and QTY will required from Sales.
            <br />
            Date *
          </p>

          {/* Form Fields */}
          <div className="space-y-4 mb-4">
            <div>
              <input
                type="text"
                defaultValue="13/05/2026 21:53"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Delivery Reference No (*)
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Delivery Note (*)
              </label>
              <input
                type="text"
                defaultValue="THE DELIVERY NOTE WILL"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Attachment (*)
              </label>
              <button className="px-4 py-2 bg-blue-600 text-white rounded text-sm hover:bg-blue-700">
                Choose File
              </button>
            </div>
          </div>

          {/* Message */}
          <div className="mb-4">
            <label className="block text-xs text-gray-600 mb-1">
              Message
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
                defaultValue="I WAS WHEN I COME ON TO RECEIVE A FORM, ADDRESS (WORKING DAY ONLY CONTACT: dr. 2786689038 Email: 3756678918@qq.com"
                className="w-full px-3 py-2 text-sm focus:outline-none resize-none"
              />
            </div>
          </div>

          {/* Note */}
          <div className="mb-6">
            <label className="block text-xs text-gray-600 mb-1">
              Note
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

          {/* Add Delivery Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Add Delivery
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
