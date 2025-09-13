import React from "react";

export default function Hint({ text }) {
  return (
    <div
      style={{
        fontSize: 12,
        color: "#6b7280",
        background: "#f9fafb",
        border: "1px solid #e5e7eb",
        borderRadius: 8,
        padding: "6px 8px",
        marginBottom: 8,
        lineHeight: 1.4,
      }}
    >
      {text}
    </div>
  );
}