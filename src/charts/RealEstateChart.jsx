// src/charts/RealEstateChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  Line,
  Bar,
} from "recharts";

// Compact $ axis formatter like $6M, $165k, etc.
function fmtDollarShort(n) {
  if (n == null || isNaN(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

// Small legend pill
function LegendItem({ color, label, type = "line" }) {
  const markerStyle =
    type === "bar"
      ? {
          width: 12,
          height: 12,
          borderRadius: 2,
          background: color,
          display: "inline-block",
        }
      : {
          width: 16,
          height: 0,
          borderTop: `3px solid ${color}`,
          display: "inline-block",
          position: "relative",
          top: 2,
        };
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={markerStyle} />
      <span style={{ fontSize: 16, color: "#374151" }}>{label}</span>
    </span>
  );
}

export default function RealEstateChart({ data = [], height = 340 }) {
  // Normalize rows
  const rows = (data || []).map((r) => ({
    year: r.year,
    houseVal: Math.max(0, r.houseVal || 0),
    mortgage: Math.max(0, r.mortgage || 0),
    equityRealized: Math.max(0, r.equityRealized || 0),
  }));

  // Layout constants
  const LEGEND_HEIGHT = 26;
  const LEGEND_GAP = 4; // tighter spacing between axis labels and legend

  // Make sure chart area never goes negative, even if a tiny height is passed
  const chartHeight = Math.max(120, Number(height) - LEGEND_HEIGHT - LEGEND_GAP);

  return (
    <div style={{ width: "100%", height }}>
      {/* Chart area */}
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={rows}
            margin={{ top: 12, right: 18, bottom: 36, left: 64 }} // reduced bottom margin
          >
            <CartesianGrid strokeDasharray="3 3" />

            <XAxis
              dataKey="year"
              height={40}
              tick={{ angle: -45, textAnchor: "end" }}
              dy={8} // small nudge down so labels clear axis line
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

            <Bar
              dataKey="equityRealized"
              name="Equity Realized"
              barSize={16}
              fill="#10b981"
            />
            <Line
              type="monotone"
              dataKey="mortgage"
              name="Mortgage"
              stroke="#ef4444"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="houseVal"
              name="Property Value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* External legend pinned directly under the chart area */}
      <div
        style={{
          height: LEGEND_HEIGHT,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: 16,
          marginTop: LEGEND_GAP,
        }}
      >
        <LegendItem color="#10b981" type="bar" label="Equity Realized" />
        <LegendItem color="#ef4444" label="Mortgage" />
        <LegendItem color="#3b82f6" label="Property Value" />
      </div>
    </div>
  );
}