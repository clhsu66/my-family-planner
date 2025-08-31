// src/charts/ScenarioCompareChart.jsx
import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";

export default function ScenarioCompareChart({ series = [], height = 320, currencyFn = (n)=>String(n) }) {
  // Merge by year: {year, [scenarioName]: value}
  const yearMap = new Map();
  for (const s of series) {
    for (const pt of s.points) {
      const row = yearMap.get(pt.year) ?? { year: pt.year };
      row[s.name] = pt.value;
      yearMap.set(pt.year, row);
    }
  }
  const data = Array.from(yearMap.values()).sort((a, b) => a.year - b.year);

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis width={90} tickFormatter={currencyFn} />
          <Tooltip
            formatter={(v) => currencyFn(v)}
            labelFormatter={(label) => `Year: ${label}`}
          />
          <Legend />
          {series.map((s) => (
            <Line
              key={s.name}
              type="monotone"
              dataKey={s.name}
              stroke={s.color}
              dot={false}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}