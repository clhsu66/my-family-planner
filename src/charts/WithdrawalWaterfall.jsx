// src/charts/WithdrawalWaterfall.jsx
import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  LabelList,
  Legend,
  Cell,
} from "recharts";

export default function WithdrawalWaterfall({ latest, height = 320, currencyFormatter }) {
  if (!latest) return null;

  // income sources
  const wages   = (latest.wageSelf || 0) + (latest.wageSpouse || 0);
  const ss      = latest.ssIncome || 0;
  const annuity = latest.annuityIncome || 0;
  const reCF    = latest.realEstateCF || 0;

  // withdrawals (gross for 401k to match spend coverage)
  const wdBroker = latest.wdBroker || 0;
  const wdCDs    = latest.wdCDs || 0;
  const wd401k   = (latest.wd401kSelfGross || 0) + (latest.wd401kSpouseGross || 0);
  const wdRoth   = (latest.wdRothSelf || 0) + (latest.wdRothSpouse || 0);

  // need
  const spend = latest.totalSpending || latest.retireSpend || 0;

  // Build rows with a "kind" tag for coloring
  const rows = [
    { name: "Wages",        value: wages,   kind: "income" },
    { name: "SS",           value: ss,      kind: "income" },
    { name: "Annuity",      value: annuity, kind: "income" },
    { name: "Real Estate",  value: reCF,    kind: "income" },
    { name: "Brokerage",    value: wdBroker, kind: "withdrawal" },
    { name: "CDs",          value: wdCDs,    kind: "withdrawal" },
    { name: "401k (gross)", value: wd401k,   kind: "withdrawal" },
    { name: "Roth",         value: wdRoth,   kind: "withdrawal" },
  ];

  const totalCovered = rows.reduce((s, r) => s + (r.value || 0), 0);
  const shortfall = Math.max(0, spend - totalCovered);
  if (shortfall > 0) rows.push({ name: "Shortfall", value: shortfall, kind: "shortfall" });

  // Color palette by kind
  const colorByKind = {
    income:     "#10b981", // emerald
    withdrawal: "#3b82f6", // blue
    shortfall:  "#ef4444", // red
  };

  const legendPayload = [
    { value: "Income", type: "square", color: colorByKind.income, id: "income" },
    { value: "Withdrawals", type: "square", color: colorByKind.withdrawal, id: "withdrawal" },
    { value: "Shortfall", type: "square", color: colorByKind.shortfall, id: "shortfall" },
  ];

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart
        data={rows}
        layout="vertical"
        margin={{ left: 60, right: 20, top: 10, bottom: 10 }}
      >
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={110} />
        <Tooltip formatter={(v) => currencyFormatter(v)} />
        <Legend payload={legendPayload} />
        <Bar dataKey="value">
          {rows.map((r, i) => (
            <Cell key={i} fill={colorByKind[r.kind] || "#3b82f6"} />
          ))}
          <LabelList
            dataKey="value"
            position="right"
            formatter={(v) => currencyFormatter(v)}
          />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}