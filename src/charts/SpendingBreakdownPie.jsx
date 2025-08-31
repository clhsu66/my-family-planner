import React, { useMemo } from "react";
import { ResponsiveContainer, PieChart, Pie, Cell, Legend, Tooltip } from "recharts";
import { PALETTE } from "../utils/palette";

// simple $ formatter — swap if you already have one you prefer
const fmt = (n) =>
  (n || n === 0)
    ? n.toLocaleString(undefined, { style: "currency", currency: "USD", maximumFractionDigits: 0 })
    : "-";

export default function SpendingBreakdownPie({ breakdown = {}, annualSpend = 0, height = 280 }) {
  const data = useMemo(() => {
    const entries = Object.entries(breakdown || {}).filter(([_, v]) => typeof v === "number" && v > 0);
    const sum = entries.reduce((s, [, v]) => s + v, 0) || 1;

    // normalize if user inputs don’t sum to 1.0
    const norm = entries.map(([name, pct]) => {
      const weight = pct / sum;
      const value = annualSpend * weight;
      return { name, pct: weight, value }; // value = dollars for the pie
    });

    // sort biggest first for a nice legend order
    norm.sort((a, b) => b.value - a.value);
    return norm;
  }, [breakdown, annualSpend]);

  const COLORS = PALETTE?.categorical || [
    "#2563eb","#16a34a","#f59e0b","#ef4444","#8b5cf6","#0ea5e9","#10b981","#f97316"
  ];

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            innerRadius={60}
            outerRadius={100}
            paddingAngle={2}
            labelLine={false}
            label={({ name, value, percent }) =>
              `${name}: ${fmt(value)} (${Math.round(percent * 100)}%)`
            }
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>

          <Tooltip
            formatter={(value, _n, { payload }) => [fmt(value), `${payload.name} — ${Math.round(payload.pct * 100)}%`]}
          />
          <Legend
            verticalAlign="bottom"
            align="center"
            formatter={(name, entry) => {
              const pct = entry?.payload?.pct ?? 0;
              return `${name} — ${Math.round(pct * 100)}%`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}