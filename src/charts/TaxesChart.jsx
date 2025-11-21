// src/charts/TaxesChart.jsx
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
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";

const fmt0 = (n) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
const pct1 = (x) =>
  (x ?? 0).toLocaleString(undefined, {
    style: "percent",
    maximumFractionDigits: 1,
  });

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

  // tighter bottom margin to reduce gap between ticks and legend
  const MARGIN = { top: 12, right: 18, bottom: 0, left: 60 };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="year"
            interval={0}
            height={46}               // enough for -45° ticks but not too tall
            dy={8}                    // small dy to keep ticks near axis
            tick={{ fontSize: CHART_TEXT_SIZE, angle: -45, textAnchor: "end" }}
            tickMargin={2}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />

          <YAxis
            yAxisId="left"
            width={70}
            tick={{ fontSize: CHART_TEXT_SIZE }}
            tickFormatter={(v) => `$${fmt0(v)}`}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          <YAxis
            yAxisId="right"
            orientation="right"
            width={46}
            tick={{ fontSize: CHART_TEXT_SIZE }}
            tickFormatter={(v) =>
              (v ?? 0).toLocaleString(undefined, {
                style: "percent",
                maximumFractionDigits: 0,
              })
            }
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />

          <Tooltip
            formatter={(val, name) =>
              name === "Effective Tax Rate" ? [pct1(val), name] : [`$${fmt0(val)}`, name]
            }
            labelFormatter={(label) => `Year ${label}`}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="square"
            wrapperStyle={{
              marginTop: 4, // small top margin above legend
              fontSize: CHART_TEXT_SIZE,
              color: CHART_TEXT_COLOR,
            }}
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
