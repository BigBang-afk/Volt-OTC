import { state, persistSoon } from "./store.js";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function openTrade({ symbol, direction, amount, expirySeconds }) {
  const pair = state.pairs[symbol];
  if (!pair) throw new Error("Unknown pair: " + symbol);
  if (!["up", "down"].includes(direction)) throw new Error("direction must be 'up' or 'down'");
  amount = Number(amount);
  if (!amount || amount <= 0) throw new Error("Invalid amount");
  if (amount > state.account.demoBalance) throw new Error("Insufficient demo balance");
  expirySeconds = Number(expirySeconds);
  if (!expirySeconds || expirySeconds < 5) throw new Error("expirySeconds must be >= 5");

  const now = Date.now();
  const trade = {
    id: genId(),
    symbol,
    direction,
    amount,
    entryPrice: pair.price,
    entryTime: now,
    expiryTime: now + expirySeconds * 1000,
    expirySeconds,
    payout: pair.payout,
    status: "open",
    exitPrice: null,
    result: null
  };

  state.account.demoBalance -= amount;
  state.trades.push(trade);
  persistSoon();
  return trade;
}

export function resolveDueTrades() {
  const now = Date.now();
  const resolved = [];
  for (const trade of state.trades) {
    if (trade.status !== "open") continue;
    if (now < trade.expiryTime) continue;

    const pair = state.pairs[trade.symbol];
    const exitPrice = pair ? pair.price : trade.entryPrice;
    trade.exitPrice = exitPrice;

    let win = null;
    if (exitPrice === trade.entryPrice) {
      win = null; // tie -> refund
    } else {
      const wentUp = exitPrice > trade.entryPrice;
      win = trade.direction === "up" ? wentUp : !wentUp;
    }

    if (win === null) {
      state.account.demoBalance += trade.amount; // refund stake
      trade.result = "tie";
    } else if (win) {
      const profit = trade.amount * (trade.payout / 100);
      state.account.demoBalance += trade.amount + profit;
      trade.result = "win";
    } else {
      trade.result = "loss";
    }

    trade.status = "closed";
    resolved.push(trade);
  }
  if (resolved.length) persistSoon();
  return resolved;
}

export function resetDemoAccount(newBalance = 10000) {
  state.account.demoBalance = newBalance;
  persistSoon();
}

export function listTrades(limit = 100) {
  return state.trades.slice(-limit).reverse();
}
