import { Router } from "express";
import { state } from "../store.js";
import { getCandles, TIMEFRAMES } from "../priceEngine.js";

const router = Router();

router.get("/", (req, res) => {
  const list = Object.values(state.pairs).map((p) => ({
    symbol: p.symbol,
    price: p.price,
    payout: p.payout,
    spread: p.algorithm.spread
  }));
  res.json(list);
});

router.get("/timeframes", (req, res) => {
  res.json(TIMEFRAMES);
});

router.get("/:symbol/candles/:timeframe", (req, res) => {
  const { symbol, timeframe } = req.params;
  const decodedSymbol = decodeURIComponent(symbol);
  if (!TIMEFRAMES[timeframe]) {
    return res.status(400).json({ error: "Unknown timeframe. Valid: " + Object.keys(TIMEFRAMES).join(", ") });
  }
  if (!state.pairs[decodedSymbol]) {
    return res.status(404).json({ error: "Unknown pair" });
  }
  const limit = Math.min(Number(req.query.limit) || 200, 500);
  res.json(getCandles(decodedSymbol, timeframe, limit));
});

export default router;
