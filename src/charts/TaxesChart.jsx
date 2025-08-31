import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  Line,
} from "recharts";
import { PALETTE } from "../utils/palette";

const fmt0 = (n) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const pct1 = (x) =>
  (x ?? 0).toLocaleString(undefined, { style: "percent", maximumFractionDigits: 1 });

/**
 * TaxesChart
 * - Bars: total taxes in $
 * - Line (right axis): effective income tax rate = (taxTotal - brokerage drag) / taxableBase
 *   where taxableBase = wages + taxable SS + taxable annuities + 401k withdrawals + RMDs
 *
 * Props:
 *  - data: yearly rows from simulator (det)
 *  - ssTaxablePercent: 0..1
 *  - annuityTaxablePercent: 0..1
 *  - height: number
 */
export default function TaxesChart({
  data = [],
  ssTaxablePercent = 0.5,
  annuityTaxablePercent = 1,
  height = 340,
}) {
  const rows = useMemo(() => {
    return (data || []).map((r) => {
      const wages =
        Math.max(0, r.wageSelf || 0) + Math.max(0, r.wageSpouse || 0);
      const ssTaxable = Math.max(0, r.ssIncome || 0) * (ssTaxablePercent || 0);
      const annTaxable =
        Math.max(0, r.annuityIncome || 0) * (annuityTaxablePercent || 0);

      const rmdGross =
        Math.max(0, r.rmdSelfGross || 0) + Math.max(0, r.rmdSpouseGross || 0);
      const wd401kGross =
        Math.max(0, r.wd401kSelfGross || 0) +
        Math.max(0, r.wd401kSpouseGross || 0);

      const taxableBase =
        wages + ssTaxable + annTaxable + rmdGross + wd401kGross;

      const taxTotal = Math.max(0, r.taxTotal || 0);
      const taxBrokerageDrag = Math.max(0, r.taxBrokerageDrag || 0);
      const incomeTaxOnly = Math.max(0, taxTotal - taxBrokerageDrag);

      const effRate =
        taxableBase > 0 ? Math.min(1, incomeTaxOnly / taxableBase) : 0;

      return {
        year: r.year,
        taxTotal,
        effRate, // 0..1
        _taxableBase: taxableBase,
        _incomeTaxOnly: incomeTaxOnly,
      };
    });
  }, [data, ssTaxablePercent, annuityTaxablePercent]);

  const MARGIN = { top: 12, right: 18, bottom: 58, left: 60 };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="year"
            tick={{ fontSize: 12 }}
            angle={-45}
            textAnchor="end"
            height={40}
            dy={14}
            interval={0}
            tickMargin={10}
          />

          {/* Left axis: $ taxes */}
          <YAxis
            yAxisId="left"
            tickFormatter={(v) => `$${fmt0(v)}`}
            width={70}
            tick={{ fontSize: 12 }}
          />
          {/* Right axis: % effective rate */}
          <YAxis
            yAxisId="right"
            orientation="right"
            tickFormatter={(v) =>
              (v ?? 0).toLocaleString(undefined, {
                style: "percent",
                maximumFractionDigits: 0,
              })
            }
            width={46}
            tick={{ fontSize: 12 }}
          />

          <Tooltip
            formatter={(val, name, p) => {
              if (name === "Effective Tax Rate") return [pct1(val), name];
              return [`$${fmt0(val)}`, name];
            }}
            labelFormatter={(label) => `Year ${label}`}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ paddingTop: 4, marginTop: -6 }}
          />

          <Bar
            yAxisId="left"
            dataKey="taxTotal"
            name="Total Taxes ($)"
            fill={PALETTE.taxesTotal}
            maxBarSize={26}
          />

          <Line
            yAxisId="right"
            type="monotone"
            dataKey="effRate"
            name="Effective Tax Rate"
            stroke={PALETTE.effRateLine}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}