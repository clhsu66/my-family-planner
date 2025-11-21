// charts/InvestableBalancesChart.js
import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
} from "recharts";
import { currency } from "../utils/formatters";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

export default function InvestableBalancesChart({ data, height = 360 }) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <ComposedChart
        data={data}
        margin={{ top: 20, right: 20, left: 20, bottom: 0 }}
      >
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis
          dataKey="year"
          angle={-45}
          textAnchor="end"
          interval={0}
          tick={{ fontSize: CHART_TEXT_SIZE }}
          height={80}
          dy={20}   // push years closer to X-axis
          tickMargin={2} // reduce gap between years and legend
          style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
        />
        <YAxis
          tickFormatter={currency}
          width={100}
          style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
        />
        <Tooltip formatter={(v) => currency(v)} />
        <Legend
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{
            paddingTop: 0,   // remove extra padding
            marginTop: -40,  // pull legend closer to years
            fontSize: CHART_TEXT_SIZE,
            color: CHART_TEXT_COLOR,
          }}
        />

        <Bar
          dataKey="balBroker"
          stackId="a"
          fill={PALETTE.brokerage}
          name="Brokerage"
        />
        <Bar
          dataKey="balCDs"
          stackId="a"
          fill={PALETTE.cds}
          name="CDs"
        />
        <Bar
          dataKey="bal401k"
          stackId="a"
          fill={PALETTE.k401}
          name="401k"
        />
        <Bar
          dataKey="balRoth"
          stackId="a"
          fill={PALETTE.roth}
          name="Roth"
        />
      </ComposedChart>
    </ResponsiveContainer>
  );
}
