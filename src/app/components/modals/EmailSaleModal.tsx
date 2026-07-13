import { X } from "lucide-react";

interface EmailSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
}

export function EmailSaleModal({ isOpen, onClose, saleData }: EmailSaleModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Email Sale</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Sale Info Text */}
          <p className="text-xs text-gray-600 mb-4">
            Please fill in the information below. This Sale status and QTY will required from Sales.
            <br />
            To *
          </p>

          {/* Form Fields */}
          <div className="space-y-4 mb-4">
            <div>
              <label className="block text-xs text-gray-600 mb-1">
                CC
              </label>
              <input
                type="email"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Email *
              </label>
              <input
                type="email"
                defaultValue="email@gmail.com"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs text-gray-600 mb-1">
                Subject *
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
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
              <div className="px-3 py-2 text-sm space-y-2">
                <p className="font-semibold">(logo)</p>
                <p>Dear Customer,</p>
                <p className="text-xs">
                  Please find the attachment for per your order (reference: company), quote, Sale, regards.
                </p>
                <p className="text-xs">Best regards</p>
              </div>
            </div>
          </div>

          {/* Send Email Button */}
          <div className="flex justify-end">
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Send Email
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
