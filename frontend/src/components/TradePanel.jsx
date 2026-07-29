import React, { useState } from "react";
import { api } from "../api.js";

const EXPIRY_OPTIONS = [
  { seconds: 5, label: "5s" },
  { seconds: 10, label: "10s" },
  { seconds: 15, label: "15s" },
  { seconds: 30, label: "30s" },
  { seconds: 60, label: "1m" },
  { seconds: 300, label: "5m" },
  { seconds: 900, label: "15m" }
];

export default function TradePanel({ symbol, payout, onTradePlaced, balance }) {
  const [amount, setAmount] = useState(10);
  const [expiry, setExpiry] = useState(60);
  const [error, setError] = useState(null);
  const [placing, setPlacing] = useState(false);

  async function place(direction) {
    setError(null);
    setPlacing(true);
    try {
      const trade = await api.placeTrade({
        symbol,
        direction,
        amount: Number(amount),
        expirySeconds: Number(expiry)
      });
      onTradePlaced(trade);
    } catch (e) {
      setError(e.message);
    } finally {
      setPlacing(false);
    }
  }

  const profit = ((Number(amount) || 0) * (payout / 100)).toFixed(2);
  const disabled = placing || !amount || amount <= 0 || amount > balance;

  return (
    <div className="trade-panel">
      {error && <div className="error-banner" style={{ width: "100%" }}>{error}</div>}
      <div className="field">
        <label>Amount (USD)</label>
        <input type="number" min="1" value={amount} onChange={(e) => setAmount(e.target.value)} />
      </div>
      <div className="field">
        <label>Expiry</label>
        <select value={expiry} onChange={(e) => setExpiry(e.target.value)}>
          {EXPIRY_OPTIONS.map((o) => (
            <option key={o.seconds} value={o.seconds}>{o.label}</option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>Payout</label>
        <div className="expected-payout">+${profit} ({payout}%)</div>
      </div>
      <div className="trade-buttons">
        <button className="btn-up" disabled={disabled} onClick={() => place("up")}>▲ UP</button>
        <button className="btn-down" disabled={disabled} onClick={() => place("down")}>▼ DOWN</button>
      </div>
    </div>
  );
}
