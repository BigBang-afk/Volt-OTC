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
    fetch(`${BASE}/pairs/candles?symbol=${encodeURIComponent(symbol)}&timeframe=${timeframe}&limit=${limit}`).then(handle),

  getAccount: () => fetch(`${BASE}/account`).then(handle),
  resetAccount: (balance = 10000) =>
    fetch(`${BASE}/account/reset`, {
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
    fetch(`${BASE}/admin/pairs?symbol=${encodeURIComponent(symbol)}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify(algorithm)
    }).then(handle),
  adminUpdatePayout: (key, symbol, payout) =>
    fetch(`${BASE}/admin/pairs?symbol=${encodeURIComponent(symbol)}&field=payout`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", "x-admin-key": key },
      body: JSON.stringify({ payout })
    }).then(handle),
  adminDeletePair: (key, symbol) =>
    fetch(`${BASE}/admin/pairs?symbol=${encodeURIComponent(symbol)}`, {
      method: "DELETE",
      headers: { "x-admin-key": key }
    }).then(handle)
};
