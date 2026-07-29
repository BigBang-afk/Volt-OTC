import { listTrades, openTrade } from "../../lib/tradeStore.js";

export const handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      const limit = Number(event.queryStringParameters?.limit) || 100;
      const trades = await listTrades(limit);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(trades) };
    }
    if (event.httpMethod === "POST") {
      const { symbol, direction, amount, expirySeconds } = JSON.parse(event.body || "{}");
      const trade = await openTrade({ symbol, direction, amount, expirySeconds });
      return { statusCode: 201, headers: { "Content-Type": "application/json" }, body: JSON.stringify(trade) };
    }
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};
