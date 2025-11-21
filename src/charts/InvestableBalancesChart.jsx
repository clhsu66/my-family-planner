// charts/InvestableBalancesChart.js
import React from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { currency } from "../utils/formatters";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

const LEGEND_HEIGHT = 26;
const LEGEND_GAP = 4;

function LegendRow() {
  const items = [
    { key: "k401", label: "401k", color: PALETTE.k401 },
    { key: "brokerage", label: "Brokerage", color: PALETTE.brokerage },
    { key: "cds", label: "CDs", color: PALETTE.cds },
    { key: "roth", label: "Roth", color: PALETTE.roth },
  ];

  return (
    <div
      style={{
        height: LEGEND_HEIGHT,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        gap: 16,
        flexWrap: "wrap",
        fontSize: CHART_TEXT_SIZE,
        color: CHART_TEXT_COLOR,
        marginTop: LEGEND_GAP,
      }}
    >
      {items.map((it) => (
        <span
          key={it.key}
          style={{ display: "inline-flex", alignItems: "center", gap: 6 }}
        >
          <span
            style={{
              width: 12,
              height: 12,
              borderRadius: 2,
              background: it.color,
              display: "inline-block",
            }}
          />
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

export default function InvestableBalancesChart({ data, height = 360 }) {
  const chartHeight = Math.max(
    140,
    Number(height) - LEGEND_HEIGHT - LEGEND_GAP
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart
            data={data}
            margin={{ top: 20, right: 20, left: 20, bottom: 36 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="year"
              angle={-45}
              textAnchor="end"
              interval={0}
              tick={{ fontSize: CHART_TEXT_SIZE }}
              height={46}
              dy={12}
              tickMargin={6}
              style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
            />
            <YAxis
              tickFormatter={currency}
              width={100}
              style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
            />
            <Tooltip formatter={(v) => currency(v)} />

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
      </div>

      <LegendRow />
    </div>
  );
}
