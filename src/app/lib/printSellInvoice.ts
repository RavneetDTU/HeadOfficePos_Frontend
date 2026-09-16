export interface SellInvoiceLine {
  sku: string;
  name: string;
  qty: number;
  price: number;
}

export interface SellInvoiceOpts {
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
  lines: SellInvoiceLine[];
}

/** Same sales invoice used on admin List Sales. */
export function printSellInvoice(opts: SellInvoiceOpts) {
  const total = opts.lines.reduce((acc, l) => acc + l.qty * l.price, 0);
  const rows = opts.lines
    .map(
      (l, i) => `
      <tr class="${i % 2 === 0 ? "even" : "odd"}">
        <td>${i + 1}</td>
        <td><strong>${l.name}</strong> ${l.sku ? "(" + l.sku + ")" : ""}</td>
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
      <p>Sell Status: Completed</p>
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

export function printOrderInvoice(order: {
  reference: string;
  createdAt?: string;
  createdBy?: string;
  storeName?: string | null;
  items: Array<{ sku: string; productName: string; quantity: number; unitPrice: number }>;
}) {
  printSellInvoice({
    invoiceNo: order.reference,
    date: order.createdAt
      ? new Date(order.createdAt).toLocaleString("en-ZA")
      : new Date().toLocaleString("en-ZA"),
    fromWarehouse: "HEAD OFFICE WAREHOUSE",
    fromAddress: "Head Office",
    fromPhone: "—",
    fromEmail: "—",
    toStore: order.storeName || "Store",
    toAddress: "—",
    toPhone: "—",
    toEmail: "—",
    biller: order.createdBy || "Store Manager",
    lines: order.items.map((l) => ({
      sku: l.sku,
      name: l.productName || l.sku,
      qty: l.quantity,
      price: l.unitPrice,
    })),
  });
}
