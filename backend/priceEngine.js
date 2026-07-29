import { state, persistSoon } from "./store.js";

// All supported timeframes, in seconds
export const TIMEFRAMES = {
  sec5: 5,
  sec10: 10,
  sec15: 15,
  sec30: 30,
  m1: 60,
  m5: 300,
  m15: 900,
  m30: 1800,
  h1: 3600,
  h4: 14400
};

const MAX_CANDLES_PER_TF = 500;
const BASE_TICK_MS = 1000; // engine heartbeat; each pair can override via algorithm.tickMs (must be multiple of this)

let listeners = []; // callback(event) for websocket broadcast

export function onTick(cb) {
  listeners.push(cb);
}

function emit(event) {
  for (const cb of listeners) {
    try {
      cb(event);
    } catch (e) {
      console.error("listener error", e);
    }
  }
}

function ensureCandleStore(symbol) {
  if (!state.candles[symbol]) {
    state.candles[symbol] = {};
    for (const tfName of Object.keys(TIMEFRAMES)) {
      state.candles[symbol][tfName] = [];
    }
  }
}

// Gaussian-ish random via Box-Muller
function randn() {
  let u = 0, v = 0;
  while (u === 0) u = Math.random();
  while (v === 0) v = Math.random();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

function nextPrice(pair) {
  const { volatility, trendBias, meanReversion } = pair.algorithm;
  const reversion = (pair.anchor - pair.price) * meanReversion;
  const change = randn() * volatility + trendBias + reversion;
  let p = pair.price + change;
  if (p <= 0) p = pair.price; // guard
  return p;
}

function updateCandle(symbol, tfName, tfSeconds, price, tsSeconds) {
  const bucketStart = Math.floor(tsSeconds / tfSeconds) * tfSeconds;
  const arr = state.candles[symbol][tfName];
  const last = arr[arr.length - 1];

  if (last && last.time === bucketStart) {
    last.high = Math.max(last.high, price);
    last.low = Math.min(last.low, price);
    last.close = price;
    return { candle: last, closed: false };
  }

  // finalize previous candle if it exists and start a new one
  const candle = { time: bucketStart, open: price, high: price, low: price, close: price };
  arr.push(candle);
  if (arr.length > MAX_CANDLES_PER_TF) arr.shift();
  return { candle, closed: true };
}

let tickCounter = 0;

function tick() {
  tickCounter += 1;
  const nowSeconds = Math.floor(Date.now() / 1000);

  for (const symbol of Object.keys(state.pairs)) {
    const pair = state.pairs[symbol];
    const tickMs = pair.algorithm.tickMs || BASE_TICK_MS;
    const everyN = Math.max(1, Math.round(tickMs / BASE_TICK_MS));
    if (tickCounter % everyN !== 0) continue;

    ensureCandleStore(symbol);
    pair.price = nextPrice(pair);

    const updates = {};
    for (const [tfName, tfSeconds] of Object.entries(TIMEFRAMES)) {
      updates[tfName] = updateCandle(symbol, tfName, tfSeconds, pair.price, nowSeconds);
    }

    emit({
      type: "tick",
      symbol,
      price: pair.price,
      spread: pair.algorithm.spread,
      time: nowSeconds,
      candles: updates
    });
  }

  persistSoon();
}

let engineHandle = null;
export function startEngine() {
  if (engineHandle) return;
  engineHandle = setInterval(tick, BASE_TICK_MS);
  console.log("Price engine started (tick every " + BASE_TICK_MS + "ms)");
}

export function getCandles(symbol, tfName, limit = 200) {
  ensureCandleStore(symbol);
  const arr = state.candles[symbol][tfName] || [];
  return arr.slice(-limit);
}

export function addPair(symbol, basePrice, payout, algorithm) {
  state.pairs[symbol] = {
    symbol,
    price: basePrice,
    anchor: basePrice,
    payout: payout ?? 85,
    algorithm: {
      volatility: algorithm?.volatility ?? basePrice * 0.00005,
      trendBias: algorithm?.trendBias ?? 0,
      meanReversion: algorithm?.meanReversion ?? 0.02,
      spread: algorithm?.spread ?? basePrice * 0.00003,
      tickMs: algorithm?.tickMs ?? BASE_TICK_MS
    }
  };
  ensureCandleStore(symbol);
  persistSoon();
  return state.pairs[symbol];
}

export function updateAlgorithm(symbol, partialAlgorithm) {
  const pair = state.pairs[symbol];
  if (!pair) return null;
  pair.algorithm = { ...pair.algorithm, ...partialAlgorithm };
  if (partialAlgorithm.anchor !== undefined) pair.anchor = partialAlgorithm.anchor;
  persistSoon();
  return pair;
}

export function removePair(symbol) {
  delete state.pairs[symbol];
  delete state.candles[symbol];
  persistSoon();
}
