import React from "react";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

const COLORS = {
  Income: "#3B82F6",                 // aggregated cash in
  Spending: PALETTE.spending,        // red
  Taxes: PALETTE.taxesTotal,         // tax pink
  Withdrawals: PALETTE.withdrawals,  // portfolio withdrawals
  Surplus: PALETTE.brokerage,        // goes to brokerage
};

export default function CashFlowBreakdownPie({ latest }) {
  if (!latest) return null;

  const income = (latest.ssIncome || 0) + (latest.wageSelf || 0) + (latest.wageSpouse || 0) + (latest.annuityIncome || 0) + (latest.realEstateCF || 0);
  const spend = (latest.retireSpend || 0) + (latest.hsTotal || 0) + (latest.collegeTotal || 0) + (latest.mortgagePayment || 0);
  const taxes = (latest.taxTotal || 0);
  const surplus = Math.max(0, (latest.surplusToBroker || 0));
  const withdraw = (latest.wdTotal || 0);

  const rows = [
    { name: "Income", value: income },
    { name: "Spending", value: spend },
    { name: "Taxes", value: taxes },
    { name: "Withdrawals", value: withdraw },
    { name: "Surplus", value: surplus },
  ].filter(r => r.value > 0);

  const total = rows.reduce((s, r) => s + r.value, 0);

  const renderLabel = ({ name, value }) => {
    const pct = ((value / total) * 100).toFixed(1);
    return `${name}: $${value.toLocaleString()} (${pct}%)`;
  };

  return (
    <ResponsiveContainer width="100%" height={360}>
      <PieChart>
        <Pie
          data={rows}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="45%"
          outerRadius={100}
          label={renderLabel}
        >
          {rows.map((entry, i) => (
            <Cell
              key={`slice-${i}`}
              fill={COLORS[entry.name] || PALETTE.categorical[i % PALETTE.categorical.length]}
            />
          ))}
        </Pie>
        <Tooltip
          formatter={(val, name) => {
            const pct = ((val / total) * 100).toFixed(1);
            return [`$${val.toLocaleString()} (${pct}%)`, name];
          }}
        />
        <Legend
          verticalAlign="bottom"
          height={40}
          wrapperStyle={{
            fontSize: CHART_TEXT_SIZE,
            color: CHART_TEXT_COLOR,
          }}
          formatter={(value) => {
            const row = rows.find((r) => r.name === value);
            if (!row) return value;
            const pct = ((row.value / total) * 100).toFixed(1);
            return (
              <span style={{ fontSize: CHART_TEXT_SIZE, color: CHART_TEXT_COLOR }}>
                {value} ({pct}%)
              </span>
            );
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  );
}
