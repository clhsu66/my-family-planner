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
  Cell,
} from "recharts";

function LegendPill({ color, label }) {
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <span style={{ width: 14, height: 14, background: color, borderRadius: 3 }} />
      <span style={{ fontSize: 14, color: "#374151" }}>{label}</span>
    </span>
  );
}

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

  // rows
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

  // colors
  const colorByKind = {
    income:     "#10b981", // emerald
    withdrawal: "#3b82f6", // blue
    shortfall:  "#ef4444", // red
  };

  // layout: leave a bit more bottom margin for our labels (not a legend)
  const chartHeight = Math.max(140, height - 40);

  return (
    <div style={{ width: "100%", height }}>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={rows}
            layout="vertical"
            margin={{ left: 72, right: 20, top: 10, bottom: 10 }}
          >
            <XAxis type="number" hide />
            <YAxis type="category" dataKey="name" width={120} />
            <Tooltip formatter={(v) => currencyFormatter(v)} />
            {/* No <Legend /> here on purpose */}
            <Bar dataKey="value">
              {rows.map((r, i) => (
                <Cell key={i} fill={colorByKind[r.kind] || "#3b82f6"} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(v) => currencyFormatter(v)}
                style={{ fill: "#0ea5e9", fontWeight: 600 }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Custom legend (always correct) */}
      <div
        style={{
          marginTop: 8,
          display: "flex",
          justifyContent: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <LegendPill color={colorByKind.income} label="Income" />
        <LegendPill color={colorByKind.withdrawal} label="Withdrawals" />
        <LegendPill color={colorByKind.shortfall} label="Shortfall" />
      </div>
    </div>
  );
}