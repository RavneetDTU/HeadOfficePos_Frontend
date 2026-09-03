import JsBarcode from "jsbarcode";

/** Validate SKU can be encoded as Code 128 (ASCII printable chars). */
export function isValidBarcodeValue(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 80) return false;
  return /^[\x20-\x7E]+$/.test(trimmed);
}

/** Generate a Code 128 barcode as an SVG string for embedding in print HTML. */
export function barcodeToSvg(value: string, options?: { height?: number; width?: number }): string {
  const trimmed = value.trim();
  if (!isValidBarcodeValue(trimmed)) {
    throw new Error("SKU contains characters that cannot be encoded as a barcode.");
  }

  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  JsBarcode(svg, trimmed, {
    format: "CODE128",
    displayValue: false,
    margin: 0,
    height: options?.height ?? 40,
    width: options?.width ?? 1.4,
  });
  return svg.outerHTML;
}
