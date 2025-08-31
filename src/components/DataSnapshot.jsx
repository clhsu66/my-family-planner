// src/components/DataSnapshot.jsx
import React from "react";

/**
 * Props:
 * - finalSnap: object (typically det[det.length-1])
 * - firstYear: object (a selected snapshot, e.g. from a chosen year)
 * - currencyFormatter: fn(number) -> string
 */
export default function DataSnapshot({
  finalSnap = {},
  firstYear = {},
  currencyFormatter = (n) => String(n),
}) {
  const table = {
    width: "auto",
    maxWidth: "100%",
    borderCollapse: "collapse",
    fontSize: 12,
    margin: "0 auto",
  };
  const td = { padding: "6px 8px", borderBottom: "1px solid #f3f4f6" };
  const wrap = {
    display: "grid",
    gridTemplateColumns: "repeat(2, minmax(0,1fr))",
    gap: 16,
  };

  return (
    <div style={wrap}>
      {/* Final Year */}
      <div>
        <h4 style={{ margin: "6px 0" }}>Final Year</h4>
        <table style={table}>
          <tbody>
            <tr><td style={td}>Brokerage</td><td style={td}>{currencyFormatter(finalSnap.balBroker || 0)}</td></tr>
            <tr><td style={td}>CDs</td><td style={td}>{currencyFormatter(finalSnap.balCDs || 0)}</td></tr>
            <tr><td style={td}>401k (Both)</td><td style={td}>{currencyFormatter(finalSnap.bal401k || 0)}</td></tr>
            <tr><td style={td}>Roth (Both)</td><td style={td}>{currencyFormatter(finalSnap.balRoth || 0)}</td></tr>
            <tr>
              <td style={td}><strong>Investables</strong></td>
              <td style={td}><strong>{currencyFormatter(finalSnap.totalLiquid || 0)}</strong></td>
            </tr>
            <tr><td style={td}>529 Total</td><td style={td}>{currencyFormatter(finalSnap.bal529Total || 0)}</td></tr>
            <tr><td style={td}>Home Equity</td><td style={td}>{currencyFormatter(finalSnap.houseEquity || 0)}</td></tr>
            <tr>
              <td style={td}><strong>Net Worth</strong></td>
              <td style={td}><strong>{currencyFormatter(finalSnap.netWorth || 0)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Custom Year */}
      <div>
        <h4 style={{ margin: "6px 0" }}>
          Custom Year: {firstYear.year || "-"}
        </h4>
        <table style={table}>
          <tbody>
            <tr><td style={td}>Brokerage</td><td style={td}>{currencyFormatter(firstYear.balBroker || 0)}</td></tr>
            <tr><td style={td}>CDs</td><td style={td}>{currencyFormatter(firstYear.balCDs || 0)}</td></tr>
            <tr><td style={td}>401k (Both)</td><td style={td}>{currencyFormatter(firstYear.bal401k || 0)}</td></tr>
            <tr><td style={td}>Roth (Both)</td><td style={td}>{currencyFormatter(firstYear.balRoth || 0)}</td></tr>
            <tr>
              <td style={td}><strong>Investables</strong></td>
              <td style={td}><strong>{currencyFormatter(firstYear.totalLiquid || 0)}</strong></td>
            </tr>
            <tr><td style={td}>529 Total</td><td style={td}>{currencyFormatter(firstYear.bal529Total || 0)}</td></tr>
            <tr><td style={td}>Home Equity</td><td style={td}>{currencyFormatter(firstYear.houseEquity || 0)}</td></tr>
            <tr>
              <td style={td}><strong>Net Worth</strong></td>
              <td style={td}><strong>{currencyFormatter(firstYear.netWorth || 0)}</strong></td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}