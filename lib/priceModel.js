import { deterministicGaussian } from "./hash.js";

// All supported timeframes, in seconds.
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

const MAX_LIMIT = 500;

/**
 * Generate `limit` OHLC candles for a pair/timeframe ending at `nowSeconds`.
 * This is a pure function: calling it again with the same arguments (including
 * the same `nowSeconds`) always returns the same candles. No background
 * process or in-memory state is required — which is what makes this safe to
 * run inside short-lived serverless functions.
 *
 * Each timeframe is generated independently (not aggregated from a finer
 * timeframe) using the pair's algorithm params, scaled by sqrt(dt) per
 * standard Brownian-motion scaling. This is a deliberate simplification for
 * a demo/practice platform — see README for the trade-offs.
 */
export function generateCandles(pair, tfSeconds, limit, nowSeconds) {
  limit = Math.min(limit, MAX_LIMIT);
  const R = Math.floor(nowSeconds / tfSeconds);
  const startIndex = R - limit;

  const { volatility, trendBias, meanReversion } = pair.algorithm;
  const stepVol = volatility * Math.sqrt(tfSeconds);
  const stepTrend = trendBias * tfSeconds;

  // Seed a plausible starting price for this window so that any window
  // (however far in the future) starts from a reasonable, reproducible point
  // near the pair's anchor, rather than needing to replay from "the beginning."
  const startNoise = deterministicGaussian(`${pair.symbol}:${tfSeconds}:start:${startIndex}`);
  let price = pair.anchor + startNoise * stepVol * Math.sqrt(limit) * 0.5;

  const candles = [];
  for (let k = 1; k <= limit; k++) {
    const idx = startIndex + k;
    const open = price;
    const noise = deterministicGaussian(`${pair.symbol}:${tfSeconds}:${idx}`);
    const reversion = (pair.anchor - price) * meanReversion;
    const close = open + noise * stepVol + stepTrend + reversion;
    const wiggle = Math.abs(deterministicGaussian(`${pair.symbol}:${tfSeconds}:wiggle:${idx}`)) * stepVol * 0.6;
    const high = Math.max(open, close) + wiggle;
    const low = Math.min(open, close) - wiggle;
    candles.push({ time: idx * tfSeconds, open, high, low, close });
    price = close;
  }
  return candles;
}

/**
 * The current tradable price for a pair at an exact point in time (defaults to
 * now). Used for both the live ticker and for pricing trade entry/exit —
 * calling this with the same timestamp always gives the same answer, so a
 * trade's exit price can be recomputed exactly at resolution time even if
 * that check happens seconds or minutes later.
 */
export function priceAtTime(pair, timestampMs = Date.now()) {
  const nowSeconds = Math.floor(timestampMs / 1000);
  // A 1-second "tick" resolution, replaying only the last few minutes — cheap
  // and stable regardless of how long ago the pair was created.
  const candles = generateCandles(pair, 1, 180, nowSeconds);
  return candles[candles.length - 1].close;
}
