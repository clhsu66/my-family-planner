// src/components/SuccessGauge.jsx
import React from "react";

export default function SuccessGauge({
  value = 0,              // number 0–100
  label = "Probability of Success",
  height = 12,            // px
  showScale = true,       // show 0% … 100% labels
}) {
  const pct = Math.max(0, Math.min(100, Number(value) || 0));

  return (
    <div>
      <h3 style={{ margin: "0 0 8px", fontWeight: 600 }}>{label}</h3>
      <div
        style={{
          background: "#e5e7eb",
          borderRadius: 10,
          height,
          overflow: "hidden",
        }}
      >
        <div
          style={{
            background: "#10b981",
            width: `${pct}%`,
            height: "100%",
            transition: "width 300ms ease",
          }}
        />
      </div>
      {showScale && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
            color: "#6b7280",
            marginTop: 4,
          }}
        >
          <span>0%</span>
          <span>{pct}%</span>
          <span>100%</span>
        </div>
      )}
    </div>
  );
}