import { useSearchParams } from "react-router";
import { Printer, ArrowLeft } from "lucide-react";

interface InvoiceItem {
  no: number;
  description: string;
  serialNo: string;
  qty: number;
  unitPrice: number;
  tax: number;
  subtotal: number;
}

const invoiceData = {
  saleRef: "SAL/2026/05/29/14477",
  date: "21/05/2026",
  dueDate: "21/06/2026",
  saleStatus: "Completed",
  paymentStatus: "Paid",
  company: {
    name: "HEARING AID LAB BLUFF (PTY) LTD",
    address: "Shop 45A, Hillcrest East Port",
    city: "Durban, 4001",
    tel: "031 912 0021",
    email: "info@hearingaidlab.co.za",
    website: "hearingaidlab.co.za",
    vatNo: "4100234567",
    regNo: "2015/123456/07",
  },
  customer: {
    name: "Sarah Johnson",
    address: "14 Carnation Road",
    city: "Bluff, Durban 4026",
    phone: "+27 31 467 8900",
    email: "sarah.johnson@email.com",
  },
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
  ] as InvoiceItem[],
  subtotal: 14049,
  discount: 500,
  tax: 2017.35,
  grandTotal: 15566.35,
  paid: 15566.35,
  balance: 0,
  payments: [
    {
      date: "21/05/2026 10:30",
      ref: "POZS034520301",
      paidBy: "Credit Card",
      amount: 15566.35,
      enteredBy: "Joshua Blatter",
    },
  ],
  notes: "Thank you for choosing Hearing Aid Labs. Your hearing health is our priority.",
  terms: "Payment is due within 30 days. All goods remain the property of Hearing Aid Lab until full payment is received.",
};

export function InvoicePage() {
  const [params] = useSearchParams();
  const type = params.get("type") === "proforma" ? "proforma" : "final";
  const isProforma = type === "proforma";

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toolbar — hidden when printing */}
      <div className="print:hidden bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-10">
        <button
          onClick={() => window.history.back()}
          className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft size={16} /> Back to Sale
        </button>
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
            isProforma ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"
          }`}>
            {isProforma ? "PROFORMA INVOICE" : "FINAL TAX INVOICE"}
          </span>
          <button
            id="print-invoice-btn"
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            <Printer size={15} /> Print / Save PDF
          </button>
        </div>
      </div>

      {/* Invoice Document */}
      <div className="max-w-4xl mx-auto my-6 print:my-0 print:max-w-none">
        <div className="bg-white shadow-lg print:shadow-none" id="invoice-document">

          {/* Proforma Watermark */}
          {isProforma && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.06] print:opacity-[0.08] rotate-[-30deg] select-none overflow-hidden" style={{ zIndex: 0 }}>
              <span className="text-[10rem] font-black text-gray-900 whitespace-nowrap tracking-widest">PROFORMA</span>
            </div>
          )}

          {/* Header */}
          <div className="relative bg-[#1a1d29] text-white px-8 py-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="w-14 h-14 bg-blue-500 rounded-lg flex items-center justify-center mb-3">
                  <span className="text-white text-xl font-black">HAL</span>
                </div>
                <h1 className="text-2xl font-bold">{invoiceData.company.name}</h1>
                <p className="text-blue-200 text-sm mt-1">{invoiceData.company.address}, {invoiceData.company.city}</p>
                <p className="text-blue-200 text-sm">Tel: {invoiceData.company.tel} | {invoiceData.company.email}</p>
                <p className="text-blue-200 text-sm">VAT No: {invoiceData.company.vatNo} | Reg: {invoiceData.company.regNo}</p>
              </div>
              <div className="text-right">
                <div className={`inline-block px-4 py-1 rounded-full text-sm font-bold mb-3 ${
                  isProforma ? "bg-amber-400 text-amber-900" : "bg-green-400 text-green-900"
                }`}>
                  {isProforma ? "PROFORMA INVOICE" : "TAX INVOICE"}
                </div>
                <div className="space-y-1">
                  <p className="text-lg font-mono font-bold text-white">{invoiceData.saleRef}</p>
                  <p className="text-sm text-blue-200">Date: {invoiceData.date}</p>
                  <p className="text-sm text-blue-200">Due: {invoiceData.dueDate}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Bill To / Status Strip */}
          <div className="grid grid-cols-3 border-b border-gray-200">
            <div className="p-6 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Bill To</p>
              <p className="text-sm font-semibold text-gray-900">{invoiceData.customer.name}</p>
              <p className="text-sm text-gray-600">{invoiceData.customer.address}</p>
              <p className="text-sm text-gray-600">{invoiceData.customer.city}</p>
              <p className="text-sm text-gray-600">{invoiceData.customer.phone}</p>
              <p className="text-sm text-gray-600">{invoiceData.customer.email}</p>
            </div>
            <div className="p-6 border-r border-gray-200">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">From</p>
              <p className="text-sm font-semibold text-gray-900">{invoiceData.company.name}</p>
              <p className="text-sm text-gray-600">{invoiceData.company.address}</p>
              <p className="text-sm text-gray-600">{invoiceData.company.city}</p>
              <p className="text-sm text-gray-600">Tel: {invoiceData.company.tel}</p>
              <p className="text-sm text-gray-600">{invoiceData.company.website}</p>
            </div>
            <div className="p-6">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Invoice Status</p>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Sale Status</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                    invoiceData.saleStatus === "Completed" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                  }`}>{invoiceData.saleStatus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Payment</span>
                  <span className={`font-semibold px-2 py-0.5 rounded text-xs ${
                    invoiceData.paymentStatus === "Paid" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                  }`}>{invoiceData.paymentStatus}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Balance</span>
                  <span className="font-bold text-gray-900">R {invoiceData.balance.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="px-8 py-6">
            <table className="w-full">
              <thead>
                <tr className="bg-[#1a1d29] text-white">
                  <th className="px-3 py-2.5 text-left text-xs font-medium">#</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium">Description</th>
                  <th className="px-3 py-2.5 text-left text-xs font-medium">Serial No</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium">Qty</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium">Unit Price</th>
                  <th className="px-3 py-2.5 text-center text-xs font-medium">Tax %</th>
                  <th className="px-3 py-2.5 text-right text-xs font-medium">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {invoiceData.items.map((item, i) => (
                  <tr key={item.no} className={`border-b border-gray-100 ${i % 2 === 0 ? "bg-white" : "bg-gray-50"}`}>
                    <td className="px-3 py-3 text-sm text-gray-500">{item.no}</td>
                    <td className="px-3 py-3 text-sm font-medium text-gray-900">{item.description}</td>
                    <td className="px-3 py-3 text-xs text-gray-500 font-mono">{item.serialNo}</td>
                    <td className="px-3 py-3 text-sm text-center text-gray-900">{item.qty}</td>
                    <td className="px-3 py-3 text-sm text-right text-gray-900">R {item.unitPrice.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                    <td className="px-3 py-3 text-sm text-center text-gray-600">{item.tax}%</td>
                    <td className="px-3 py-3 text-sm text-right font-semibold text-gray-900">
                      R {item.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totals */}
            <div className="flex justify-end mt-4">
              <div className="w-72 border border-gray-200 rounded-lg overflow-hidden">
                <div className="divide-y divide-gray-100">
                  {[
                    ["Subtotal", `R ${invoiceData.subtotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, false],
                    ["Discount", `– R ${invoiceData.discount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, false],
                    ["VAT (15%)", `R ${invoiceData.tax.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, false],
                    ["Grand Total", `R ${invoiceData.grandTotal.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}`, true],
                  ].map(([label, val, isBold]) => (
                    <div
                      key={String(label)}
                      className={`flex justify-between px-4 py-2 text-sm ${isBold ? "bg-[#1a1d29] text-white font-bold" : "bg-white text-gray-700"}`}
                    >
                      <span>{label}</span>
                      <span>{val}</span>
                    </div>
                  ))}
                  {!isProforma && (
                    <>
                      <div className="flex justify-between px-4 py-2 text-sm bg-green-50 text-green-700">
                        <span>Paid</span>
                        <span className="font-semibold">R {invoiceData.paid.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</span>
                      </div>
                      <div className="flex justify-between px-4 py-2 text-sm bg-white font-bold text-gray-900">
                        <span>Balance Due</span>
                        <span>R {invoiceData.balance.toFixed(2)}</span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment Reference (Final Invoice Only) */}
          {!isProforma && (
            <div className="px-8 pb-6">
              <h3 className="text-sm font-semibold text-gray-800 mb-3">Payment Reference</h3>
              <table className="w-full border border-gray-200 rounded-lg overflow-hidden text-xs">
                <thead className="bg-gray-100">
                  <tr>
                    {["Date", "Reference", "Paid By", "Amount", "Entered By"].map((h) => (
                      <th key={h} className="px-3 py-2 text-left text-xs font-medium text-gray-600">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {invoiceData.payments.map((p, i) => (
                    <tr key={i} className="border-t border-gray-100">
                      <td className="px-3 py-2 text-gray-700">{p.date}</td>
                      <td className="px-3 py-2 font-mono text-gray-700">{p.ref}</td>
                      <td className="px-3 py-2 text-gray-700">{p.paidBy}</td>
                      <td className="px-3 py-2 font-semibold text-gray-900">R {p.amount.toLocaleString("en-ZA", { minimumFractionDigits: 2 })}</td>
                      <td className="px-3 py-2 text-gray-700">{p.enteredBy}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes & Terms */}
          <div className="mx-8 mb-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Notes</p>
            <p className="text-sm text-gray-700">{invoiceData.notes}</p>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1 mt-3">Terms & Conditions</p>
            <p className="text-xs text-gray-600">{invoiceData.terms}</p>
          </div>

          {/* Footer */}
          <div className="bg-[#1a1d29] text-white px-8 py-4 flex items-center justify-between">
            <p className="text-xs text-blue-200">{invoiceData.company.website} | {invoiceData.company.email}</p>
            <p className="text-xs text-blue-200">
              {isProforma ? "This is a proforma invoice and not a demand for payment." : "This is a computer-generated invoice. No signature required."}
            </p>
            <p className="text-xs text-blue-200">Page 1 of 1</p>
          </div>
        </div>
      </div>

      <style>{`
        @media print {
          body { margin: 0; }
          .print\\:hidden { display: none !important; }
          #invoice-document { box-shadow: none; margin: 0; }
        }
      `}</style>
    </div>
  );
}
