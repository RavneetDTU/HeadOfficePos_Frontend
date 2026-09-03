import { barcodeToSvg } from "./barcode";

export interface ProductLabelData {
  name: string;
  sku: string;
  sellingPrice?: number;
  showPrice?: boolean;
}

export interface PrintProductLabelOptions {
  copies?: number;
  showPrice?: boolean;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function truncateName(name: string, maxLen = 28): string {
  const trimmed = name.trim();
  if (trimmed.length <= maxLen) return trimmed;
  return `${trimmed.slice(0, maxLen - 1)}…`;
}

function formatPrice(amount: number): string {
  return `R ${Number(amount).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

function buildLabelHtml(product: ProductLabelData, barcodeSvg: string, showPrice: boolean): string {
  const name = escapeHtml(truncateName(product.name));
  const sku = escapeHtml(product.sku.trim());
  const priceLine =
    showPrice && product.sellingPrice != null && product.sellingPrice > 0
      ? `<p class="price">${formatPrice(product.sellingPrice)}</p>`
      : "";

  return `
    <div class="label">
      <p class="name">${name}</p>
      <div class="barcode">${barcodeSvg}</div>
      <p class="sku">${sku}</p>
      ${priceLine}
    </div>
  `;
}

/** Open a print window with product label(s) sized for thermal label printers (e.g. Brother TD-4D). */
export function printProductLabels(
  product: ProductLabelData,
  options: PrintProductLabelOptions = {}
): void {
  const copies = Math.max(1, Math.min(99, Math.floor(options.copies ?? 1)));
  const showPrice = options.showPrice ?? true;
  const barcodeSvg = barcodeToSvg(product.sku);

  const labels = Array.from({ length: copies }, () =>
    buildLabelHtml(product, barcodeSvg, showPrice)
  ).join("");

  const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Label — ${escapeHtml(product.sku)}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: Arial, Helvetica, sans-serif; background: #fff; }
    @page {
      size: 62mm 40mm;
      margin: 2mm;
    }
    @media print {
      body { margin: 0; }
      .label {
        page-break-after: always;
        break-after: page;
      }
      .label:last-child {
        page-break-after: auto;
        break-after: auto;
      }
    }
    .label {
      width: 58mm;
      min-height: 36mm;
      padding: 2mm;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      border: 1px dashed #ddd;
    }
    @media print {
      .label { border: none; }
    }
    .name {
      font-size: 9pt;
      font-weight: 700;
      line-height: 1.2;
      margin-bottom: 1.5mm;
      max-width: 100%;
      word-break: break-word;
    }
    .barcode {
      width: 100%;
      display: flex;
      justify-content: center;
      margin: 1mm 0;
    }
    .barcode svg {
      max-width: 100%;
      height: auto;
    }
    .sku {
      font-size: 10pt;
      font-weight: 600;
      font-family: ui-monospace, monospace;
      letter-spacing: 0.05em;
      margin-top: 1mm;
    }
    .price {
      font-size: 9pt;
      font-weight: 600;
      margin-top: 1mm;
    }
  </style>
</head>
<body>
  ${labels}
  <script>window.onload = function() { window.print(); };<\/script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=420,height=640");
  if (!win) {
    throw new Error("Pop-up blocked. Allow pop-ups to print labels.");
  }
  win.document.write(html);
  win.document.close();
}
