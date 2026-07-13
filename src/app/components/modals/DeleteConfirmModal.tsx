import { X } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteConfirmModal({ isOpen, onClose, onConfirm }: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg w-full max-w-sm">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4 pb-3 border-b">
            <h2 className="text-base font-semibold text-gray-900">Confirm Delete</h2>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
              <X size={20} />
            </button>
          </div>

          {/* Message */}
          <div className="mb-6">
            <p className="text-sm text-gray-700">
              Are you sure you want to delete this sale?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 text-sm"
            >
              No
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-6 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
