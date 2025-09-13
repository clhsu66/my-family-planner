import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

/* =================== Styling / Spacing =================== */
const COLORS = {
  survival: "#0ea5e9",     // line color
  legendLine: "#111827",   // legend chip for "line"
};

// Smaller bottom margin since legend lives outside the chart
const CHART_MARGIN = { top: 12, right: 18, left: 60, bottom: 36 };

// Pull the year labels closer to the axis and reduce the default extra gap
const X_TICK_PROPS = {
  angle: -45,
  textAnchor: "end",
  height: 34,
  dy: 2,          // closer to axis (was larger before)
  interval: 0,
  tickMargin: 2,  // tighten the built-in gap
};

/* =================== Legend (outside) =================== */
function LegendRow() {
  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        alignItems: "center",
        justifyContent: "center",
        fontSize: 16,
        color: "#374151",
        marginTop: 2, // tighten the space under the years
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <span
          style={{
            width: 18,
            height: 2,
            background: COLORS.survival,
            display: "inline-block",
          }}
        />
        <span>Success Rate (alive %)</span>
      </div>
    </div>
  );
}

/* =================== Chart =================== */
/**
 * Props:
 *  - data: [{ year: number, aliveRate: number }] where aliveRate is 0..1
 *  - height?: number (default 300)
 */
export default function SuccessRateChart({ data = [], height = 300 }) {
  // Normalize data to show percent on Y axis
  const rows = (data || []).map((d) => ({
    year: d.year,
    pct: Math.max(0, Math.min(1, d.aliveRate || 0)) * 100,
  }));

  const formatPct = (v) => `${Math.round(v)}%`;

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Chart */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={rows} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />

            <XAxis
              dataKey="year"
              tick={X_TICK_PROPS}
              interval={0}
              style={{ fontSize: 12, fill: "#374151" }}
            />

            <YAxis
              domain={[0, 100]}
              tickFormatter={formatPct}
              width={56}
              style={{ fontSize: 12, fill: "#374151" }}
            />

            <Tooltip
              formatter={(value) => formatPct(value)}
              labelFormatter={(label) => `${label}`}
            />

            <Line
              type="monotone"
              dataKey="pct"
              stroke={COLORS.survival}
              strokeWidth={2}
              dot={false}
              name="Success Rate (alive %)"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Legend outside (tight gap) */}
      <LegendRow />
    </div>
  );
}