// src/components/tables/WithdrawalPlanTable.jsx
import React from "react";

/**
 * WithdrawalPlanTable
 * Props:
 *  - rows: Array<{ year, need, taxable, cds, deferredGross, deferredNet, taxFree, notes }>
 *  - formatCurrency: (n:number)=>string   // optional; falls back to toLocaleString USD
 *  - maxRows: number                      // optional; default 30
 */
export default function WithdrawalPlanTable({ rows = [], formatCurrency, maxRows = 30 }) {
  const currency =
    formatCurrency ||
    ((n) =>
      Number.isFinite(n)
        ? n.toLocaleString(undefined, {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
          })
        : "-");

  // lightweight, component-local table styles (so we don't depend on App.jsx's panel styles)
  const styles = {
    wrapper: { overflow: "auto" },
    table: {
      width: "100%",
      maxWidth: "100%",
      borderCollapse: "collapse",
      fontSize: 12,
    },
    th: {
      textAlign: "left",
      padding: "6px 8px",
      borderBottom: "1px solid #e5e7eb",
      whiteSpace: "nowrap",
      background: "#fafafa",
      position: "sticky",
      top: 0,
    },
    td: { padding: "6px 8px", borderBottom: "1px solid #f3f4f6", whiteSpace: "nowrap" },
  };

  return (
    <div style={styles.wrapper}>
      <table style={styles.table}>
        <thead>
          <tr>
            <th style={styles.th}>Year</th>
            <th style={styles.th}>Need (After Non-Portfolio)</th>
            <th style={styles.th}>Taxable</th>
            <th style={styles.th}>CDs</th>
            <th style={styles.th}>401k Gross</th>
            <th style={styles.th}>401k Net</th>
            <th style={styles.th}>Roth</th>
            <th style={styles.th}>Notes</th>
          </tr>
        </thead>
        <tbody>
          {rows.slice(0, maxRows).map((r) => (
            <tr key={r.year}>
              <td style={styles.td}>{r.year}</td>
              <td style={styles.td}>{currency(r.need)}</td>
              <td style={styles.td}>{currency(r.taxable)}</td>
              <td style={styles.td}>{currency(r.cds)}</td>
              <td style={styles.td}>{currency(r.deferredGross)}</td>
              <td style={styles.td}>{currency(r.deferredNet)}</td>
              <td style={styles.td}>{currency(r.taxFree)}</td>
              <td style={styles.td}>{r.notes || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}