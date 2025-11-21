import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Line,
} from "recharts";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";
import { currency } from "../utils/formatters";

// Uses Monte Carlo balance percentiles to approximate
// a "safe" spend band assuming a constant draw rate.
export default function SpendingSafetyChart({
  det = [],
  perYear = [],
  drawRate = 0.04,
  height = 320,
}) {
  const rows = useMemo(() => {
    if (!det.length || !perYear.length) return [];
    return det.map((r, idx) => {
      const mc = perYear[idx] || {};
      const p10 = (mc.p10 || 0) * drawRate;
      const p50 = (mc.p50 || 0) * drawRate;
      const p90 = (mc.p90 || 0) * drawRate;
      return {
        year: r.year,
        target: r.totalSpending || 0,
        safeLow: p10,
        safeMid: p50,
        safeHigh: p90,
      };
    });
  }, [det, perYear, drawRate]);

  if (!rows.length) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#6b7280" }}>
        Monte Carlo must be run to show safety bands.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart
          data={rows}
          margin={{ top: 12, right: 18, bottom: 36, left: 70 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="year"
            angle={-45}
            textAnchor="end"
            height={40}
            dy={8}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          <YAxis
            width={80}
            tickFormatter={(v) => currency(v)}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          <Tooltip
            formatter={(v, name) => [currency(v), name]}
            labelFormatter={(label) => `Year ${label}`}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              fontSize: CHART_TEXT_SIZE,
              color: CHART_TEXT_COLOR,
              marginTop: 4,
            }}
          />

          <Line
            type="monotone"
            dataKey="safeHigh"
            name="Safe (p90)"
            stroke={PALETTE.ann}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="safeMid"
            name="Safe (p50)"
            stroke={PALETTE.reCF}
            strokeWidth={2}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="safeLow"
            name="Safe (p10)"
            stroke={PALETTE.withdrawals}
            strokeWidth={1.5}
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="target"
            name="Target spending"
            stroke={PALETTE.spending}
            strokeWidth={2}
            dot={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

