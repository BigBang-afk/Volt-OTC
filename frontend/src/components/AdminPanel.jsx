import React, { useEffect, useState } from "react";
import { api } from "../api.js";

function NumField({ label, value, onChange, step = "any" }) {
  return (
    <div className="slider-row">
      <span>{label}</span>
      <input
        type="number"
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <span className="val">{value}</span>
    </div>
  );
}

export default function AdminPanel({ onClose }) {
  const [key, setKey] = useState(localStorage.getItem("adminKey") || "");
  const [authed, setAuthed] = useState(false);
  const [pairs, setPairs] = useState([]);
  const [error, setError] = useState(null);
  const [newPair, setNewPair] = useState({ symbol: "", basePrice: "", payout: 85 });

  async function tryLoad(k) {
    setError(null);
    try {
      const list = await api.adminGetPairs(k);
      setPairs(list);
      setAuthed(true);
      localStorage.setItem("adminKey", k);
    } catch (e) {
      setAuthed(false);
      setError(e.message);
    }
  }

  useEffect(() => {
    if (key) tryLoad(key);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function updateAlgo(symbol, field, value) {
    setPairs((prev) =>
      prev.map((p) => (p.symbol === symbol ? { ...p, algorithm: { ...p.algorithm, [field]: value } } : p))
    );
    try {
      await api.adminUpdateAlgorithm(key, symbol, { [field]: value });
    } catch (e) {
      setError(e.message);
    }
  }

  async function updatePayout(symbol, value) {
    setPairs((prev) => prev.map((p) => (p.symbol === symbol ? { ...p, payout: value } : p)));
    try {
      await api.adminUpdatePayout(key, symbol, value);
    } catch (e) {
      setError(e.message);
    }
  }

  async function deletePair(symbol) {
    try {
      await api.adminDeletePair(key, symbol);
      setPairs((prev) => prev.filter((p) => p.symbol !== symbol));
    } catch (e) {
      setError(e.message);
    }
  }

  async function addPair() {
    setError(null);
    try {
      const created = await api.adminAddPair(key, {
        symbol: newPair.symbol,
        basePrice: Number(newPair.basePrice),
        payout: Number(newPair.payout)
      });
      setPairs((prev) => [...prev, created]);
      setNewPair({ symbol: "", basePrice: "", payout: 85 });
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="admin-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="admin-modal">
        <button className="close-btn" onClick={onClose}>Close</button>
        <h2>Admin — OTC Algorithm Control</h2>

        <div className="admin-key-row">
          <input
            type="password"
            placeholder="Admin key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
          />
          <button className="admin-btn" onClick={() => tryLoad(key)}>Unlock</button>
        </div>

        {error && <div className="error-banner">{error}</div>}

        {authed && (
          <>
            {pairs.map((p) => (
              <div className="admin-pair-card" key={p.symbol}>
                <h3>
                  <span>{p.symbol}</span>
                  <button className="close-btn" onClick={() => deletePair(p.symbol)}>Remove</button>
                </h3>
                <NumField
                  label="Volatility"
                  value={p.algorithm.volatility}
                  onChange={(v) => updateAlgo(p.symbol, "volatility", v)}
                />
                <NumField
                  label="Trend bias"
                  value={p.algorithm.trendBias}
                  onChange={(v) => updateAlgo(p.symbol, "trendBias", v)}
                />
                <NumField
                  label="Mean reversion"
                  value={p.algorithm.meanReversion}
                  onChange={(v) => updateAlgo(p.symbol, "meanReversion", v)}
                  step="0.01"
                />
                <NumField
                  label="Spread"
                  value={p.algorithm.spread}
                  onChange={(v) => updateAlgo(p.symbol, "spread", v)}
                />
                <NumField
                  label="Payout %"
                  value={p.payout}
                  onChange={(v) => updatePayout(p.symbol, v)}
                />
              </div>
            ))}

            <div className="admin-add-form">
              <input
                placeholder="Symbol e.g. AUD/USD OTC"
                value={newPair.symbol}
                onChange={(e) => setNewPair({ ...newPair, symbol: e.target.value })}
              />
              <input
                placeholder="Base price"
                type="number"
                value={newPair.basePrice}
                onChange={(e) => setNewPair({ ...newPair, basePrice: e.target.value })}
              />
              <input
                placeholder="Payout %"
                type="number"
                value={newPair.payout}
                onChange={(e) => setNewPair({ ...newPair, payout: e.target.value })}
              />
              <button onClick={addPair}>Add Pair</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
