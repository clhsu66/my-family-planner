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
      <span style={{ fontSize: 12, color: "#374151" }}>{label}</span>
    </span>
  );
}

export default function WithdrawalPlanChart({ rows = [], height = 360, currencyFormatter }) {
  const LEGEND_H = 26;
  const GAP = 4;
  const chartH = Math.max(120, Number(height) - LEGEND_H - GAP);

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
            />
            <YAxis width={86} tickFormatter={fmtDollarShort} />
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

            <Bar dataKey="taxable"       name="Taxable (Brokerage)" fill="#60a5fa" />
            <Bar dataKey="cds"           name="CDs/Ladders"        fill="#06b6d4" />
            <Bar dataKey="deferredGross" name="401k (GROSS)"       fill="#f59e0b" />
            <Bar dataKey="taxFree"       name="Roth (Tax-Free)"    fill="#34d399" />
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
          marginTop: GAP,
        }}
      >
        <LegendItem color="#60a5fa" label="Taxable (Brokerage)" />
        <LegendItem color="#06b6d4" label="CDs/Ladders" />
        <LegendItem color="#f59e0b" label="401k (GROSS)" />
        <LegendItem color="#34d399" label="Roth (Tax-Free)" />
      </div>
    </div>
  );
}