import React, { useEffect, useState } from "react";
import { api } from "./api.js";
import Chart from "./components/Chart.jsx";
import PairList from "./components/PairList.jsx";
import Timeframes from "./components/Timeframes.jsx";
import TradePanel from "./components/TradePanel.jsx";
import TradeHistory from "./components/TradeHistory.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

const PRICE_POLL_MS = 1500;
const TRADES_POLL_MS = 2000;

export default function TradingApp() {
  const [pairs, setPairs] = useState([]);
  const [symbol, setSymbol] = useState(null);
  const [timeframe, setTimeframe] = useState("m1");
  const [prices, setPrices] = useState({}); // symbol -> {price}
  const [account, setAccount] = useState({ demoBalance: 0 });
  const [trades, setTrades] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  // Initial load
  useEffect(() => {
    api.getPairs().then((list) => {
      setPairs(list);
      if (list.length) setSymbol(list[0].symbol);
    });
    api.getAccount().then(setAccount);
    api.getTrades().then(setTrades);
  }, []);

  // Poll live prices for the sidebar + ticker (also lets pairs list pick up admin changes)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const list = await api.getPairs();
        setPairs(list);
        const map = {};
        for (const p of list) map[p.symbol] = { price: p.price };
        setPrices(map);
      } catch (e) {
        console.error("price poll failed", e);
      }
    }, PRICE_POLL_MS);
    return () => clearInterval(id);
  }, []);

  // Poll trades + account (server resolves due trades lazily whenever these are fetched)
  useEffect(() => {
    const id = setInterval(async () => {
      try {
        const [list, acc] = await Promise.all([api.getTrades(), api.getAccount()]);
        setTrades(list);
        setAccount(acc);
      } catch (e) {
        console.error("trades poll failed", e);
      }
    }, TRADES_POLL_MS);
    return () => clearInterval(id);
  }, []);

  function handleTradePlaced(trade) {
    setTrades((prev) => [trade, ...prev]);
    api.getAccount().then(setAccount);
  }

  async function handleReset() {
    const acc = await api.resetAccount(10000);
    setAccount(acc);
  }

  const currentPair = pairs.find((p) => p.symbol === symbol);
  const currentPrice = prices[symbol]?.price ?? currentPair?.price;

  return (
    <div className="app">
      <div className="topbar">
        <div className="brand">
          <span className="dot" />
          Volt OTC <span style={{ color: "var(--muted)", fontWeight: 500, fontSize: 13 }}>demo</span>
        </div>
        <div className="topbar-right">
          <div className="balance-pill">
            <span>Demo balance</span>${account.demoBalance?.toFixed(2)}
          </div>
          <button className="reset-btn" onClick={handleReset}>Reset</button>
          <button className="admin-btn" onClick={() => setShowAdmin(true)}>⚙ Admin</button>
        </div>
      </div>

      <div className="main">
        <PairList pairs={pairs} selected={symbol} onSelect={setSymbol} prices={prices} />

        <div className="center">
          <Timeframes selected={timeframe} onSelect={setTimeframe} />
          <div className="chart-wrap">
            {symbol && (
              <>
                <div className="chart-header">
                  <div className="symbol">{symbol}</div>
                  <div className="price" style={{ color: "var(--text)" }}>
                    {currentPrice?.toFixed ? currentPrice.toFixed(currentPrice >= 100 ? 2 : 5) : "—"}
                  </div>
                </div>
                <Chart symbol={symbol} timeframe={timeframe} />
              </>
            )}
          </div>
          {currentPair && (
            <TradePanel
              symbol={symbol}
              payout={currentPair.payout}
              balance={account.demoBalance}
              onTradePlaced={handleTradePlaced}
            />
          )}
        </div>

        <TradeHistory trades={trades} />
      </div>

      {showAdmin && <AdminPanel onClose={() => setShowAdmin(false)} />}
    </div>
  );
}
