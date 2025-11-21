import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";
import { CHART_TEXT_COLOR, CHART_TEXT_SIZE } from "../chartUi";
import { PALETTE } from "../utils/palette";

function fmtDollarShort(n) {
  if (n == null || isNaN(n)) return "$0";
  const abs = Math.abs(n);
  if (abs >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (abs >= 1_000_000) return `$${(n / 1_000_000).toFixed(0)}M`;
  if (abs >= 1_000) return `$${(n / 1_000).toFixed(0)}k`;
  return `$${Math.round(n)}`;
}

export default function TerminalNetWorthHistogram({
  values = [],
  binCount = 16,
  height = 260,
}) {
  const data = useMemo(() => {
    const clean = (values || []).map((v) => Number(v) || 0);
    if (!clean.length) return [];

    const min = 0;
    const max = Math.max(...clean);
    if (max <= 0) {
      return [{ bucket: "$0", pct: 100 }];
    }

    const bins = Math.max(4, Math.min(binCount, 40));
    const width = (max - min) / bins || 1;
    const counts = Array.from({ length: bins }, () => 0);

    for (const v of clean) {
      const idx =
        v <= min
          ? 0
          : v >= max
          ? bins - 1
          : Math.min(bins - 1, Math.floor((v - min) / width));
      counts[idx] += 1;
    }

    const total = clean.length || 1;
    return counts.map((c, i) => {
      const start = min + i * width;
      const end = start + width;
      const label = `${fmtDollarShort(start)}–${fmtDollarShort(end)}`;
      return {
        bucket: label,
        mid: start + width / 2,
        pct: (c / total) * 100,
      };
    });
  }, [values, binCount]);

  if (!data.length) {
    return (
      <div style={{ width: "100%", height, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, color: "#6b7280" }}>
        Monte Carlo must be run to show the distribution.
      </div>
    );
  }

  return (
    <div style={{ width: "100%", height }}>
      <ResponsiveContainer>
        <BarChart data={data} margin={{ top: 12, right: 18, bottom: 48, left: 60 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="bucket"
            interval={0}
            angle={-45}
            textAnchor="end"
            height={60}
            dy={8}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          <YAxis
            width={60}
            tickFormatter={(v) => `${Math.round(v)}%`}
            style={{ fontSize: CHART_TEXT_SIZE, fill: CHART_TEXT_COLOR }}
          />
          <Tooltip
            formatter={(v) => [`${v.toFixed(1)}% of runs`, "Frequency"]}
            labelFormatter={(lbl) => lbl}
          />
          <Bar
            dataKey="pct"
            name="% of runs"
            fill={PALETTE.netWorth}
            maxBarSize={28}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

