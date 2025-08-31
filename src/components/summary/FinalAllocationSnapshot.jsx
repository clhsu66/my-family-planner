// src/components/summary/FinalAllocationSnapshot.jsx
import React, { useMemo } from "react";

export default function FinalAllocationSnapshot({
  finalSnap = {},
  currencyFormatter = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
          maximumFractionDigits: 0,
        })
      : "-",
  note = "Investables mix only",
}) {
  const latest = finalSnap || {};

  const { taxable, deferred, taxfree, investable } = useMemo(() => {
    const taxableVal =
      Math.max(0, latest.balBroker || 0) + Math.max(0, latest.balCDs || 0);
    const deferredVal = Math.max(0, latest.bal401k || 0);
    const taxfreeVal = Math.max(0, latest.balRoth || 0);
    const investableVal = Math.max(1, taxableVal + deferredVal + taxfreeVal);
    return {
      taxable: taxableVal,
      deferred: deferredVal,
      taxfree: taxfreeVal,
      investable: investableVal,
    };
  }, [latest]);

  const pct = (x) => ((x / investable) * 100).toFixed(0) + "%";

  return (
    <div>
      <h3
        style={{
          margin: "0 0 8px",
          fontWeight: 600,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>Final Allocation Snapshot (Last Year)</span>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{note}</span>
      </h3>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
          gap: 12,
          fontSize: 14,
        }}
      >
        <div>
          <strong>Taxable</strong>
          <div>
            {currencyFormatter(taxable)} ({pct(taxable)})
            <div style={{ fontSize: 12, color: "#6b7280" }}>Brokerage, CDs</div>
          </div>
        </div>

        <div>
          <strong>Tax-Deferred</strong>
          <div>
            {currencyFormatter(deferred)} ({pct(deferred)})
            <div style={{ fontSize: 12, color: "#6b7280" }}>401k (RMDs)</div>
          </div>
        </div>

        <div>
          <strong>Tax-Free</strong>
          <div>
            {currencyFormatter(taxfree)} ({pct(taxfree)})
            <div style={{ fontSize: 12, color: "#6b7280" }}>Roth IRA</div>
          </div>
        </div>
      </div>
    </div>
  );
}