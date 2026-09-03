import { AlertTriangle, Printer, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { barcodeToSvg, isValidBarcodeValue } from "../../lib/barcode";
import { printProductLabels, type ProductLabelData } from "../../lib/printProductLabel";

interface ProductLabelModalProps {
  product: ProductLabelData;
  onClose: () => void;
}

function truncateName(name: string, maxLen = 28): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

export function ProductLabelModal({ product, onClose }: ProductLabelModalProps) {
  const [copies, setCopies] = useState(1);
  const [showPrice, setShowPrice] = useState(true);
  const [printError, setPrintError] = useState("");

  const skuValid = isValidBarcodeValue(product.sku);

  const barcodeSvg = useMemo(() => {
    if (!skuValid) return "";
    try {
      return barcodeToSvg(product.sku, { height: 48, width: 1.6 });
    } catch {
      return "";
    }
  }, [product.sku, skuValid]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const handlePrint = () => {
    setPrintError("");
    try {
      printProductLabels(product, { copies, showPrice });
    } catch (e) {
      setPrintError(e instanceof Error ? e.message : "Failed to print label.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900">Print Product Label</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!skuValid ? (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 text-sm">
              <AlertTriangle size={16} className="shrink-0 mt-0.5" />
              <span>This SKU cannot be encoded as a barcode. Use plain ASCII characters only.</span>
            </div>
          ) : (
            <div className="mx-auto w-[220px] border border-dashed border-gray-300 rounded-lg p-3 bg-gray-50 text-center">
              <p className="text-xs font-semibold text-gray-900 mb-2 leading-snug">
                {truncateName(product.name)}
              </p>
              {barcodeSvg ? (
                <div
                  className="flex justify-center my-2 [&_svg]:max-w-full"
                  dangerouslySetInnerHTML={{ __html: barcodeSvg }}
                />
              ) : null}
              <p className="text-sm font-mono font-semibold text-gray-800">{product.sku}</p>
              {showPrice && product.sellingPrice != null && product.sellingPrice > 0 && (
                <p className="text-xs font-semibold text-gray-600 mt-1">
                  R {Number(product.sellingPrice).toFixed(2)}
                </p>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Copies</label>
              <input
                type="number"
                min={1}
                max={99}
                value={copies}
                onChange={(e) => setCopies(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer pb-2">
                <input
                  type="checkbox"
                  checked={showPrice}
                  onChange={(e) => setShowPrice(e.target.checked)}
                  className="rounded border-gray-300"
                />
                Show price
              </label>
            </div>
          </div>

          <p className="text-[11px] text-gray-400">
            Select your Brother TD-4D (or label printer) in the print dialog. Label size: 62mm × 40mm.
          </p>

          {printError && (
            <div className="flex items-center gap-2 text-sm text-rose-600">
              <AlertTriangle size={14} />
              {printError}
            </div>
          )}
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 bg-gray-100 rounded-lg text-sm text-gray-700 hover:bg-gray-200 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handlePrint}
            disabled={!skuValid}
            className="flex-1 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Printer size={15} />
            Print Label
          </button>
        </div>
      </div>
    </div>
  );
}
