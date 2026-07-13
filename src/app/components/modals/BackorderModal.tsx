import { X, AlertTriangle, Clock, ShoppingBag } from "lucide-react";

interface BackorderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddBackorder: () => void;
  productName: string;
  requestedQty: number;
  availableQty: number;
}

export function BackorderModal({
  isOpen,
  onClose,
  onAddBackorder,
  productName,
  requestedQty,
  availableQty,
}: BackorderModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="bg-orange-50 border-b border-orange-100 p-5 flex items-start gap-3">
          <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center flex-shrink-0">
            <AlertTriangle size={20} className="text-orange-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-base font-semibold text-gray-900">Stock Unavailable</h2>
            <p className="text-sm text-gray-600 mt-0.5">
              This product doesn't have enough stock to fulfil the order.
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={18} />
          </button>
        </div>

        {/* Product Info */}
        <div className="p-5">
          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <p className="text-xs text-gray-500 mb-1">Product</p>
            <p className="text-sm font-semibold text-gray-900">{productName}</p>
            <div className="flex items-center gap-4 mt-3">
              <div>
                <p className="text-xs text-gray-500">Available</p>
                <p className="text-xl font-bold text-red-600">{availableQty}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-gray-500">Requested</p>
                <p className="text-xl font-bold text-gray-900">{requestedQty}</p>
              </div>
              <div className="h-8 w-px bg-gray-200" />
              <div>
                <p className="text-xs text-gray-500">Shortfall</p>
                <p className="text-xl font-bold text-orange-600">{requestedQty - availableQty}</p>
              </div>
            </div>
          </div>

          <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 mb-5">
            <div className="flex items-start gap-2">
              <Clock size={14} className="text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <p className="text-xs font-medium text-blue-800">Backorder Option Available</p>
                <p className="text-xs text-blue-700 mt-0.5">
                  You can add this product as a backorder. It will be marked as "Awaiting Stock" and 
                  fulfilled once stock arrives.
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-2">
            <button
              id="confirm-backorder-btn"
              onClick={() => {
                onAddBackorder();
                onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 transition-colors"
            >
              <Clock size={15} />
              Add as Backorder (Awaiting Stock)
            </button>
            <button
              id="cancel-backorder-btn"
              onClick={onClose}
              className="w-full py-2.5 border border-gray-200 text-gray-600 rounded-lg text-sm hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
            >
              <ShoppingBag size={15} />
              Cancel — Don't Add Product
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
