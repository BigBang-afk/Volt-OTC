import { kvGet, kvSet } from "./kv.js";
import { getPair } from "./pairsStore.js";
import { priceAtTime } from "./priceModel.js";

const KEY_ACCOUNT = "account:demo";
const KEY_TRADES = "trades:list";

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export async function getAccount() {
  const acc = await kvGet(KEY_ACCOUNT);
  return acc || { demoBalance: 10000, currency: "USD" };
}

export async function resetAccount(balance = 10000) {
  const acc = { demoBalance: balance, currency: "USD" };
  await kvSet(KEY_ACCOUNT, acc);
  return acc;
}

/**
 * Resolve any trades whose expiry has passed. Called at the top of every
 * trades/account request instead of relying on a background timer — since
 * priceAtTime() is a pure function of time, a trade opened a while ago can be
 * resolved correctly no matter when this happens to run.
 */
export async function resolveDueTrades() {
  const [trades, account] = await Promise.all([kvGet(KEY_TRADES), getAccount()]);
  const list = trades || [];
  const now = Date.now();
  let balance = account.demoBalance;
  let changed = false;

  for (const trade of list) {
    if (trade.status !== "open") continue;
    if (now < trade.expiryTime) continue;

    const pair = await getPair(trade.symbol);
    const exitPrice = pair ? priceAtTime(pair, trade.expiryTime) : trade.entryPrice;
    trade.exitPrice = exitPrice;

    let win = null;
    if (exitPrice === trade.entryPrice) {
      win = null;
    } else {
      const wentUp = exitPrice > trade.entryPrice;
      win = trade.direction === "up" ? wentUp : !wentUp;
    }

    if (win === null) {
      balance += trade.amount;
      trade.result = "tie";
    } else if (win) {
      balance += trade.amount + trade.amount * (trade.payout / 100);
      trade.result = "win";
    } else {
      trade.result = "loss";
    }
    trade.status = "closed";
    changed = true;
  }

  if (changed) {
    await Promise.all([kvSet(KEY_TRADES, list), kvSet(KEY_ACCOUNT, { ...account, demoBalance: balance })]);
  }
  return list;
}

export async function listTrades(limit = 100) {
  const list = await resolveDueTrades();
  return list.slice(-limit).reverse();
}

export async function openTrade({ symbol, direction, amount, expirySeconds }) {
  const pair = await getPair(symbol);
  if (!pair) throw new Error("Unknown pair: " + symbol);
  if (!["up", "down"].includes(direction)) throw new Error("direction must be 'up' or 'down'");
  amount = Number(amount);
  if (!amount || amount <= 0) throw new Error("Invalid amount");
  expirySeconds = Number(expirySeconds);
  if (!expirySeconds || expirySeconds < 5) throw new Error("expirySeconds must be >= 5");

  await resolveDueTrades();
  const account = await getAccount();
  if (amount > account.demoBalance) throw new Error("Insufficient demo balance");

  const now = Date.now();
  const trade = {
    id: genId(),
    symbol,
    direction,
    amount,
    entryPrice: priceAtTime(pair, now),
    entryTime: now,
    expiryTime: now + expirySeconds * 1000,
    expirySeconds,
    payout: pair.payout,
    status: "open",
    exitPrice: null,
    result: null
  };

  const trades = (await kvGet(KEY_TRADES)) || [];
  trades.push(trade);
  await Promise.all([
    kvSet(KEY_TRADES, trades),
    kvSet(KEY_ACCOUNT, { ...account, demoBalance: account.demoBalance - amount })
  ]);
  return trade;
}
