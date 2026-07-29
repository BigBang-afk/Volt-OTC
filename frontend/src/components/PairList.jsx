import React from "react";

function formatPrice(p) {
  if (p === undefined || p === null) return "—";
  return p >= 100 ? p.toFixed(2) : p.toFixed(5);
}

export default function PairList({ pairs, selected, onSelect, prices }) {
  return (
    <div className="sidebar">
      <div className="sidebar-title">OTC Pairs</div>
      {pairs.map((p) => {
        const live = prices[p.symbol];
        return (
          <div
            key={p.symbol}
            className={"pair-row" + (selected === p.symbol ? " active" : "")}
            onClick={() => onSelect(p.symbol)}
          >
            <div className="sym">{p.symbol}</div>
            <div className="meta">
              <span>{formatPrice(live?.price ?? p.price)}</span>
              <span className="payout">{p.payout}%</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
