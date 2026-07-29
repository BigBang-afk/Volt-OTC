import { Router } from "express";
import { listTrades, openTrade } from "../../lib/tradeStore.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    res.json(await listTrades(Number(req.query.limit) || 100));
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { symbol, direction, amount, expirySeconds } = req.body;
    const trade = await openTrade({ symbol, direction, amount, expirySeconds });
    res.status(201).json(trade);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
