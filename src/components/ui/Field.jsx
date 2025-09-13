import React, { useId } from "react";

export default function Field({ label, hint, children }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;

  // Clone child to attach aria props when possible
  const child = React.isValidElement(children)
    ? React.cloneElement(children, {
        "aria-describedby": hintId,
      })
    : children;

  return (
    <label htmlFor={id} style={{ display: "block", marginBottom: 10 }}>
      <div style={{ fontSize: 12, color: "#374151", marginBottom: 4 }}>{label}</div>
      {child}
      {hint ? (
        <div id={hintId} style={{ fontSize: 11, color: "#6b7280", marginTop: 4, lineHeight: 1.35 }}>
          {hint}
        </div>
      ) : null}
    </label>
  );
}