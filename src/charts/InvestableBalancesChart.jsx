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
          tick={{ fontSize: 12 }}
          height={80}
          dy={20}   // push years closer to X-axis
          tickMargin={2} // reduce gap between years and legend
        />
        <YAxis
          tickFormatter={currency}
          width={100}
        />
        <Tooltip formatter={(v) => currency(v)} />
        <Legend
          verticalAlign="bottom"
          align="center"
          wrapperStyle={{
            paddingTop: 0,   // remove extra padding
            marginTop: -40,  // pull legend closer to years
          }}
        />

        <Bar dataKey="balBroker" stackId="a" fill="#3b82f6" name="Brokerage" />
        <Bar dataKey="balCDs" stackId="a" fill="#f59e0b" name="CDs" />
        <Bar dataKey="bal401k" stackId="a" fill="#10b981" name="401k" />
        <Bar dataKey="balRoth" stackId="a" fill="#ef4444" name="Roth" />
      </ComposedChart>
    </ResponsiveContainer>
  );
}