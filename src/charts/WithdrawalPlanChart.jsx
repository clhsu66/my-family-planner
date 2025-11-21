import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Bar,
} from "recharts";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

function fmtDollarShort(n) {
  if (n == null || isNaN(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n/1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000)     return `$${(n/1_000_000).toFixed(0)}M`;
  if (abs >= 1_000)         return `$${(n/1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

function LegendItem({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 12, height: 12, borderRadius: 2, background: color }} />
      <span style={{ fontSize: CHART_TEXT_SIZE, color: CHART_TEXT_COLOR }}>{label}</span>
    </span>
  );
}

export default function WithdrawalPlanChart({ rows = [], height = 360, currencyFormatter }) {
  const LEGEND_H = 26;
  const GAP_TOP = 8;
  const GAP_BOTTOM = 24;
  const chartH = Math.max(
    120,
    Number(height) - LEGEND_H - GAP_TOP - GAP_BOTTOM
  );

  return (
    <div style={{ width: "100%", height }}>
      <div style={{ width: "100%", height: chartH }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 12, right: 18, bottom: 36, left: 64 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              height={40}
              tick={{ angle: -45, textAnchor: "end" }}
              dy={8}
              style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
            />
            <YAxis
              width={86}
              tickFormatter={fmtDollarShort}
              style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
            />
            <Tooltip
              formatter={(v) =>
                currencyFormatter
                  ? currencyFormatter(v)
                  : new Intl.NumberFormat(undefined, {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    }).format(v)
              }
            />

            <Bar
              dataKey="taxable"
              name="Taxable (Brokerage)"
              fill={PALETTE.brokerage}
            />
            <Bar
              dataKey="cds"
              name="CDs/Ladders"
              fill={PALETTE.cds}
            />
            <Bar
              dataKey="deferredGross"
              name="401k (GROSS)"
              fill={PALETTE.k401}
            />
            <Bar
              dataKey="taxFree"
              name="Roth (Tax-Free)"
              fill={PALETTE.roth}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          height: LEGEND_H,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          marginTop: GAP_TOP,
          marginBottom: GAP_BOTTOM,
        }}
      >
        <LegendItem color={PALETTE.brokerage} label="Taxable (Brokerage)" />
        <LegendItem color={PALETTE.cds} label="CDs/Ladders" />
        <LegendItem color={PALETTE.k401} label="401k (GROSS)" />
        <LegendItem color={PALETTE.roth} label="Roth (Tax-Free)" />
      </div>
    </div>
  );
}
