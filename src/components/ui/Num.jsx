import React from "react";

export default function Num({ value, onChange, step = 1, placeholder, min, max }) {
  return (
    <input
      type="number"
      step={step}
      value={value}
      placeholder={placeholder}
      min={min}
      max={max}
      onChange={(e) => onChange(e.target.value)}
      style={{
        width: "100%",
        padding: "8px 10px",
        fontSize: 14,
        borderRadius: 8,
        border: "1px solid #d1d5db",
      }}
    />
  );
}