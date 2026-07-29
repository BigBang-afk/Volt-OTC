import { getAllPairs } from "../lib/pairsStore.js";
import { priceAtTime } from "../lib/priceModel.js";

export default async function handler(req, res) {
  if (req.method !== "GET") return res.status(405).json({ error: "Method not allowed" });
  try {
    const pairs = await getAllPairs();
    const now = Date.now();
    const list = Object.values(pairs).map((p) => ({
      symbol: p.symbol,
      price: priceAtTime(p, now),
      payout: p.payout,
      spread: p.algorithm.spread
    }));
    res.status(200).json(list);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
