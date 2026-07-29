import { getAllPairs } from "../../lib/pairsStore.js";
import { priceAtTime } from "../../lib/priceModel.js";

export const handler = async (event) => {
  if (event.httpMethod !== "GET") {
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  }
  try {
    const pairs = await getAllPairs();
    const now = Date.now();
    const list = Object.values(pairs).map((p) => ({
      symbol: p.symbol,
      price: priceAtTime(p, now),
      payout: p.payout,
      spread: p.algorithm.spread
    }));
    return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(list) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
};
