import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Bar,
  Line,
} from "recharts";
import { currency } from "../utils/formatters";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

const COLORS = {
  annuities: PALETTE.ann,
  social: PALETTE.ss,
  wages: PALETTE.wages,
  withdrawals: PALETTE.withdrawals,
  spending: PALETTE.spending,
};

// How far to push the legend down (away from the years)
const LEGEND_PULL_DOWN = -20;   // px — increase if you want more gap
const LEGEND_BOTTOM = -LEGEND_PULL_DOWN;

// Bottom padding so the pushed-down legend remains visible
const CONTAINER_PAD_BOTTOM = LEGEND_PULL_DOWN + 3;

function dollarShort(n) {
  if (n == null) return "";
  const a = Math.abs(n);
  if (a >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(1)}B`;
  if (a >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (a >= 1_000) return `${(n / 1_000).toFixed(1)}k`;
  return currency(n);
}

export default function IncomeVsSpendingChart({ data = [], height = 360 }) {
  const rows = (data || []).map((r) => ({
    year: String(r.year),
    Annuities: Math.max(0, r.annuityIncome || 0),
    "Social Security": Math.max(0, r.ssIncome || 0),
    Wages: Math.max(0, (r.wageSelf || 0) + (r.wageSpouse || 0)),
    "Withdrawals (From Portfolio)":
      Math.max(
        0,
        (r.wdBroker || 0) +
          (r.wdCDs || 0) +
          (r.wd401kSelfGross || 0) +
          (r.wd401kSpouseGross || 0) +
          (r.wdRothSelf || 0) +
          (r.wdRothSpouse || 0) +
          (r.rmdSelfGross || 0) +
          (r.rmdSpouseGross || 0)
      ),
    "Total Spending": Math.max(0, r.totalSpending || 0),
  }));

  // Enough for ticks ONLY; legend will be pushed outside with absolute positioning
  const MARGIN = { top: 8, right: 18, left: 70, bottom: 56 };

  // Keep year labels near the axis line
  const X_TICKS = {
    angle: -45,
    textAnchor: "end",
    height: 38,
    dy: 8,
    tickMargin: 2,
  };

  return (
    <div style={{ width: "100%", height, position: "relative", paddingBottom: CONTAINER_PAD_BOTTOM }}>
      <ResponsiveContainer>
        <ComposedChart data={rows} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            {...X_TICKS}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          <YAxis
            width={70}
            tickFormatter={dollarShort}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          <Tooltip
            formatter={(v, name) => [currency(v), name]}
            labelFormatter={(l) => `Year: ${l}`}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            iconType="square"
            // Move legend DOWN away from years (absolute offset from the chart bottom)
            wrapperStyle={{
              bottom: LEGEND_BOTTOM, // e.g. -32px pushes it below the chart
              position: "absolute",
              fontSize: CHART_TEXT_SIZE,
              color: CHART_TEXT_COLOR,
            }}
          />

          <Bar dataKey="Annuities" stackId="cash" fill={COLORS.annuities} />
          <Bar dataKey="Social Security" stackId="cash" fill={COLORS.social} />
          <Bar dataKey="Wages" stackId="cash" fill={COLORS.wages} />
          <Bar
            dataKey="Withdrawals (From Portfolio)"
            stackId="cash"
            fill={COLORS.withdrawals}
          />
          <Line
            type="monotone"
            dataKey="Total Spending"
            stroke={COLORS.spending}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
