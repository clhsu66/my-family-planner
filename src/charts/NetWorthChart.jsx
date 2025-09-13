import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
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
      <span style={{ width: 16, height: 0, borderTop: `3px solid ${color}` }} />
      <span style={{ fontSize: 16, color: "#374151" }}>{label}</span>
    </span>
  );
}

export default function NetWorthChart({ data = [], height = 380 }) {
  const rows = (data || []).map((r) => ({
    year: r.year,
    netWorth: Math.max(0, r.netWorth || 0),
  }));

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
                new Intl.NumberFormat(undefined, {
                  style: "currency",
                  currency: "USD",
                  maximumFractionDigits: 0,
                }).format(v)
              }
            />
            <Line
              type="monotone"
              dataKey="netWorth"
              name="Net Worth"
              stroke="#0ea5e9"
              strokeWidth={2}
              dot={false}
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
          marginTop: GAP,
        }}
      >
        <LegendItem color="#0ea5e9" label="Net Worth" />
      </div>
    </div>
  );
}