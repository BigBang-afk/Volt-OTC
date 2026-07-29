import React, { useEffect, useState } from "react";

function useNow(intervalMs = 1000) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);
  return now;
}

export default function TradeHistory({ trades }) {
  const now = useNow();

  return (
    <div className="history-panel">
      <div className="sidebar-title">Trades</div>
      {trades.length === 0 && (
        <div style={{ padding: "12px 16px", color: "var(--muted)", fontSize: 13 }}>
          No trades yet. Place your first demo trade.
        </div>
      )}
      {trades.map((t) => {
        const statusClass = t.status === "open" ? "open" : t.result || "";
        const secsLeft = Math.max(0, Math.ceil((t.expiryTime - now) / 1000));
        return (
          <div key={t.id} className={"trade-item " + statusClass}>
            <div className="row1">
              <span>{t.symbol}</span>
              <span className="result">
                {t.status === "open" ? `${secsLeft}s` : t.result?.toUpperCase()}
              </span>
            </div>
            <div className="row2">
              <span>{t.direction === "up" ? "▲" : "▼"} ${t.amount}</span>
              <span>{t.entryPrice?.toFixed ? t.entryPrice.toFixed(5) : t.entryPrice}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
