import React, { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { currencyShort } from "../utils/formatters";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

// ---- local helpers / constants (standalone) ----
const fmt = currencyShort || ((n) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
);

const LEGEND_HEIGHT = 26;
const LEGEND_GAP = 4;

function LegendRow() {
  const items = [
    { key: "annuities", label: "Annuities", color: PALETTE.ann },
    { key: "withdrawals", label: "Portfolio Withdrawals", color: PALETTE.withdrawals },
    { key: "reCF", label: "Real Estate CF", color: PALETTE.reCF },
    { key: "shortfall", label: "Shortfall", color: "rgba(220,38,38,0.75)" },
    { key: "ss", label: "Social Security", color: PALETTE.ss },
    { key: "spending", label: "Total Spending", color: PALETTE.spending, isLine: true },
    { key: "wages", label: "Wages", color: PALETTE.wages },
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
              width: it.isLine ? 18 : 12,
              height: it.isLine ? 2 : 12,
              background: it.color,
              borderRadius: it.isLine ? 0 : 2,
              display: "inline-block",
            }}
          />
          <span>{it.label}</span>
        </span>
      ))}
    </div>
  );
}

export default function CashFlowChart({
  det = [],
  // kept for signature parity, not used directly here
  ssTaxablePercent = 0.5,
  height = 380,
}) {
  // Build stacked sources up to spending; cap withdrawals to what's needed.
  const data = useMemo(() => {
    return (det || []).map((r) => {
      const wages =
        (r.wageSelf || 0) +
        (r.wageSpouse || 0);

      const ss = r.ssIncome || 0;
      const annuities = r.annuityIncome || 0;
      const realEstate = r.realEstateCF || 0;
      const totalSpending = r.totalSpending || 0;
      const portfolioWds = r.wdTotal || 0;

      const income = wages + ss + annuities + realEstate;

      // cap withdrawals so stacked bars never exceed spending
      const withdrawals = Math.max(
        0,
        Math.min(portfolioWds, Math.max(0, totalSpending - income))
      );

      const covered = income + withdrawals;
      const shortfall = Math.max(0, totalSpending - covered);

      return {
        year: r.year,
        wages,
        ss,
        annuities,
        realEstate,
        withdrawals,
        shortfall,         // red translucent segment on top if unmet spend remains
        spending: totalSpending, // reference red line
      };
    });
  }, [det]);

  const tooltipFormatter = (value, name) => [fmt(value), name];

  // Room for angled ticks; legend is outside
  const CHART_MARGIN = { top: 10, right: 20, left: 64, bottom: 36 };
  const chartHeight = Math.max(
    140,
    Number(height) - LEGEND_HEIGHT - LEGEND_GAP
  );

  return (
    <div style={{ width: "100%", display: "flex", flexDirection: "column" }}>
      <div style={{ width: "100%", height: chartHeight }}>
        <ResponsiveContainer>
        <ComposedChart data={data} margin={CHART_MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="year"
            angle={-45}
            textAnchor="end"
            height={46} // a bit shorter so labels sit closer to the axis
            dy={12} // pull labels up toward the axis
            interval={0}
            tickMargin={8}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          
          
          <YAxis
            tickFormatter={(v) => fmt(v)}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />

          <Tooltip formatter={tooltipFormatter} />
          {/* Stacked income/withdrawals up to spending */}
          <Bar
            dataKey="wages"
            stackId="src"
            name="Wages"
            fill={PALETTE.wages}
          />
          <Bar
            dataKey="ss"
            stackId="src"
            name="Social Security"
            fill={PALETTE.ss}
          />
          <Bar
            dataKey="annuities"
            stackId="src"
            name="Annuities"
            fill={PALETTE.ann}
          />
          <Bar
            dataKey="realEstate"
            stackId="src"
            name="Real Estate CF"
            fill={PALETTE.reCF}
          />
          <Bar
            dataKey="withdrawals"
            stackId="src"
            name="Portfolio Withdrawals"
            fill={PALETTE.withdrawals}
          />

          {/* Shortfall segment (only appears if spending not fully covered) */}
          <Bar
            dataKey="shortfall"
            name="Shortfall"
            stackId="src"
            fill="rgba(220,38,38,0.45)"
            stroke="#dc2626"
          />

          {/* Spending reference line */}
          <Line
            type="monotone"
            dataKey="spending"
            name="Total Spending"
            stroke={PALETTE.spending}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
      </div>

      <LegendRow />
    </div>
  );
}
