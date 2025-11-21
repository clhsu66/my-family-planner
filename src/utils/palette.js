// src/utils/palette.js
// Central color definitions so the same concepts
// (wages, SS, withdrawals, brokerage, Roth, taxes, etc.)
// look identical across all charts.
export const PALETTE = {
  // Income & spending flows
  wages: "#9CA3AF",        // gray
  ss: "#60A5FA",           // blue
  ann: "#34D399",          // green
  reCF: "#F59E0B",         // orange
  rmdNet: "#A78BFA",       // purple
  withdrawals: "#F472B6",  // pink
  spending: "#EF4444",     // red

  // Account types / balances
  brokerage: "#3B82F6",    // blue
  cds: "#06B6D4",          // teal
  k401: "#F59E0B",         // orange
  roth: "#34D399",         // green
  netWorth: "#0EA5E9",     // cyan

  // Taxes
  taxesTotal: "#FB7185",
  effRateLine: "#111827",

  // Generic categorical palette (for pies, etc.)
  categorical: [
    "#2563EB",
    "#16A34A",
    "#F59E0B",
    "#EF4444",
    "#8B5CF6",
    "#0EA5E9",
    "#10B981",
    "#F97316",
  ],
};
