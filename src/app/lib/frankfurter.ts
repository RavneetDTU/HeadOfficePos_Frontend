/**
 * Frankfurter free FX API — https://frankfurter.dev/
 * Public base: https://api.frankfurter.dev (no API key).
 * Convert locally: amount * rate (there is no /convert endpoint).
 */

const FRANKFURTER_BASE = "https://api.frankfurter.dev";

export interface FrankfurterRate {
  date: string;
  base: string;
  quote: string;
  rate: number;
}

export interface FrankfurterCurrency {
  iso_code: string;
  name: string;
  symbol?: string;
}

/** Common supplier currencies shown first in the UI. */
export const COMMON_FX_CURRENCIES = [
  "EUR",
  "USD",
  "GBP",
  "CHF",
  "CNY",
  "JPY",
  "AUD",
  "INR",
  "AED",
] as const;

/** GET /v2/rate/{base}/{quote} — latest rate for one pair */
export async function getFrankfurterRate(
  base: string,
  quote: string = "ZAR"
): Promise<FrankfurterRate> {
  const from = base.trim().toUpperCase();
  const to = quote.trim().toUpperCase();

  if (from === to) {
    return {
      date: new Date().toISOString().slice(0, 10),
      base: from,
      quote: to,
      rate: 1,
    };
  }

  const res = await fetch(`${FRANKFURTER_BASE}/v2/rate/${from}/${to}`);
  if (!res.ok) {
    let message = `Exchange rate lookup failed (${res.status})`;
    try {
      const body = await res.json();
      if (typeof body?.message === "string") message = body.message;
    } catch {
      // ignore
    }
    throw new Error(message);
  }

  const data = (await res.json()) as FrankfurterRate;
  if (typeof data.rate !== "number" || !Number.isFinite(data.rate)) {
    throw new Error("Invalid exchange rate response");
  }
  return data;
}

/** Convert amount using live Frankfurter rate into quote currency (default ZAR). */
export async function convertToZar(
  amount: number,
  baseCurrency: string
): Promise<{ zar: number; rate: number; date: string; base: string }> {
  if (!Number.isFinite(amount)) {
    throw new Error("Enter a valid amount");
  }
  const { rate, date, base } = await getFrankfurterRate(baseCurrency, "ZAR");
  return {
    zar: Number((amount * rate).toFixed(2)),
    rate,
    date,
    base,
  };
}

/** Optional: list currencies for richer dropdowns */
export async function listFrankfurterCurrencies(): Promise<FrankfurterCurrency[]> {
  const res = await fetch(`${FRANKFURTER_BASE}/v2/currencies`);
  if (!res.ok) throw new Error("Failed to load currencies");
  const data = (await res.json()) as FrankfurterCurrency[];
  return Array.isArray(data) ? data : [];
}
