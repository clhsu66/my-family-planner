import React, { useMemo } from "react";

export default function FinalAllocationSnapshot({
  finalSnap = {},
  currencyFormatter = (n) =>
    Number.isFinite(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
      : "-",
  title = "Final Allocation Snapshot (Last Year)",
  subtitle = "Investables mix only",
}) {
  const currency = currencyFormatter;

  const { taxable, deferred, taxfree, investable } = useMemo(() => {
    const taxable = Math.max(0, (finalSnap.balBroker || 0)) + Math.max(0, (finalSnap.balCDs || 0));
    const deferred = Math.max(0, (finalSnap.bal401k || 0));
    const taxfree  = Math.max(0, (finalSnap.balRoth || 0));
    const investable = Math.max(1, taxable + deferred + taxfree);
    return { taxable, deferred, taxfree, investable };
  }, [finalSnap]);

  const pct = (x) => ((x / investable) * 100).toFixed(0) + "%";

  return (
    <div>
      <h3 style={{ margin: "0 0 8px", fontWeight: 600, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span>{title}</span>
        <span style={{ fontSize: 12, color: "#6b7280" }}>{subtitle}</span>
      </h3>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3,minmax(0,1fr))", gap: 12, fontSize: 14 }}>
        <div>
          <strong>Taxable</strong>
          <div>
            {currency(taxable)} ({pct(taxable)})
            <div style={{ fontSize: 12, color: "#6b7280" }}>Brokerage, CDs</div>
          </div>
        </div>

        <div>
          <strong>Tax-Deferred</strong>
          <div>
            {currency(deferred)} ({pct(deferred)})
            <div style={{ fontSize: 12, color: "#6b7280" }}>401k (RMDs)</div>
          </div>
        </div>

        <div>
          <strong>Tax-Free</strong>
          <div>
            {currency(taxfree)} ({pct(taxfree)})
            <div style={{ fontSize: 12, color: "#6b7280" }}>Roth IRA</div>
          </div>
        </div>
      </div>
    </div>
  );
}