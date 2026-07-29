import { listTrades, openTrade } from "../lib/tradeStore.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const limit = Number(req.query.limit) || 100;
      return res.status(200).json(await listTrades(limit));
    }
    if (req.method === "POST") {
      const { symbol, direction, amount, expirySeconds } = req.body || {};
      const trade = await openTrade({ symbol, direction, amount, expirySeconds });
      return res.status(201).json(trade);
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
