// Add this at the top or bottom of formatters.js
export function fmtDollarShort(n) {
  if (n === 0) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `$${(n / 1e9).toFixed(1)}B`;
  if (abs >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (abs >= 1e3) return `$${(n / 1e3).toFixed(1)}k`;
  return `$${Math.round(n)}`;
}

export function currencyShort(n) {
  return (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
}

// Locale-aware factories
export const makeCurrency = (locale = undefined, currency = "USD", opts = {}) =>
  (n) => Number.isFinite(n)
    ? new Intl.NumberFormat(locale, { style: "currency", currency, maximumFractionDigits: 0, ...opts }).format(n)
    : "-";

export const makeNumber = (locale = undefined, opts = {}) =>
  (n) => Number.isFinite(n)
    ? new Intl.NumberFormat(locale, { maximumFractionDigits: 0, ...opts }).format(n)
    : "-";

// Ready-to-use common formatters
export const currency = makeCurrency(); // defaults to user locale + USD, 0 decimals
export const currency0 = currency;      // alias
export const currency2 = makeCurrency(undefined, "USD", { maximumFractionDigits: 2 });

export const percent = (v, digits = 0) =>
  typeof v === "number" ? `${(v * 100).toFixed(digits)}%` : "-";

export const numberCompact = (n) =>
  Number.isFinite(n)
    ? new Intl.NumberFormat(undefined, { notation: "compact", maximumFractionDigits: 1 }).format(n)
    : "-";

// Tooltip helper that plays nice with Recharts <Tooltip formatter>
export const tooltipFormatterCurrency = (value) => currency(value);

// Guard helpers
export const safe = (n) => (Number.isFinite(n) ? n : 0);

// ---- add below your existing exports ----
export const formatMoney = currency;   // alias used by some charts
export const money = currency;         // extra alias (optional)
export const dollars = currency;       // extra alias (optional)

export const formatPercent = (v) => percent(v); // optional alias
export const compact = numberCompact;           // optional alias