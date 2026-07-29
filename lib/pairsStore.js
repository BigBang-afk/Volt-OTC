import { kvGet, kvSet } from "./kv.js";

export const DEFAULT_PAIRS = {
  "EUR/USD OTC": {
    symbol: "EUR/USD OTC",
    anchor: 1.0821,
    payout: 87,
    algorithm: { volatility: 0.00006, trendBias: 0, meanReversion: 0.02, spread: 0.00004 }
  },
  "GBP/USD OTC": {
    symbol: "GBP/USD OTC",
    anchor: 1.2694,
    payout: 85,
    algorithm: { volatility: 0.00008, trendBias: 0, meanReversion: 0.02, spread: 0.00005 }
  },
  "USD/JPY OTC": {
    symbol: "USD/JPY OTC",
    anchor: 155.42,
    payout: 90,
    algorithm: { volatility: 0.006, trendBias: 0, meanReversion: 0.02, spread: 0.004 }
  },
  "BTC/USD OTC": {
    symbol: "BTC/USD OTC",
    anchor: 64250,
    payout: 80,
    algorithm: { volatility: 12, trendBias: 0, meanReversion: 0.01, spread: 8 }
  }
};

const KEY_OVERRIDES = "pairs:overrides";
const KEY_CUSTOM = "pairs:custom";
const KEY_REMOVED = "pairs:removed";

export async function getAllPairs() {
  const [overrides, custom, removed] = await Promise.all([
    kvGet(KEY_OVERRIDES),
    kvGet(KEY_CUSTOM),
    kvGet(KEY_REMOVED)
  ]);
  const overridesMap = overrides || {};
  const customMap = custom || {};
  const removedSet = new Set(removed || []);

  const result = {};
  for (const [symbol, base] of Object.entries(DEFAULT_PAIRS)) {
    if (removedSet.has(symbol)) continue;
    const o = overridesMap[symbol] || {};
    result[symbol] = {
      ...base,
      ...o,
      algorithm: { ...base.algorithm, ...(o.algorithm || {}) }
    };
  }
  for (const [symbol, pair] of Object.entries(customMap)) {
    result[symbol] = pair;
  }
  return result;
}

export async function getPair(symbol) {
  const all = await getAllPairs();
  return all[symbol] || null;
}

export async function updatePairAlgorithm(symbol, partialAlgorithm) {
  const all = await getAllPairs();
  const pair = all[symbol];
  if (!pair) return null;

  const custom = (await kvGet(KEY_CUSTOM)) || {};
  if (custom[symbol]) {
    custom[symbol] = { ...custom[symbol], algorithm: { ...custom[symbol].algorithm, ...partialAlgorithm } };
    await kvSet(KEY_CUSTOM, custom);
    return custom[symbol];
  }

  const overrides = (await kvGet(KEY_OVERRIDES)) || {};
  const prevOverride = overrides[symbol] || {};
  overrides[symbol] = { ...prevOverride, algorithm: { ...(prevOverride.algorithm || {}), ...partialAlgorithm } };
  await kvSet(KEY_OVERRIDES, overrides);
  return { ...pair, algorithm: { ...pair.algorithm, ...partialAlgorithm } };
}

export async function updatePairPayout(symbol, payout) {
  const all = await getAllPairs();
  const pair = all[symbol];
  if (!pair) return null;

  const custom = (await kvGet(KEY_CUSTOM)) || {};
  if (custom[symbol]) {
    custom[symbol] = { ...custom[symbol], payout };
    await kvSet(KEY_CUSTOM, custom);
    return custom[symbol];
  }

  const overrides = (await kvGet(KEY_OVERRIDES)) || {};
  overrides[symbol] = { ...(overrides[symbol] || {}), payout };
  await kvSet(KEY_OVERRIDES, overrides);
  return { ...pair, payout };
}

export async function addPair(symbol, basePrice, payout, algorithm) {
  const custom = (await kvGet(KEY_CUSTOM)) || {};
  custom[symbol] = {
    symbol,
    anchor: basePrice,
    payout: payout ?? 85,
    algorithm: {
      volatility: algorithm?.volatility ?? basePrice * 0.00005,
      trendBias: algorithm?.trendBias ?? 0,
      meanReversion: algorithm?.meanReversion ?? 0.02,
      spread: algorithm?.spread ?? basePrice * 0.00003
    }
  };
  await kvSet(KEY_CUSTOM, custom);
  return custom[symbol];
}

export async function removePair(symbol) {
  if (DEFAULT_PAIRS[symbol]) {
    const removed = (await kvGet(KEY_REMOVED)) || [];
    if (!removed.includes(symbol)) removed.push(symbol);
    await kvSet(KEY_REMOVED, removed);
    return true;
  }
  const custom = (await kvGet(KEY_CUSTOM)) || {};
  if (custom[symbol]) {
    delete custom[symbol];
    await kvSet(KEY_CUSTOM, custom);
    return true;
  }
  return false;
}
