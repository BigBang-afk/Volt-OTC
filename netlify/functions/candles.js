import { getPair } from "../../lib/pairsStore.js";
import { generateCandles, TIMEFRAMES } from "../../lib/priceModel.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  try {
    const { symbol, timeframe, limit } = event.queryStringParameters || {};
    if (!symbol || !timeframe) {
      return { statusCode: 400, body: JSON.stringify({ error: "symbol and timeframe query params are required" }) };
    }
    if (!TIMEFRAMES[timeframe]) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Unknown timeframe. Valid: " + Object.keys(TIMEFRAMES).join(", ") })
      };
    }
    const pair = await getPair(symbol);
    if (!pair) return { statusCode: 404, body: JSON.stringify({ error: "Unknown pair" }) };

    const nowSeconds = Math.floor(Date.now() / 1000);
    const candles = generateCandles(pair, TIMEFRAMES[timeframe], Math.min(Number(limit) || 200, 500), nowSeconds);
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(candles) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
