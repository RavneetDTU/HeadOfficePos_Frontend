import { X, Printer, Mail, CreditCard, Truck, RotateCcw, FileText, Eye } from "lucide-react";

interface ViewDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  saleData: any;
}

const saleDetails = {
  company: {
    name: "HEARING AID LAB BLUFF (PTY) LTD",
    address: "Shop 45A, Hillcrest East Port",
    city: "Durban, 4001",
    tel: "031 912 0021",
    email: "info@hearingaidlab.co.za",
    vatNo: "4100234567",
  },
  customer: {
    name: "Sarah Johnson",
    address: "14 Carnation Road, Bluff",
    city: "Durban 4026",
    phone: "+27 31 467 8900",
    email: "sarah.johnson@email.com",
  },
  ref: "SAL/2026/05/29/14477",
  date: "13/05/2026 15:10",
  warehouse: "HEAD OFFICE",
  biller: "Joshua Blatter",
  saleStatus: "Completed",
  paymentStatus: "Paid",
  items: [
    {
      no: 1,
      description: "Phonak Audeo Paradise P90-R (HA-001)",
      serialNo: "PH-2026-001",
      qty: 2,
      unitPrice: 6500,
      tax: 15,
      subtotal: 13000,
    },
    {
      no: 2,
      description: "Phonak TV Connector (ACC-001)",
      serialNo: "—",
      qty: 1,
      unitPrice: 599,
      tax: 15,
      subtotal: 599,
    },
    {
      no: 3,
      description: "Annual Service & Clean (SERV-001)",
      serialNo: "—",
      qty: 1,
      unitPrice: 450,
      tax: 0,
      subtotal: 450,
    },
  ],
  subtotal: 14049,
  discount: 500,
  tax: 2017.35,
  grandTotal: 15566.35,
  paid: 15566.35,
  balance: 0,
  payments: [
    {
      date: "13/05/2026 15:10",
      ref: "POZS034520301",
      paidBy: "Credit Card",
      cvv: "",
      amount: 15566.35,
      enteredBy: "Joshua Blatter",
      returned: "—",
      type: "Payment",
    },
  ],
};

export function ViewDetailsModal({ isOpen, onClose, saleData }: ViewDetailsModalProps) {
  if (!isOpen) return null;

  const openInvoice = (type: "final" | "proforma") => {
    window.open(`/invoice/1?type=${type}`, "_blank");
  };

  // Check if it's a purchase record or a sale record
  const isPurchase = saleData && ("supplier" in saleData || "supplierPhone" in saleData);
  const contactLabel = isPurchase ? "Supplier Info" : "Bill To";
  
  const contactName = isPurchase
    ? (saleData?.supplier || "—")
    : (saleData?.customerName || saleDetails.customer.name);
    
  const contactPhone = isPurchase
    ? (saleData?.supplierPhone || "—")
    : (saleData?.customerPhone || saleDetails.customer.phone);

  const contactAddress = isPurchase ? "" : saleDetails.customer.address;
  const contactCity = isPurchase ? "" : saleDetails.customer.city;
  const contactEmail = isPurchase ? "" : saleDetails.customer.email;

  const infoTitle = isPurchase ? "Purchase Info" : "Sale Info";
  
  const referenceValue = saleData?.reference || saleData?.ref || saleDetails.ref;
  const dateValue = saleData?.date
    ? (() => {
        const d = new Date(saleData.date);
        if (isNaN(d.getTime())) return saleData.date;
        const pad = (n: number) => String(n).padStart(2, "0");
        return `${pad(d.getDate())}/${pad(d.getMonth() + 1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
      })()
    : saleDetails.date;
  const warehouseValue = saleData?.warehouse || saleDetails.warehouse;
  const billerValue = isPurchase ? "—" : (saleData?.biller || saleDetails.biller);

  const statusValue = isPurchase
    ? (saleData?.purchaseStatus || "Ordered")
    : (saleData?.saleStatus || saleDetails.saleStatus);

  const paymentStatusValue = saleData?.paymentStatus || saleDetails.paymentStatus;

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden flex flex-col shadow-2xl">

        {/* Modal Header */}
        <div className="bg-[#1a1d29] text-white px-6 py-4 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-semibold">{isPurchase ? "Purchase Details" : "Sale Details"}</h2>
            <p className="text-xs text-blue-200 mt-0.5">{referenceValue} • {dateValue}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              ["completed", "received", "paid"].includes(statusValue.toLowerCase()) ? "bg-green-400/20 text-green-300 border border-green-400/30" : "bg-orange-400/20 text-orange-300 border border-orange-400/30"
            }`}>
              {statusValue}
            </span>
            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${
              paymentStatusValue === "Paid" ? "bg-blue-400/20 text-blue-300 border border-blue-400/30" : "bg-red-400/20 text-red-300 border border-red-400/30"
            }`}>
              {paymentStatusValue}
            </span>
            <button onClick={onClose} className="text-white/60 hover:text-white transition-colors ml-2">
              <X size={20} />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto">

          {/* Company / Customer / Meta Info */}
          <div className="grid grid-cols-3 border-b border-gray-100">
            <div className="p-5 border-r border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
              <p className="text-sm font-semibold text-gray-900">{saleDetails.company.name}</p>
              <p className="text-xs text-gray-500 mt-1">{saleDetails.company.address}</p>
              <p className="text-xs text-gray-500">{saleDetails.company.city}</p>
              <p className="text-xs text-gray-500">Tel: {saleDetails.company.tel}</p>
              <p className="text-xs text-gray-500">{saleDetails.company.email}</p>
              <p className="text-xs text-gray-400 mt-1">VAT: {saleDetails.company.vatNo}</p>
            </div>
            <div className="p-5 border-r border-gray-100">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{contactLabel}</p>
              <p className="text-sm font-semibold text-gray-900">{contactName}</p>
              {contactAddress && <p className="text-xs text-gray-500 mt-1">{contactAddress}</p>}
              {contactCity && <p className="text-xs text-gray-500">{contactCity}</p>}
              {contactPhone && <p className="text-xs text-gray-500">{contactPhone}</p>}
              {contactEmail && <p className="text-xs text-gray-500">{contactEmail}</p>}
            </div>
            <div className="p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">{infoTitle}</p>
              <div className="space-y-1.5">
                {[
                  ["Reference", referenceValue],
                  ["Date", dateValue],
                  ["Warehouse", warehouseValue],
                  ["Biller", billerValue],
                ].map(([label, val]) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-xs text-gray-500">{label}</span>
                    <span className="text-xs font-medium text-gray-900 text-right max-w-36 truncate">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-6 py-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Order Items</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-medium">#</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Description</th>
                    <th className="px-3 py-2 text-left text-xs font-medium">Serial No</th>
                    <th className="px-3 py-2 text-center text-xs font-medium">Qty</th>
                    <th className="px-3 py-2 text-right text-xs font-medium">Unit Price</th>
                    <th className="px-3 py-2 text-center text-xs font-medium">Tax</th>
                    <th className="px-3 py-2 text-right text-xs font-medium">Subtotal</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {saleDetails.items.map((item, i) => (
                    <tr key={item.no} className={i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}>
                      <td className="px-3 py-2.5 text-xs text-gray-500">{item.no}</td>
                      <td className="px-3 py-2.5 text-sm font-medium text-gray-900">{item.description}</td>
                      <td className="px-3 py-2.5 text-xs font-mono text-gray-500">{item.serialNo}</td>
                      <td className="px-3 py-2.5 text-sm text-center text-gray-900">{item.qty}</td>
                      <td className="px-3 py-2.5 text-xs text-right text-gray-900">R {item.unitPrice.toLocaleString()}</td>
                      <td className="px-3 py-2.5 text-xs text-center text-gray-500">{item.tax}%</td>
                      <td className="px-3 py-2.5 text-sm text-right font-semibold text-gray-900">R {item.subtotal.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-64 space-y-1.5">
                {[
                  ["Subtotal", `R ${saleDetails.subtotal.toLocaleString()}`, false],
                  ["Discount", `– R ${saleDetails.discount.toLocaleString()}`, false],
                  ["VAT (15%)", `R ${saleDetails.tax.toFixed(2)}`, false],
                ].map(([label, val, isBold]) => (
                  <div key={String(label)} className="flex justify-between text-sm">
                    <span className="text-gray-500">{label}</span>
                    <span className={`${isBold ? "font-bold text-gray-900" : "text-gray-700"}`}>{val}</span>
                  </div>
                ))}
                <div className="pt-2 border-t border-gray-200 flex justify-between">
                  <span className="text-sm font-bold text-gray-900">Grand Total</span>
                  <span className="text-base font-bold text-gray-900">
                    R {saleData?.grandTotal != null ? Number(saleData.grandTotal).toLocaleString("en-ZA", { minimumFractionDigits: 2 }) : saleDetails.grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-green-600">Paid</span>
                  <span className="font-semibold text-green-700">
                    R {saleData?.paid != null ? Number(saleData.paid).toLocaleString("en-ZA", { minimumFractionDigits: 2 }) : saleDetails.paid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between text-sm font-bold">
                  <span className="text-gray-900">Balance</span>
                  <span className={(saleData?.balance != null ? Number(saleData.balance) : saleDetails.balance) === 0 ? "text-green-700" : "text-red-600"}>
                    R {saleData?.balance != null ? Number(saleData.balance).toFixed(2) : saleDetails.balance.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Reference */}
          <div className="px-6 pb-5">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Payment Reference</h3>
            <div className="border border-gray-200 rounded-lg overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-blue-600 text-white">
                  <tr>
                    {["Date", "Reference No", "Paid By", "CVV", "Amount", "Entered By", "Returned", "Type"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {saleDetails.payments.map((p, i) => (
                    <tr key={i} className="bg-gray-50/50 border-t border-gray-100">
                      <td className="px-3 py-2">{p.date}</td>
                      <td className="px-3 py-2 font-mono">{p.ref}</td>
                      <td className="px-3 py-2">{p.paidBy}</td>
                      <td className="px-3 py-2">{p.cvv}</td>
                      <td className="px-3 py-2 font-semibold">R {p.amount.toLocaleString()}</td>
                      <td className="px-3 py-2">{p.enteredBy}</td>
                      <td className="px-3 py-2">{p.returned}</td>
                      <td className="px-3 py-2">{p.type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4 flex-shrink-0">
          <div className="flex items-center gap-2 flex-wrap">
            <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
              <Eye size={13} /> View Payments
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition-colors">
              <CreditCard size={13} /> Add Payment
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-teal-600 text-white rounded-lg text-xs font-medium hover:bg-teal-700 transition-colors">
              <Mail size={13} /> Email Invoice
            </button>
            <button
              id="print-final-invoice-btn"
              onClick={() => openInvoice("final")}
              className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg text-xs font-medium hover:bg-purple-700 transition-colors"
            >
              <Printer size={13} /> Print Invoice
            </button>
            <button
              id="print-proforma-invoice-btn"
              onClick={() => openInvoice("proforma")}
              className="flex items-center gap-1.5 px-3 py-2 bg-amber-500 text-white rounded-lg text-xs font-medium hover:bg-amber-600 transition-colors"
            >
              <FileText size={13} /> Proforma Invoice
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-orange-500 text-white rounded-lg text-xs font-medium hover:bg-orange-600 transition-colors">
              <Truck size={13} /> Add Delivery
            </button>
            <button className="flex items-center gap-1.5 px-3 py-2 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 transition-colors">
              <RotateCcw size={13} /> Return Sale
            </button>
            <div className="ml-auto">
              <button
                onClick={onClose}
                className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-xs hover:bg-white transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
