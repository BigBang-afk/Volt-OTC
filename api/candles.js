import { getPair } from "../lib/pairsStore.js";
import { generateCandles, TIMEFRAMES } from "../lib/priceModel.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
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
    res.status(200).json(candles);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
