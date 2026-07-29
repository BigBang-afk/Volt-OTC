const BASE = "/api";

async function handle(res) {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  return res.json();
}

export const api = {
  getPairs: () => fetch(`${BASE}/pairs`).then(handle),
  getTimeframes: () => fetch(`${BASE}/pairs/timeframes`).then(handle),
  getCandles: (symbol, timeframe, limit = 300) =>
    fetch(`${BASE}/pairs/${encodeURIComponent(symbol)}/candles/${timeframe}?limit=${limit}`).then(handle),

  getAccount: () => fetch(`${BASE}/trades/account`).then(handle),
  resetAccount: (balance = 10000) =>
    fetch(`${BASE}/trades/account/reset`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ balance })
    }).then(handle),

  getTrades: (limit = 100) => fetch(`${BASE}/trades?limit=${limit}`).then(handle),
  placeTrade: (payload) =>
    fetch(`${BASE}/trades`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    }).then(handle),

  // --- Admin (requires x-admin-key header) ---
  adminGetPairs: (key) =>
    fetch(`${BASE}/admin/pairs`, { headers: { "x-admin-key": key } }).then(handle),
  adminAddPair: (key, payload) =>
    fetch(`${BASE}/admin/pairs`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(payload)
    }).then(handle),
  adminUpdateAlgorithm: (key, symbol, algorithm) =>
    fetch(`${BASE}/admin/pairs/${encodeURIComponent(symbol)}/algorithm`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(algorithm)
    }).then(handle),
  adminUpdatePayout: (key, symbol, payout) =>
    fetch(`${BASE}/admin/pairs/${encodeURIComponent(symbol)}/payout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ payout })
    }).then(handle),
  adminDeletePair: (key, symbol) =>
    fetch(`${BASE}/admin/pairs/${encodeURIComponent(symbol)}`, {
      method: "DELETE",
      headers: { "x-admin-key": key }
    }).then(handle)
};

export function connectSocket(onMessage) {
  const proto = location.protocol === "https:" ? "wss" : "ws";
  const ws = new WebSocket(`${proto}://${location.host}/ws`);
  ws.onmessage = (evt) => {
    try {
      onMessage(JSON.parse(evt.data));
    } catch (e) {
      console.error("bad ws message", e);
    }
  };
  return ws;
}
