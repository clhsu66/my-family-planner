import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  Bar,
  Line,
} from "recharts";

const fmt = (n) =>
  (n ?? 0).toLocaleString(undefined, { maximumFractionDigits: 0 });
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

/**
 * CashFlowChartDetailed (aligned with Option 2 logic)
 * Stacked bars cover spending using:
 *  wages + SS + annuities + RE CF + RMD (net) + Withdrawals (gap).
 * Spending shown as a red line.
 *
 * Props:
 *  - det: array of yearly rows from the simulator
 *  - height: number (px)
 */
export default function CashFlowChartDetailed({ det = [], height = 380 }) {
  const data = useMemo(() => {
    return (det || []).map((r) => {
      const year = r.year;

      const wages =
        Math.max(0, r.wageSelf || 0) + Math.max(0, r.wageSpouse || 0);
      const ss = Math.max(0, r.ssIncome || 0);
      const ann = Math.max(0, r.annuityIncome || 0);
      const reCF = Math.max(0, r.realEstateCF || 0);

      const rmdGross =
        Math.max(0, r.rmdSelfGross || 0) + Math.max(0, r.rmdSpouseGross || 0);
      const rmdTax =
        Math.max(0, r.rmdSelfTax || 0) + Math.max(0, r.rmdSpouseTax || 0);
      const rmdNet = Math.max(0, rmdGross - rmdTax);

      const spending = Math.max(0, r.totalSpending || 0);
      const incomeSum = wages + ss + ann + reCF + rmdNet;

      const withdrawalsNeeded = Math.max(0, spending - incomeSum);

      // Optional debug (not plotted):
      const wd401kNet =
        Math.max(0, (r.wd401kSelfGross || 0) - (r.wd401kSelfTax || 0)) +
        Math.max(0, (r.wd401kSpouseGross || 0) - (r.wd401kSpouseTax || 0));
      const wdNetActual =
        Math.max(0, r.wdBroker || 0) +
        Math.max(0, r.wdCDs || 0) +
        Math.max(0, r.wdRothSelf || 0) +
        Math.max(0, r.wdRothSpouse || 0) +
        Math.max(0, wd401kNet);

      return {
        year,
        wages,
        ss,
        ann,
        reCF,
        rmdNet,
        withdrawals: withdrawalsNeeded,
        spending,
        _incomeSum: incomeSum,
        _wdNetActual: wdNetActual,
      };
    });
  }, [det]);

  const COLORS = {
    wages: PALETTE.wages,
    ss: PALETTE.ss,
    ann: PALETTE.ann,
    reCF: PALETTE.reCF,
    rmdNet: PALETTE.rmdNet,
    withdrawals: PALETTE.withdrawals,
    spendingLine: PALETTE.spending,
  };

  // Slightly reduced bottom margin + legend offset so the stack appears vertically centered
  const MARGIN = { top: 12, right: 18, bottom: 18, left: 60 };

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <ComposedChart data={data} margin={MARGIN}>
          <CartesianGrid strokeDasharray="3 3" />

          <XAxis
            dataKey="year"
            tick={{ fontSize: CHART_TEXT_SIZE }}
            angle={-45}
            textAnchor="end"
            height={70}
            dy={14}
            interval={0}
            tickMargin={10}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />

          <YAxis
            tickFormatter={(v) => `$${fmt(v)}`}
            width={70}
            tick={{ fontSize: CHART_TEXT_SIZE }}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />

          <Tooltip
            formatter={(val, name) => [`$${fmt(val)}`, name]}
            labelFormatter={(label) => `Year ${label}`}
          />

          <Legend
            verticalAlign="bottom"
            align="center"
            wrapperStyle={{
              paddingTop: 4,
              marginTop: 0,
              fontSize: CHART_TEXT_SIZE,
              color: CHART_TEXT_COLOR,
            }}
          />

          <Bar
            name="Wages"
            dataKey="wages"
            stackId="cover"
            fill={COLORS.wages}
            maxBarSize={24}
          />
          <Bar
            name="Social Security"
            dataKey="ss"
            stackId="cover"
            fill={COLORS.ss}
            maxBarSize={24}
          />
          <Bar
            name="Annuities"
            dataKey="ann"
            stackId="cover"
            fill={COLORS.ann}
            maxBarSize={24}
          />
          <Bar
            name="Real Estate CF"
            dataKey="reCF"
            stackId="cover"
            fill={COLORS.reCF}
            maxBarSize={24}
          />
          <Bar
            name="RMD (net)"
            dataKey="rmdNet"
            stackId="cover"
            fill={COLORS.rmdNet}
            maxBarSize={24}
          />
          <Bar
            name="Withdrawals"
            dataKey="withdrawals"
            stackId="cover"
            fill={COLORS.withdrawals}
            maxBarSize={24}
          />

          <Line
            type="monotone"
            dataKey="spending"
            name="Total Spending"
            stroke={COLORS.spendingLine}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
