import React from "react";

/**
 * IncomeCompositionTable
 * Renders the table under “Income Composition vs Spending & Withdrawals”.
 * Shows first 15 years by default.
 */
export default function IncomeCompositionTable({
  det = [],
  currencyFormatter = (n) => n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 }),
  maxYears = 15,
}) {
  const rows = det.slice(0, maxYears).map((r) => {
    const wages = (r.wageSelf || 0) + (r.wageSpouse || 0);
    const ss = r.ssIncome || 0;
    const annuities = r.annuityIncome || 0;
    const withdrawals =
      (r.wdBroker || 0) +
      (r.wdCDs || 0) +
      (r.wd401kSelfGross || 0) +
      (r.wd401kSpouseGross || 0) +
      (r.wdRothSelf || 0) +
      (r.wdRothSpouse || 0) +
      (r.rmdSelfGross || 0) +
      (r.rmdSpouseGross || 0);

    const totalIncome = wages + ss + annuities + withdrawals;
    const spending = r.totalSpending || 0;
    const gap = (totalIncome || 0) - (spending || 0);

    return {
      year: r.year,
      wages,
      ss,
      annuities,
      withdrawals,
      totalIncome,
      spending,
      gap,
    };
  });

  const td = { padding: "6px 8px", borderBottom: "1px solid #f3f4f6" };
  const th = { textAlign: "left", padding: "6px 8px", borderBottom: "1px solid #e5e7eb", whiteSpace: "nowrap" };

  return (
    <div style={{ overflowX: "auto" }}>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
        <thead>
          <tr>
            <th style={th}>Year</th>
            <th style={th}>Wages</th>
            <th style={th}>Social Security</th>
            <th style={th}>Annuities</th>
            <th style={th}>Withdrawals</th>
            <th style={th}>Total Income</th>
            <th style={th}>Spending</th>
            <th style={th}>Gap / (Surplus)</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.year}>
              <td style={td}>{r.year}</td>
              <td style={td}>{currencyFormatter(r.wages)}</td>
              <td style={td}>{currencyFormatter(r.ss)}</td>
              <td style={td}>{currencyFormatter(r.annuities)}</td>
              <td style={td}>{currencyFormatter(r.withdrawals)}</td>
              <td style={td}>{currencyFormatter(r.totalIncome)}</td>
              <td style={td}>{currencyFormatter(r.spending)}</td>
              <td style={{ ...td, color: r.gap < 0 ? "#dc2626" : "#16a34a" }}>
                {r.gap < 0 ? "-" : ""}
                {currencyFormatter(Math.abs(r.gap))}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ marginTop: 8, fontSize: 11, color: "#6b7280" }}>
        Showing the first {Math.min(maxYears, det.length)} years. Positive “Gap” means surplus (more sources than spending); negative
        means shortfall.
      </div>
    </div>
  );
}