import { Router } from "express";
import { getAllPairs, getPair } from "../../lib/pairsStore.js";
import { generateCandles, priceAtTime, TIMEFRAMES } from "../../lib/priceModel.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    const pairs = await getAllPairs();
    const now = Date.now();
    const list = Object.values(pairs).map((p) => ({
      symbol: p.symbol,
      price: priceAtTime(p, now),
      payout: p.payout,
      spread: p.algorithm.spread
    }));
    res.json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.get("/timeframes", (req, res) => {
  res.json(TIMEFRAMES);
});

router.get("/candles", async (req, res) => {
  try {
    const { symbol, timeframe, limit } = req.query;
    if (!symbol || !timeframe) {
      return res.status(400).json({ error: "symbol and timeframe query params are required" });
    }
    if (!TIMEFRAMES[timeframe]) {
      return res.status(400).json({ error: "Unknown timeframe. Valid: " + Object.keys(TIMEFRAMES).join(", ") });
    }
    const pair = await getPair(symbol);
    if (!pair) return res.status(404).json({ error: "Unknown pair" });

    const nowSeconds = Math.floor(Date.now() / 1000);
    const candles = generateCandles(pair, TIMEFRAMES[timeframe], Math.min(Number(limit) || 200, 500), nowSeconds);
    res.json(candles);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

export default router;
