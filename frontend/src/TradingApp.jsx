import React, { useEffect, useRef, useState } from "react";
import { api, connectSocket } from "./api.js";
import Chart from "./components/Chart.jsx";
import PairList from "./components/PairList.jsx";
import Timeframes from "./components/Timeframes.jsx";
import TradePanel from "./components/TradePanel.jsx";
import TradeHistory from "./components/TradeHistory.jsx";
import AdminPanel from "./components/AdminPanel.jsx";

export default function TradingApp() {
  const [pairs, setPairs] = useState([]);
  const [symbol, setSymbol] = useState(null);
  const [timeframe, setTimeframe] = useState("m1");
  const [liveCandle, setLiveCandle] = useState(null);
  const [prices, setPrices] = useState({}); // symbol -> {price}
  const [account, setAccount] = useState({ demoBalance: 0 });
  const [trades, setTrades] = useState([]);
  const [showAdmin, setShowAdmin] = useState(false);

  const wsRef = useRef(null);

  // Initial load
  useEffect(() => {
    api.getPairs().then((list) => {
      setPairs(list);
      if (list.length) setSymbol(list[0].symbol);
    });
    api.getAccount().then(setAccount);
    api.getTrades().then(setTrades);
  }, []);

  // WebSocket live feed
  useEffect(() => {
    const ws = connectSocket((event) => {
      if (event.type === "tick") {
        setPrices((prev) => ({ ...prev, [event.symbol]: { price: event.price } }));
      }
      if (event.type === "trade_resolved") {
        setTrades((prev) => prev.map((t) => (t.id === event.trade.id ? event.trade : t)));
        api.getAccount().then(setAccount);
      }
    });
    wsRef.current = ws;
    return () => ws.close();
  }, []);

  // Update live candle for the chart whenever a tick arrives for the currently selected symbol/timeframe
  useEffect(() => {
    if (!wsRef.current) return;
    const ws = wsRef.current;
    const handler = (evt) => {
      const event = JSON.parse(evt.data);
      if (event.type === "tick" && event.symbol === symbol) {
        const upd = event.candles?.[timeframe];
        if (upd) setLiveCandle(upd.candle);
      }
    };
    ws.addEventListener("message", handler);
    return () => ws.removeEventListener("message", handler);
  }, [symbol, timeframe]);

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
                <Chart symbol={symbol} timeframe={timeframe} liveCandle={liveCandle} />
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
