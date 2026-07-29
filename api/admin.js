import { getAllPairs, addPair, updatePairAlgorithm, updatePairPayout, removePair } from "../lib/pairsStore.js";

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

export default async function handler(req, res) {
  const key = req.headers["x-admin-key"];
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid or missing x-admin-key header" });
  }

  try {
    if (req.method === "GET") {
      const pairs = await getAllPairs();
      return res.status(200).json(Object.values(pairs));
    }

    if (req.method === "POST") {
      const { symbol, basePrice, payout, algorithm } = req.body || {};
      if (!symbol || !basePrice) {
        return res.status(400).json({ error: "symbol and basePrice are required" });
      }
      const existing = await getAllPairs();
      if (existing[symbol]) return res.status(409).json({ error: "Pair already exists" });
      const pair = await addPair(symbol, Number(basePrice), Number(payout), algorithm);
      return res.status(201).json(pair);
    }

    if (req.method === "PUT") {
      const { symbol, field } = req.query;
      if (!symbol) return res.status(400).json({ error: "symbol query param required" });
      const decoded = decodeURIComponent(symbol);

      if (field === "payout") {
        const pair = await updatePairPayout(decoded, Number(req.body.payout));
        if (!pair) return res.status(404).json({ error: "Unknown pair" });
        return res.status(200).json(pair);
      }
      const pair = await updatePairAlgorithm(decoded, req.body || {});
      if (!pair) return res.status(404).json({ error: "Unknown pair" });
      return res.status(200).json(pair);
    }

    if (req.method === "DELETE") {
      const { symbol } = req.query;
      if (!symbol) return res.status(400).json({ error: "symbol query param required" });
      const ok = await removePair(decodeURIComponent(symbol));
      if (!ok) return res.status(404).json({ error: "Unknown pair" });
      return res.status(200).json({ ok: true });
    }

    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
