import { X } from "lucide-react";

interface ProcessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: "approve" | "reject";
}

export function ProcessModal({ isOpen, onClose, type }: ProcessModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded w-full max-w-md">
        <div className="bg-blue-500 text-white px-4 py-3 flex items-center justify-between">
          <h2 className="text-sm font-medium">Process {type}</h2>
          <button onClick={onClose} className="text-white hover:text-gray-200">
            <X size={18} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <label className="block text-xs text-gray-700 mb-1">Amount</label>
            <input
              type="text"
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-700 mb-1">Note</label>
            <textarea
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="flex justify-center pt-2">
            <button className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm">
              Submit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
