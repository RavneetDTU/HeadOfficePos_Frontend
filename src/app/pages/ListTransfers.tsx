import {
  AlertTriangle,
  Building2,
  ChevronLeft,
  ChevronRight,
  Eye,
  FileText,
  Loader2,
  Printer,
  RefreshCw,
  Search,
  Truck,
  X,
} from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import {
  getStores,
  getTransfer,
  getTransferItemsWithCache,
  getTransfers,
  getWarehouses,
  updateTransferStatus,
} from "../services/inventoryService";
import type { Transfer, TransferListParams } from "../types/inventory";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function printTransferInvoice(opts: {
  invoiceNo: string;
  date: string;
  fromWarehouse: string;
  fromAddress?: string;
  fromPhone?: string;
  fromEmail?: string;
  toStore: string;
  toAddress?: string;
  toPhone?: string;
  toEmail?: string;
  biller: string;
  lines: { sku: string; name: string; qty: number; price: number }[];
}) {
  const total = opts.lines.reduce((acc, l) => acc + l.qty * l.price, 0);
  const rows = opts.lines
    .map(
      (l, i) => `
      <tr class="${i % 2 === 0 ? 'even' : 'odd'}">
        <td>${i + 1}</td>
        <td><strong>${l.name}</strong> ${l.sku ? '(' + l.sku + ')' : ''}</td>
        <td style="text-align:center font-weight:bold">${l.qty}</td>
        <td style="text-align:left; color:#94a3b8">—</td>
        <td style="text-align:right">R ${l.price.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
        <td style="text-align:right">R ${(l.qty * l.price).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
      </tr>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <title>Sales Invoice ${opts.invoiceNo}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; font-family: 'Segoe UI', Arial, sans-serif; }
    body { padding: 40px; color: #111; background: #fff; font-size: 13px; }
    .top-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin-bottom: 24px; }
    .col-info { display: flex; gap: 10px; font-size: 11px; color: #475569; }
    .col-info .label { font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em; color: #94a3b8; margin-bottom: 4px; }
    .col-info h3 { font-size: 13px; font-weight: 700; color: #1e293b; margin-bottom: 4px; }
    .col-info p { margin-bottom: 2px; }
    .ref-section { display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; }
    .ref-details h2 { font-size: 15px; font-weight: 700; color: #0f172a; margin-bottom: 4px; }
    .ref-details p { font-size: 12px; color: #64748b; margin-bottom: 2px; }
    .barcode-qr { display: flex; align-items: center; gap: 16px; }
    .barcode-box, .qr-box { border: 1px solid #e2e8f0; padding: 6px; background: #fff; border-radius: 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 20px; border-radius: 6px; overflow: hidden; border: 1px solid #e2e8f0; }
    thead tr { background: #1d4ed8; color: #fff; }
    thead th { padding: 8px 12px; text-align: left; font-size: 11px; font-weight: 600; text-transform: uppercase; }
    tbody td { padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-size: 12px; }
    tbody tr.even { background: #fff; }
    tbody tr.odd { background: #f8fafc; }
    .totals-area { display: flex; justify-content: flex-end; margin-bottom: 24px; }
    .totals-table { width: 260px; border: none; }
    .totals-table td { padding: 4px 8px; font-size: 12px; border: none; }
    .totals-table tr.grand { font-size: 14px; font-weight: 800; color: #1d4ed8; border-top: 1px solid #cbd5e1; }
    .creator-box { border: 1px solid #e2e8f0; border-radius: 6px; padding: 12px; background: #f8fafc; width: fit-content; font-size: 11px; }
    .creator-box p { margin-bottom: 3px; }
    @media print { body { padding: 0px; } }
  </style>
</head>
<body>
  <div class="top-grid">
    <div class="col-info">
      <div>
        <p class="label">From</p>
        <h3>${opts.fromWarehouse}</h3>
        <p>${opts.fromAddress || ""}</p>
        <p>Tel: ${opts.fromPhone || ""}</p>
        <p>Email: ${opts.fromEmail || ""}</p>
      </div>
    </div>
    <div class="col-info">
      <div>
        <p class="label">To</p>
        <h3>${opts.toStore}</h3>
        <p>${opts.toAddress || ""}</p>
        <p>Tel: ${opts.toPhone || ""}</p>
        <p>Email: ${opts.toEmail || ""}</p>
      </div>
    </div>
  </div>

  <div class="ref-section">
    <div class="ref-details">
      <h2>Reference: ${opts.invoiceNo}</h2>
      <p>Date: ${opts.date}</p>
      <p>Transfer Status: Completed</p>
      <p>Payment Status: Paid</p>
    </div>
    <div class="barcode-qr">
      <div class="barcode-box">
        <svg style="width: 130px; height: 40px;" viewBox="0 0 100 20" preserveAspectRatio="none">
          <rect x="0" y="0" width="100" height="20" fill="white" />
          <rect x="2" y="1" width="1.5" height="18" fill="black" />
          <rect x="5" y="1" width="1" height="18" fill="black" />
          <rect x="8" y="1" width="2" height="18" fill="black" />
          <rect x="12" y="1" width="1.5" height="18" fill="black" />
          <rect x="15" y="1" width="1" height="18" fill="black" />
          <rect x="18" y="1" width="3" height="18" fill="black" />
          <rect x="23" y="1" width="1" height="18" fill="black" />
          <rect x="26" y="1" width="2" height="18" fill="black" />
          <rect x="30" y="1" width="1.5" height="18" fill="black" />
          <rect x="33" y="1" width="1.5" height="18" fill="black" />
          <rect x="37" y="1" width="1" height="18" fill="black" />
          <rect x="40" y="1" width="3" height="18" fill="black" />
          <rect x="45" y="1" width="1" height="18" fill="black" />
          <rect x="48" y="1" width="2" height="18" fill="black" />
          <rect x="52" y="1" width="1.5" height="18" fill="black" />
          <rect x="55" y="1" width="1.5" height="18" fill="black" />
          <rect x="59" y="1" width="1.5" height="18" fill="black" />
          <rect x="62" y="1" width="1" height="18" fill="black" />
          <rect x="65" y="1" width="3" height="18" fill="black" />
          <rect x="70" y="1" width="1" height="18" fill="black" />
          <rect x="73" y="1" width="2" height="18" fill="black" />
          <rect x="77" y="1" width="1.5" height="18" fill="black" />
          <rect x="80" y="1" width="1.5" height="18" fill="black" />
          <rect x="84" y="1" width="1.5" height="18" fill="black" />
          <rect x="87" y="1" width="1" height="18" fill="black" />
          <rect x="90" y="1" width="3" height="18" fill="black" />
        </svg>
      </div>
      <div class="qr-box">
        <svg style="width: 40px; height: 40px;" viewBox="0 0 29 29">
          <rect width="29" height="29" fill="white" />
          <path d="M0,0 h7 v7 h-7 z M1,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" fill="black" />
          <path d="M22,0 h7 v7 h-7 z M23,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" fill="black" />
          <path d="M0,22 h7 v7 h-7 z M1,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" fill="black" />
          <rect x="22" y="22" width="2" height="2" fill="black" />
          <rect x="25" y="25" width="4" height="4" fill="black" />
          <rect x="9" y="2" width="2" height="2" fill="black" />
          <rect x="14" y="0" width="3" height="1" fill="black" />
          <rect x="19" y="4" width="1" height="3" fill="black" />
          <rect x="3" y="9" width="2" height="2" fill="black" />
          <rect x="10" y="10" width="4" height="4" fill="black" />
          <rect x="16" y="16" width="3" height="3" fill="black" />
          <rect x="2" y="18" width="1" height="3" fill="black" />
          <rect x="18" y="2" width="2" height="2" fill="black" />
        </svg>
      </div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="width: 50px">No</th>
        <th>Description (Code)</th>
        <th style="text-align:center; width: 80px">Quantity</th>
        <th style="width: 100px">Serial No</th>
        <th style="text-align:right; width: 120px">Unit Price</th>
        <th style="text-align:right; width: 120px">Subtotal</th>
      </tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>

  <div class="totals-area">
    <table class="totals-table">
      <tr>
        <td style="font-weight: 600">Total Amount (ZAR)</td>
        <td style="text-align:right; font-weight: 600">R ${total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr>
        <td style="font-weight: 600">Paid (ZAR)</td>
        <td style="text-align:right; font-weight: 600">R ${total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
      </tr>
      <tr class="grand">
        <td>Balance (ZAR)</td>
        <td style="text-align:right; font-weight: 800">R 0.00</td>
      </tr>
    </table>
  </div>

  <div class="creator-box">
    <p><strong>Created by :</strong> ${opts.biller}</p>
    <p><strong>Date :</strong> ${opts.date}</p>
    <p style="color: #dc2626; font-weight: 650"><strong>Date Created:</strong> ${opts.date}</p>
  </div>

  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=900,height=700");
  if (win) {
    win.document.write(html);
    win.document.close();
  }
}

function InvoiceDetailModal({
  transferId,
  warehouses,
  stores,
  onClose,
}: {
  transferId: number;
  warehouses: any[];
  stores: any[];
  onClose: () => void;
}) {
  const [transfer, setTransfer] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    getTransfer(transferId)
      .then((t) => setTransfer(t))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load details"))
      .finally(() => setLoading(false));
  }, [transferId]);

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-lg flex flex-col items-center gap-3">
          <Loader2 className="animate-spin text-blue-600" size={32} />
          <p className="text-sm text-gray-500 font-medium">Loading invoice details...</p>
        </div>
      </div>
    );
  }

  if (error || !transfer) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm">
        <div className="bg-white p-6 rounded-xl shadow-lg max-w-sm w-full">
          <h3 className="text-lg font-bold text-red-600 mb-2">Error</h3>
          <p className="text-sm text-gray-600 mb-4">{error || "Transfer details not found."}</p>
          <button onClick={onClose} className="w-full py-2 bg-gray-100 hover:bg-gray-250 text-gray-800 rounded-lg text-sm font-semibold">
            Close
          </button>
        </div>
      </div>
    );
  }

  const fromWh = warehouses.find((w) => w.id === transfer.from_warehouse_id) || {};
  const toSt = stores.find((s) => s.id === transfer.to_store_id) || {};

  const fromWhName = transfer.from_warehouse_name || fromWh.name || "HEAD OFFICE WAREHOUSE";
  const toStName = transfer.to_store_name || toSt.name || "Store Manager";

  const total = (transfer.items || []).reduce(
    (acc: number, item: any) => acc + item.quantity * (item.purchase_price ?? item.purchasePrice ?? 0),
    0
  );

  const formattedDate = new Date(transfer.transfer_date).toLocaleString("en-ZA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const handlePrint = () => {
    printTransferInvoice({
      invoiceNo: transfer.transfer_reference,
      date: formattedDate,
      fromWarehouse: fromWhName,
      fromAddress: fromWh.address || fromWh.city || "Head Office",
      fromPhone: fromWh.phone || "—",
      fromEmail: fromWh.email || "—",
      toStore: toStName,
      toAddress: toSt.address || toSt.city || "—",
      toPhone: toSt.phone || "—",
      toEmail: toSt.email || "—",
      biller: transfer.created_by || "HeadOffice",
      lines: (transfer.items || []).map((l: any) => ({
        sku: l.sku || l.productSku || "",
        name: l.product_name || l.productName || l.sku || "",
        qty: l.quantity,
        price: l.purchase_price ?? l.purchasePrice ?? 0,
      })),
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-150 bg-gray-50">
          <h2 className="text-base font-bold text-gray-800 font-mono">Invoice: {transfer.transfer_reference}</h2>
          <button onClick={onClose} className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="p-6 max-h-[75vh] overflow-y-auto space-y-6">
          <div className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-gray-150 pb-5">
              <div className="flex gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                  <Building2 size={18} />
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">From</p>
                  <p className="font-bold text-gray-850">{fromWhName}</p>
                  <p className="text-gray-500">{fromWh.address || fromWh.city || "Central Warehouse"}</p>
                  {fromWh.phone && <p className="text-gray-500">Tel: {fromWh.phone}</p>}
                  {fromWh.email && <p className="text-gray-500">Email: {fromWh.email}</p>}
                </div>
              </div>

              <div className="flex gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0 text-gray-500">
                  <Building2 size={18} />
                </div>
                <div className="text-xs space-y-0.5">
                  <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider">To</p>
                  <p className="font-bold text-gray-850">{toStName}</p>
                  <p className="text-gray-500">{toSt.address || toSt.city || "Destination Store"}</p>
                  {toSt.phone && <p className="text-gray-500">Tel: {toSt.phone}</p>}
                  {toSt.email && <p className="text-gray-500">Email: {toSt.email}</p>}
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="flex gap-3 items-start">
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                  <FileText size={20} />
                </div>
                <div className="text-xs space-y-1">
                  <p className="text-gray-900 font-bold">Reference: {transfer.transfer_reference}</p>
                  <p className="text-gray-500">Date: {formattedDate}</p>
                  <p className="text-gray-500">Transfer Status: <span className="font-semibold text-gray-700">{transfer.status}</span></p>
                  <p className="text-gray-500">Payment Status: <span className="font-bold text-emerald-600">Paid</span></p>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="border border-gray-150 p-1.5 bg-white rounded">
                  <svg className="w-32 h-10" viewBox="0 0 100 20" preserveAspectRatio="none">
                    <rect x="0" y="0" width="100" height="20" fill="white" />
                    <rect x="2" y="1" width="1.5" height="18" fill="black" />
                    <rect x="5" y="1" width="1" height="18" fill="black" />
                    <rect x="8" y="1" width="2" height="18" fill="black" />
                    <rect x="12" y="1" width="1.5" height="18" fill="black" />
                    <rect x="15" y="1" width="1" height="18" fill="black" />
                    <rect x="18" y="1" width="3" height="18" fill="black" />
                    <rect x="23" y="1" width="1" height="18" fill="black" />
                    <rect x="26" y="1" width="2" height="18" fill="black" />
                    <rect x="30" y="1" width="1.5" height="18" fill="black" />
                    <rect x="33" y="1" width="1.5" height="18" fill="black" />
                    <rect x="37" y="1" width="1" height="18" fill="black" />
                    <rect x="40" y="1" width="3" height="18" fill="black" />
                    <rect x="45" y="1" width="1" height="18" fill="black" />
                    <rect x="48" y="1" width="2" height="18" fill="black" />
                    <rect x="52" y="1" width="1.5" height="18" fill="black" />
                    <rect x="55" y="1" width="1.5" height="18" fill="black" />
                    <rect x="59" y="1" width="1.5" height="18" fill="black" />
                    <rect x="62" y="1" width="1" height="18" fill="black" />
                    <rect x="65" y="1" width="3" height="18" fill="black" />
                    <rect x="70" y="1" width="1" height="18" fill="black" />
                    <rect x="73" y="1" width="2" height="18" fill="black" />
                    <rect x="77" y="1" width="1.5" height="18" fill="black" />
                    <rect x="80" y="1" width="1.5" height="18" fill="black" />
                    <rect x="84" y="1" width="1.5" height="18" fill="black" />
                    <rect x="87" y="1" width="1" height="18" fill="black" />
                    <rect x="90" y="1" width="3" height="18" fill="black" />
                  </svg>
                </div>
                <div className="border border-gray-150 p-1.5 bg-white rounded">
                  <svg className="w-10 h-10" viewBox="0 0 29 29">
                    <rect width="29" height="29" fill="white" />
                    <path d="M0,0 h7 v7 h-7 z M1,1 h5 v5 h-5 z M2,2 h3 v3 h-3 z" fill="black" />
                    <path d="M22,0 h7 v7 h-7 z M23,1 h5 v5 h-5 z M24,2 h3 v3 h-3 z" fill="black" />
                    <path d="M0,22 h7 v7 h-7 z M1,23 h5 v5 h-5 z M2,24 h3 v3 h-3 z" fill="black" />
                    <rect x="22" y="22" width="2" height="2" fill="black" />
                    <rect x="25" y="25" width="4" height="4" fill="black" />
                    <rect x="9" y="2" width="2" height="2" fill="black" />
                    <rect x="14" y="0" width="3" height="1" fill="black" />
                    <rect x="19" y="4" width="1" height="3" fill="black" />
                    <rect x="3" y="9" width="2" height="2" fill="black" />
                    <rect x="10" y="10" width="4" height="4" fill="black" />
                    <rect x="16" y="16" width="3" height="3" fill="black" />
                    <rect x="2" y="18" width="1" height="3" fill="black" />
                    <rect x="18" y="2" width="2" height="2" fill="black" />
                  </svg>
                </div>
              </div>
            </div>

            <div className="rounded-lg border border-gray-200 overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-4 py-2 text-left font-semibold">No</th>
                    <th className="px-4 py-2 text-left font-semibold">Description (Code)</th>
                    <th className="px-4 py-2 text-center font-semibold">Quantity</th>
                    <th className="px-4 py-2 text-left font-semibold">Serial No</th>
                    <th className="px-4 py-2 text-right font-semibold">Unit Price</th>
                    <th className="px-4 py-2 text-right font-semibold">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-150">
                  {(transfer.items || []).map((item: any, idx: number) => {
                    const price = item.purchase_price ?? item.purchasePrice ?? 0;
                    return (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-500">{idx + 1}</td>
                        <td className="px-4 py-2.5">
                          <span className="font-bold text-gray-800">{item.product_name || item.productName || item.sku}</span>
                          {item.sku && <span className="text-gray-400 ml-1">({item.sku})</span>}
                        </td>
                        <td className="px-4 py-2.5 text-center font-bold text-gray-800">{item.quantity}</td>
                        <td className="px-4 py-2.5 text-gray-400">—</td>
                        <td className="px-4 py-2.5 text-right font-semibold text-gray-800">
                          R {price.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-2.5 text-right font-bold text-gray-905">
                          R {(item.quantity * price).toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="flex justify-end pt-2">
              <table className="text-xs w-64 border-t border-dashed border-gray-300 pt-2">
                <tbody>
                  <tr className="font-semibold text-gray-600">
                    <td className="py-1 text-left">Total Amount (ZAR)</td>
                    <td className="py-1 text-right">R {total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="font-semibold text-gray-600">
                    <td className="py-1 text-left">Paid (ZAR)</td>
                    <td className="py-1 text-right">R {total.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                  </tr>
                  <tr className="font-bold text-blue-600 border-t border-gray-200 pt-1">
                    <td className="py-1 text-left">Balance (ZAR)</td>
                    <td className="py-1 text-right">R 0.00</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="bg-gray-50 border border-gray-150 rounded-lg p-3 text-xs space-y-1 w-fit">
              <p className="text-gray-700"><strong>Created by :</strong> {transfer.created_by || "HeadOffice"}</p>
              <p className="text-gray-500"><strong>Date :</strong> {formattedDate}</p>
              <p className="text-red-600 font-semibold"><strong>Date Created:</strong> {formattedDate}</p>
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-150 bg-gray-50 flex items-center justify-end gap-2">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition-colors shadow-sm"
          >
            <Printer size={14} /> Print / Save PDF
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-gray-200 text-gray-700 hover:bg-gray-100 rounded-lg text-xs font-semibold transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

function fmtZAR(val: number) {
  return `R ${val.toLocaleString("en-ZA", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString("en-ZA", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
}

function StatusBadge({ status }: { status: Transfer["status"] }) {
  const map: Record<Transfer["status"], string> = {
    Completed: "bg-green-100 text-green-700",
    Delivered: "bg-green-100 text-green-700",
    Pending: "bg-amber-100 text-amber-700",
    Approved: "bg-blue-100 text-blue-700",
    "In Transit": "bg-indigo-100 text-indigo-700",
    Cancelled: "bg-red-100 text-red-600",
    Rejected: "bg-red-100 text-red-600",
  };
  const dotColor = {
    Completed: "bg-green-500",
    Delivered: "bg-green-500",
    Pending: "bg-amber-500",
    Approved: "bg-blue-500",
    "In Transit": "bg-indigo-500",
    Cancelled: "bg-red-400",
    Rejected: "bg-red-400",
  }[status];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${map[status]}`}>
      <span className={`w-1.5 h-1.5 rounded-full mr-1 ${dotColor}`} />
      {status}
    </span>
  );
}

// ─── Component ────────────────────────────────────────────────────────────────

export function ListTransfers() {
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [selectedTransferId, setSelectedTransferId] = useState<number | null>(null);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [stores, setStores] = useState<any[]>([]);

  useEffect(() => {
    getWarehouses().then(setWarehouses).catch(() => { });
    getStores().then(setStores).catch(() => { });
  }, []);

  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalValue, setTotalValue] = useState(0);
  const LIMIT = 20;

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [successToast, setSuccessToast] = useState("");

  const handleStatusChange = async (transferId: number, newStatus: string) => {
    const transfer = transfers.find((t) => t.id === transferId);
    if (!transfer) return;

    const currentStatus = transfer.status;
    if (currentStatus === newStatus) return;

    setUpdatingId(transferId);
    setError("");
    setSuccessToast("");

    try {
      // Transition sequentially through state pipeline to satisfy backend validations
      if (newStatus === "Approved") {
        if (currentStatus === "Pending") {
          await updateTransferStatus(transferId, "Approved");
        }
      } else if (newStatus === "In Transit") {
        if (currentStatus === "Pending") {
          await updateTransferStatus(transferId, "Approved");
        }
        await updateTransferStatus(transferId, "In Transit");
      } else if (newStatus === "Delivered") {
        if (currentStatus === "Pending") {
          await updateTransferStatus(transferId, "Approved");
        }
        if (currentStatus === "Pending" || currentStatus === "Approved") {
          await updateTransferStatus(transferId, "In Transit");
        }
        await updateTransferStatus(transferId, "Delivered");
      } else {
        await updateTransferStatus(transferId, newStatus);
      }

      setSuccessToast(`Transfer ${transfer.transfer_reference} updated to ${newStatus}!`);
      setTimeout(() => setSuccessToast(""), 4000);

      // Re-fetch clean list from backend
      await load();

      // Notify other tabs/components
      window.dispatchEvent(new Event("storage"));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update transfer status on backend.");
      // Revert UI to match backend state
      await load();
    } finally {
      setUpdatingId(null);
    }
  };

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setDebouncedSearch(search); setPage(1); }, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const params: TransferListParams = { page, limit: LIMIT };
      if (statusFilter) params.status = statusFilter;
      const res = await getTransfers(params);

      let data = res.transfers;
      if (debouncedSearch) {
        const s = debouncedSearch.toLowerCase();
        data = data.filter((t) =>
          t.transfer_reference.toLowerCase().includes(s) ||
          t.to_store_name.toLowerCase().includes(s) ||
          t.from_warehouse_name.toLowerCase().includes(s)
        );
      }

      // Pre-load / enrich item counts and values from detail endpoint
      const enriched = await Promise.all(
        data.map(async (t) => {
          try {
            const items = await getTransferItemsWithCache(t.id);
            const totalQty = items.reduce((acc, item) => acc + item.quantity, 0);
            const totalVal = items.reduce((acc, item) => acc + (item.quantity * (item.purchasePrice ?? 0)), 0);
            return { ...t, total_items: totalQty, total_value: totalVal };
          } catch {
            return t;
          }
        })
      );

      setTransfers(enriched);
      setTotal(res.total);
      setTotalPages(res.total_pages);
      setTotalValue(enriched.reduce((acc, t) => acc + t.total_value, 0));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load transfers");
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, debouncedSearch]);

  useEffect(() => { load(); }, [load]);

  const completedCount = transfers.filter((t) => t.status === "Completed").length;

  return (
    <div className="p-4 bg-white min-h-screen">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-3">
        <span>Home</span><span>/</span>
        <span className="text-gray-900 font-medium">Sales</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Sales (All Warehouses)</h1>
          <p className="text-sm text-gray-500 mt-0.5">Warehouse → Store stock movements</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={load} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-100 text-gray-500">
            <RefreshCw size={16} />
          </button>
          <Link
            to="/transfers/add"
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            <Truck size={16} /> New Sale
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: "Total Sales", value: String(total), sub: "all time", color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Completed", value: String(completedCount), sub: "in current view", color: "text-green-600", bg: "bg-green-50" },
          { label: "Total Sales Value", value: fmtZAR(totalValue), sub: "in current view", color: "text-purple-600", bg: "bg-purple-50" },
        ].map((k) => (
          <div key={k.label} className="bg-white border border-gray-200 rounded-lg p-4 flex items-center gap-3">
            <div className={`w-10 h-10 ${k.bg} rounded-lg flex items-center justify-center flex-shrink-0`}>
              <Truck size={20} className={k.color} />
            </div>
            <div>
              <p className="text-xs text-gray-500">{k.label}</p>
              <p className="text-xl font-bold text-gray-900">{k.value}</p>
              <p className="text-xs text-gray-400">{k.sub}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4 flex items-center gap-3 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
          <input
            type="text"
            placeholder="Search by reference, warehouse or store..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 w-full"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30"
        >
          <option value="">All Statuses</option>
          <option value="Completed">Completed</option>
          <option value="Pending">Pending</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        {successToast && (
          <div className="flex items-center gap-2 p-4 text-emerald-700 bg-emerald-50 text-sm border-b border-gray-100 font-semibold">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" /> {successToast}
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 p-4 text-red-600 text-sm border-b border-gray-100">
            <AlertTriangle size={16} /> {error}
            <button onClick={load} className="ml-2 underline">Retry</button>
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-blue-600 text-white">
              <tr>
                {["#", "Reference", "Date", "From Warehouse", "To Store", "Items", "Total Value", "Status", "Actions"].map((h) => (
                  <th key={h} className="px-4 py-2.5 text-left text-xs font-medium whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading ? (
                <tr><td colSpan={9} className="px-4 py-12 text-center"><Loader2 className="animate-spin text-blue-600 mx-auto" size={24} /></td></tr>
              ) : transfers.length === 0 ? (
                <tr><td colSpan={9} className="px-4 py-16 text-center">
                  <Truck size={32} className="text-gray-200 mx-auto mb-2" />
                  <p className="text-sm text-gray-400">No transfers found</p>
                  <Link to="/transfers/add" className="text-sm text-blue-600 hover:underline mt-1 inline-block">Create first transfer →</Link>
                </td></tr>
              ) : transfers.map((t, i) => (
                <tr key={t.id} className={`hover:bg-gray-50 transition-colors ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`}>
                  <td className="px-4 py-3 text-xs text-gray-500">{(page - 1) * LIMIT + i + 1}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono bg-blue-50 text-blue-700 px-2 py-0.5 rounded">{t.transfer_reference}</span>
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-600 whitespace-nowrap">{fmtDate(t.transfer_date)}</td>
                  <td className="px-4 py-3 text-sm text-gray-700">{t.from_warehouse_name}</td>
                  <td className="px-4 py-3 text-sm font-medium text-gray-900">{t.to_store_name}</td>
                  <td className="px-4 py-3 text-sm text-gray-700 text-center">{t.total_items}</td>
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">{fmtZAR(t.total_value)}</td>
                  <td className="px-4 py-3">
                    <select
                      value={t.status}
                      onChange={(e) => handleStatusChange(t.id, e.target.value)}
                      className="px-2 py-1.5 border border-gray-250 rounded-lg text-xs bg-white text-gray-800 font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Approved">Approved</option>
                      <option value="In Transit">In Transit</option>
                      <option value="Delivered">Delivered</option>
                      <option value="Cancelled">Cancelled</option>
                      <option value="Rejected">Rejected</option>
                      <option value="Completed">Completed</option>
                    </select>
                  </td>

                  <td className="px-4 py-3">
                    <button
                      onClick={() => setSelectedTransferId(t.id)}
                      className="p-1.5 rounded hover:bg-blue-50 text-blue-600 transition-colors"
                      title="View details"
                    >
                      <Eye size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
            <p className="text-xs text-gray-500">{total} records · Page {page} of {totalPages}</p>
            <div className="flex items-center gap-1">
              <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronLeft size={14} />
              </button>
              <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded border border-gray-200 disabled:opacity-40 hover:bg-gray-50">
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        )}
      </div>

      {selectedTransferId !== null && (
        <InvoiceDetailModal
          transferId={selectedTransferId}
          warehouses={warehouses}
          stores={stores}
          onClose={() => setSelectedTransferId(null)}
        />
      )}
    </div>
  );
}
