// src/components/scenarios/ScenarioControls.jsx
import React from "react";

export default function ScenarioControls({
  scenarios,
  onToggleEnable,
  onRename,
  onDelete,
  onAddFromCurrent,
}) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        <button
          onClick={onAddFromCurrent}
          style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #d1d5db", background: "#e0f2fe" }}
        >
          + Add scenario from current inputs
        </button>
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        {scenarios.map((s) => (
          <div
            key={s.id}
            style={{
              display: "grid",
              gridTemplateColumns: "auto 1fr auto auto",
              gap: 8,
              alignItems: "center",
              border: "1px solid #e5e7eb",
              borderRadius: 10,
              padding: 10,
              background: s.enabled ? "#fff" : "#f9fafb",
            }}
          >
            <div
              title={s.color}
              style={{
                width: 12,
                height: 12,
                borderRadius: 3,
                background: s.color,
              }}
            />
            <input
              value={s.name}
              onChange={(e) => onRename(s.id, e.target.value)}
              style={{ width: "100%", padding: "6px 8px", borderRadius: 8, border: "1px solid #d1d5db" }}
            />
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <input
                type="checkbox"
                checked={!!s.enabled}
                onChange={(e) => onToggleEnable(s.id, e.target.checked)}
              />
              Enabled
            </label>
            <button
              onClick={() => onDelete(s.id)}
              style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid #fecaca", background: "#fee2e2" }}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}