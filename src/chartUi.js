export const CHART_MARGIN = { top: 12, right: 18, left: 60, bottom: 92 };
export const CHART_MARGIN_LARGE = { top: 12, right: 18, left: 60, bottom: 120 };

// Unified chart text styling
export const CHART_TEXT_COLOR = "#374151"; // slate-700
export const CHART_TEXT_SIZE = 12;

export const X_TICK_PROPS = {
  angle: -45,
  textAnchor: "end",
  height: 40,
  dy: 20,
  interval: 0,
  tickMargin: 12,
};

export const LEGEND_PROPS = {
  verticalAlign: "bottom",
  align: "center",
  wrapperStyle: {
    paddingTop: 18,
    marginTop: 6,
    fontSize: CHART_TEXT_SIZE,
    color: CHART_TEXT_COLOR,
  },
};
