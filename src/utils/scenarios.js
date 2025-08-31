// src/utils/scenarios.js
export const SCENARIO_COLORS = [
  "#2563eb", // blue
  "#16a34a", // green
  "#ef4444", // red
  "#a855f7", // purple
  "#f59e0b", // amber
  "#0ea5e9", // sky
];

export function makeScenarioFromState(name, baseState) {
  return {
    id: crypto.randomUUID?.() ?? String(Date.now() + Math.random()),
    name,
    color: SCENARIO_COLORS[Math.floor(Math.random() * SCENARIO_COLORS.length)],
    // Shallow clone is fine because you already rebuild arrays/objects via setState
    params: { ...baseState },
    enabled: true,
  };
}