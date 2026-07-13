import { X } from "lucide-react";

interface ProposeRefundModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
}

export function ProposeRefundModal({ isOpen, onClose, saleData }: ProposeRefundModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Refund Proposal</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={24} />
            </button>
          </div>

          {/* Company Info and Barcodes Section */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            {/* Left Side - Company Info */}
            <div>
              <div className="mb-4">
                <p className="text-sm font-semibold">HEARING AID LABS BLUFF(PTY) LTD</p>
                <p className="text-xs text-gray-600">Shop A5A, Hillcrest east, Port</p>
                <p className="text-xs text-gray-600">Shepstone, Limpopo</p>
                <p className="text-xs text-gray-600">1234</p>
                <p className="text-xs text-gray-600">Tel: 0119400283</p>
                <p className="text-xs text-gray-600">Email: HearingAid@lab.co.za</p>
              </div>

              <div className="border-t pt-4">
                <p className="text-xs font-semibold mb-2">HEARING AID LABS DURBANVILLE(PTY)</p>
                <p className="text-xs text-gray-600">Co 21 and one to two(Revenue Street,Durbanville South)</p>
                <p className="text-xs text-gray-600">7441, Cape TOWN</p>
                <p className="text-xs text-gray-600">Tel: 0214760055</p>
                <p className="text-xs text-gray-600">Email: info@HearingAidLabs.co.za</p>
              </div>
            </div>

            {/* Right Side - Barcodes */}
            <div className="flex flex-col items-end justify-start gap-4">
              <div>
                <p className="text-xs text-gray-600 mb-1">Refund Date</p>
                <p className="text-sm font-medium">Refund: 20</p>
              </div>
              <div>
                <p className="text-xs text-gray-600 mb-1">VAT: 234569807854</p>
              </div>
              <div className="flex gap-4">
                <div className="text-center">
                  <div className="w-32 h-16 bg-gray-200 flex items-center justify-center mb-1">
                    <svg viewBox="0 0 100 40" className="w-full h-full">
                      {[...Array(20)].map((_, i) => (
                        <rect key={i} x={i * 5} y="0" width="2" height="40" fill="black" />
                      ))}
                    </svg>
                  </div>
                </div>
                <div className="w-24 h-24 bg-gray-200 flex items-center justify-center">
                  <div className="w-20 h-20 bg-white border-2 border-black"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Refund Type Section */}
          <div className="mb-6">
            <h3 className="text-sm font-semibold mb-3">Refund Type</h3>
            <div className="flex gap-6">
              <label className="flex items-center gap-2">
                <input type="radio" name="refundType" defaultChecked className="w-4 h-4" />
                <span className="text-sm">Full Refund</span>
              </label>
              <label className="flex items-center gap-2">
                <input type="radio" name="refundType" className="w-4 h-4" />
                <span className="text-sm">Partial Refund</span>
              </label>
            </div>
          </div>

          {/* Product Table */}
          <div className="mb-6">
            <div className="border border-gray-300 rounded overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-blue-500 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left">Product</th>
                    <th className="px-3 py-2 text-left">Serial No.</th>
                    <th className="px-3 py-2 text-left">Quantity</th>
                    <th className="px-3 py-2 text-left">Unit Price</th>
                    <th className="px-3 py-2 text-left">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  <tr className="bg-white">
                    <td className="px-3 py-2">-</td>
                    <td className="px-3 py-2">-</td>
                    <td className="px-3 py-2">-</td>
                    <td className="px-3 py-2">-</td>
                    <td className="px-3 py-2">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Total Amount (ZAR)
              </label>
              <input
                type="text"
                defaultValue="700.00"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Refund (ZAR)
              </label>
              <input
                type="text"
                defaultValue="700.00"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Refund (ZAR)
              </label>
              <input
                type="text"
                defaultValue="700.00"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Refund Reason
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-center pt-4 border-t">
            <button className="px-8 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
