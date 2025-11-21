import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Area,
} from "recharts";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

const LEGEND_HEIGHT = 26;
const LEGEND_GAP = 4;

function LegendRow() {
  const items = [
    { key: "k401", label: "401k", color: PALETTE.k401 },
    { key: "cds", label: "CDs", color: PALETTE.cds },
    { key: "roth", label: "Roth", color: PALETTE.roth },
    { key: "taxable", label: "Taxable", color: PALETTE.brokerage },
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

export default function WithdrawalMixChart({ rows = [], height = 320 }) {
  const data = useMemo(() => {
    return (rows || []).map((r) => {
      const taxable = Math.max(0, r.taxable || 0);
      const cds = Math.max(0, r.cds || 0);
      const deferred = Math.max(0, r.deferredNet || 0);
      const roth = Math.max(0, r.taxFree || 0);
      const total = taxable + cds + deferred + roth;
      if (!total) {
        return {
          year: r.year,
          taxablePct: 0,
          cdsPct: 0,
          deferredPct: 0,
          rothPct: 0,
        };
      }
      return {
        year: r.year,
        taxablePct: taxable / total,
        cdsPct: cds / total,
        deferredPct: deferred / total,
        rothPct: roth / total,
      };
    });
  }, [rows]);

  if (!data.length) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#6b7280" }}>
        Withdrawal mix is available once a plan is simulated.
      </div>
    );
  }

  const chartHeight = Math.max(
    140,
    Number(height) - LEGEND_HEIGHT - LEGEND_GAP
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer>
          <ComposedChart
            data={data}
            margin={{ top: 12, right: 18, bottom: 36, left: 60 }}
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
              width={60}
              domain={[0, 1]}
              tickFormatter={(v) => `${Math.round(v * 100)}%`}
              style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
            />
            <Tooltip
              formatter={(v, name) => [`${Math.round((v || 0) * 100)}%`, name]}
              labelFormatter={(label) => `Year ${label}`}
            />

            <Area
              type="monotone"
              dataKey="taxablePct"
              name="Taxable"
              stackId="mix"
              stroke={PALETTE.brokerage}
              fill={PALETTE.brokerage}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="cdsPct"
              name="CDs"
              stackId="mix"
              stroke={PALETTE.cds}
              fill={PALETTE.cds}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="deferredPct"
              name="401k"
              stackId="mix"
              stroke={PALETTE.k401}
              fill={PALETTE.k401}
              fillOpacity={0.7}
            />
            <Area
              type="monotone"
              dataKey="rothPct"
              name="Roth"
              stackId="mix"
              stroke={PALETTE.roth}
              fill={PALETTE.roth}
              fillOpacity={0.7}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <LegendRow />
    </div>
  );
}
