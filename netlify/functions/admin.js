import {
  getAllPairs,
  addPair,
  updatePairAlgorithm,
  updatePairPayout,
  removePair
} from "../../lib/pairsStore.js";

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

export const handler = async (event) => {
  const key = event.headers["x-admin-key"] || event.headers["X-Admin-Key"];
  if (key !== ADMIN_KEY) {
    return { statusCode: 401, body: JSON.stringify({ error: "Invalid or missing x-admin-key header" }) };
  }

  try {
    if (event.httpMethod === "GET") {
      const pairs = await getAllPairs();
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(Object.values(pairs)) };
    }

    if (event.httpMethod === "POST") {
      const { symbol, basePrice, payout, algorithm } = JSON.parse(event.body || "{}");
      if (!symbol || !basePrice) {
        return { statusCode: 400, body: JSON.stringify({ error: "symbol and basePrice are required" }) };
      }
      const existing = await getAllPairs();
      if (existing[symbol]) return { statusCode: 409, body: JSON.stringify({ error: "Pair already exists" }) };
      const pair = await addPair(symbol, Number(basePrice), Number(payout), algorithm);
      return { statusCode: 201, headers: { "Content-Type": "application/json" }, body: JSON.stringify(pair) };
    }

    if (event.httpMethod === "PUT") {
      const { symbol, field } = event.queryStringParameters || {};
      if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: "symbol query param required" }) };
      const decoded = decodeURIComponent(symbol);
      const body = JSON.parse(event.body || "{}");

      if (field === "payout") {
        const pair = await updatePairPayout(decoded, Number(body.payout));
        if (!pair) return { statusCode: 404, body: JSON.stringify({ error: "Unknown pair" }) };
        return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(pair) };
      }
      const pair = await updatePairAlgorithm(decoded, body);
      if (!pair) return { statusCode: 404, body: JSON.stringify({ error: "Unknown pair" }) };
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(pair) };
    }

    if (event.httpMethod === "DELETE") {
      const { symbol } = event.queryStringParameters || {};
      if (!symbol) return { statusCode: 400, body: JSON.stringify({ error: "symbol query param required" }) };
      const ok = await removePair(decodeURIComponent(symbol));
      if (!ok) return { statusCode: 404, body: JSON.stringify({ error: "Unknown pair" }) };
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ok: true }) };
    }

    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};
