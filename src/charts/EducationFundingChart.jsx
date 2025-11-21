import React from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { currency } from "../utils/formatters";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";

/** Colors (synced) */
const COLORS = {
  hsTotal: "#3b82f6",          // HS Total
  hsPaidBy529: "#8b5cf6",      // HS Paid by 529
  collegeTotal: "#10b981",     // College Total
  collegePaidBy529: "#22c55e", // College Paid by 529
  fromPortfolio: "#f97316",    // From Portfolio
  totalEduSpend: "#111827",    // Total Education Spend (line)
};

/** Chart spacing — smaller bottom now since legend is outside */
const CHART_MARGIN = { top: 12, right: 18, left: 60, bottom: 36 };

/** X tick settings — pulled slightly closer to axis */
const X_TICK_PROPS = {
  angle: -45,
  textAnchor: "end",
  height: 34,
  dy: 2,           // was 6 → closer to axis
  interval: 0,
  tickMargin: 2,   // was 4 → less extra padding
};

/** Legend row outside the chart */
function LegendRow() {
  const items = [
    { key: "collegePaidBy529", label: "College Paid by 529", color: COLORS.collegePaidBy529 },
    { key: "collegeTotal",     label: "College Total",       color: COLORS.collegeTotal },
    { key: "fromPortfolio",    label: "From Portfolio",      color: COLORS.fromPortfolio },
    { key: "hsPaidBy529",      label: "HS Paid by 529",      color: COLORS.hsPaidBy529 },
    { key: "hsTotal",          label: "HS Total",            color: COLORS.hsTotal },
    { key: "totalEduSpend",    label: "Total Education Spend", color: COLORS.totalEduSpend, isLine: true },
  ];

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: 14,
        alignItems: "center",
        justifyContent: "center",
        fontSize: CHART_TEXT_SIZE,
        color: CHART_TEXT_COLOR,
        marginTop: 2,   // was 8 → reduced gap
      }}
    >
      {items.map((it) => (
        <div key={it.key} style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            style={{
              width: it.isLine ? 18 : 12,
              height: it.isLine ? 2 : 12,
              background: it.color,
              borderRadius: it.isLine ? 0 : 3,
              display: "inline-block",
            }}
          />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

export default function EducationFundingChart({ data, height = 380 }) {
  const rows = data.map((r) => ({
    year: r.year,
    hsTotal: r.hsTotal || 0,
    hsPaidBy529: r.hsPaidBy529 || 0,
    collegeTotal: r.collegeTotal || 0,
    collegePaidBy529: r.collegePaidBy529 || 0,
    fromPortfolio: (r.hsFromPortfolio || 0) + (r.collegeFromPortfolio || 0),
    totalEduSpend: (r.hsTotal || 0) + (r.collegeTotal || 0),
  }));

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      {/* Chart */}
      <div style={{ width: "100%", height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={CHART_MARGIN}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="year"
              tick={X_TICK_PROPS}
              interval={0}
              style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
            />
            <YAxis
              tickFormatter={(v) => currency(v)}
              width={80}
              style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
            />
            <Tooltip formatter={(value) => currency(value)} />

            {/* Bars */}
            <Bar dataKey="hsTotal" stackId="hs" fill={COLORS.hsTotal} name="HS Total" barSize={20} />
            <Bar dataKey="hsPaidBy529" stackId="hs" fill={COLORS.hsPaidBy529} name="HS Paid by 529" barSize={20} />
            <Bar dataKey="collegeTotal" stackId="college" fill={COLORS.collegeTotal} name="College Total" barSize={20} />
            <Bar dataKey="collegePaidBy529" stackId="college" fill={COLORS.collegePaidBy529} name="College Paid by 529" barSize={20} />
            <Bar dataKey="fromPortfolio" stackId="portfolio" fill={COLORS.fromPortfolio} name="From Portfolio" barSize={20} />

            {/* Line */}
            <Line
              type="monotone"
              dataKey="totalEduSpend"
              stroke={COLORS.totalEduSpend}
              name="Total Education Spend"
              strokeWidth={2}
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Legend outside */}
      <LegendRow />
    </div>
  );
}
