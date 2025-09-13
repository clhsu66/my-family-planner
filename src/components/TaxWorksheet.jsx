// src/components/TaxWorksheet.jsx
import React from "react";

/**
 * Props:
 * - latest: object (the most recent snapshot from det[det.length-1])
 * - ssTaxablePercent, annuityTaxablePercent, effOrdinaryTaxRate: numbers (0–1)
 * - currencyFormatter: fn(number) -> string
 */
export default function TaxWorksheet({
  latest = {},
  ssTaxablePercent = 0,
  annuityTaxablePercent = 1,
  effOrdinaryTaxRate = 0,
  currencyFormatter = (n) => String(n),
}) {
  const pct = (x) => Math.round((x || 0) * 100);

  return (
    <div>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 12,
          fontSize: 14,
        }}
      >
        <div>
          <div><strong>Ordinary income</strong></div>
          <div className="row">
            Wages: {currencyFormatter(latest.wageSelf || 0)} (you) ·{" "}
            {currencyFormatter(latest.wageSpouse || 0)} (spouse)
          </div>
          <div className="row">
            SS income: {currencyFormatter(latest.ssIncome || 0)} · taxable ~
            {pct(ssTaxablePercent)}%
          </div>
          <div className="row">
            Annuities: {currencyFormatter(latest.annuityIncome || 0)} · taxable ~
            {pct(annuityTaxablePercent)}%
          </div>
          <div className="row">
            Tax on ordinary @ eff ~{pct(effOrdinaryTaxRate)}%:{" "}
            <strong>{currencyFormatter(latest.taxOtherIncome || 0)}</strong>
          </div>
        </div>

        <div>
          <div><strong>Tax-deferred distributions</strong></div>
          <div className="row">
            RMD Self: {currencyFormatter(latest.rmdSelfGross || 0)} · tax{" "}
            {currencyFormatter(latest.rmdSelfTax || 0)}
          </div>
          <div className="row">
            RMD Spouse: {currencyFormatter(latest.rmdSpouseGross || 0)} · tax{" "}
            {currencyFormatter(latest.rmdSpouseTax || 0)}
          </div>
          <div className="row">
            401k withdrawals tax:{" "}
            <strong>{currencyFormatter(latest.tax401kTotal || 0)}</strong>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8, fontSize: 14 }}>
        <div>
          Brokerage drag (already taken out of returns):{" "}
          <strong>{currencyFormatter(latest.taxBrokerageDrag || 0)}</strong>
        </div>
        <div>
          Total estimated taxes:{" "}
          <strong>{currencyFormatter(latest.taxTotal || 0)}</strong>
        </div>
      </div>
    </div>
  );
}