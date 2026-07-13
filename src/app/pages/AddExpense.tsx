import { Upload, X } from "lucide-react";

export function AddExpense() {
  return (
    <div className="min-h-screen bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl overflow-hidden rounded bg-white shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-4">
          <h2 className="text-lg font-semibold">
            ADD EXPENSE
          </h2>

          <button
            onClick={() => window.history.back()}
            className="text-gray-400 hover:text-gray-700 transition"
          >
            <X size={30} />
          </button>
        </div>

        {/* Body */}
        <div className="p-4">
          <p className="mb-5 text-sm text-gray-600">
            Please fill in the information below.
            The field labels marked with * are required.
          </p>

          <div className="space-y-4">

            <div>
              <label className="mb-1 block text-sm font-medium">
                Date *
              </label>

              <input
                defaultValue="14/05/2026 12:26"
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Reference
              </label>

              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Category
              </label>

              <select className="w-full rounded border border-gray-300 px-3 py-2">
                <option>Select Category</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Warehouse
              </label>

              <select className="w-full rounded border border-gray-300 px-3 py-2">
                <option>Select Warehouse</option>
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Amount *
              </label>

              <input
                className="w-full rounded border border-gray-300 px-3 py-2"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Attachment *
              </label>

              <div className="flex">
                <input
                  className="flex-1 border border-gray-300 px-3 py-2"
                />

                <button
                  className="flex items-center gap-2 bg-blue-500 px-4 text-white hover:bg-blue-600"
                >
                  <Upload size={14} />
                  Browse...
                </button>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                Note *
              </label>

              <textarea
                rows={5}
                className="w-full rounded border border-gray-300 p-3"
              />
            </div>

          </div>

          <div className="mt-6 flex justify-end">
            <button
              className="rounded bg-blue-600 px-5 py-2 text-white hover:bg-blue-700"
            >
              Add Expense
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}