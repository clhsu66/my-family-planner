import React, { useMemo } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import { currencyShort } from "../utils/formatters";

// ---- local helpers / constants (standalone) ----
const fmt = currencyShort || ((n) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 })
);

// more bottom space so the legend never touches the ticks
const CHART_MARGIN_LARGE = { top: 10, right: 20, left: 64, bottom: 10 };

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
  const legendFormatter = (value) => value;

  return (
 
     
        <div
      style={{
        width: "100%",
        height,
     paddingBottom: 18,    // breathing room between legend and card bottom
      }}
      >
      <ResponsiveContainer>
        <ComposedChart data={data} margin={CHART_MARGIN_LARGE}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
                      dataKey="year"
          angle={-45}
            textAnchor="end"
            height={46}    // a bit shorter so labels sit closer to the axis
            dy={12}        // pull labels up toward the axis
            interval={0}
            tickMargin={8}
          />
          
          
          <YAxis tickFormatter={(v) => fmt(v)} />

          <Tooltip formatter={tooltipFormatter} />
          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{ bottom: -28 }}   // push the legend further below the chart
            formatter={legendFormatter}
            iconSize={10}
          />

          {/* Stacked income/withdrawals up to spending */}
          <Bar dataKey="wages"       stackId="src" name="Wages"                 fill="#1f77b4" />
          <Bar dataKey="ss"          stackId="src" name="Social Security"       fill="#2ca02c" />
          <Bar dataKey="annuities"   stackId="src" name="Annuities"             fill="#ff7f0e" />
          <Bar dataKey="realEstate"  stackId="src" name="Real Estate CF"        fill="#9467bd" />
          <Bar dataKey="withdrawals" stackId="src" name="Portfolio Withdrawals" fill="#8c564b" />

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
            stroke="#dc2626"
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}