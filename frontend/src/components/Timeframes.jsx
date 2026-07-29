import React from "react";

// Display order, largest to smallest, with friendly labels
export const TF_ORDER = [
  { key: "h4", label: "H4" },
  { key: "h1", label: "H1" },
  { key: "m30", label: "M30" },
  { key: "m15", label: "M15" },
  { key: "m5", label: "M5" },
  { key: "m1", label: "M1" },
  { key: "sec30", label: "S30" },
  { key: "sec15", label: "S15" },
  { key: "sec10", label: "S10" },
  { key: "sec5", label: "S5" }
];

export default function Timeframes({ selected, onSelect }) {
  return (
    <div className="timeframes">
      {TF_ORDER.map((tf) => (
        <button
          key={tf.key}
          className={"tf-btn" + (selected === tf.key ? " active" : "")}
          onClick={() => onSelect(tf.key)}
        >
          {tf.label}
        </button>
      ))}
    </div>
  );
}
