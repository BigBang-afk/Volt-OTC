import { Router } from "express";
import { state } from "../store.js";
import { addPair, updateAlgorithm, removePair } from "../priceEngine.js";

const router = Router();

const ADMIN_KEY = process.env.ADMIN_KEY || "admin123";

// Simple shared-secret auth. Replace with real auth (JWT/sessions/roles) before going anywhere near production.
router.use((req, res, next) => {
  const key = req.header("x-admin-key");
  if (key !== ADMIN_KEY) {
    return res.status(401).json({ error: "Invalid or missing x-admin-key header" });
  }
  next();
});

router.get("/pairs", (req, res) => {
  res.json(Object.values(state.pairs));
});

router.post("/pairs", (req, res) => {
  const { symbol, basePrice, payout, algorithm } = req.body;
  if (!symbol || !basePrice) {
    return res.status(400).json({ error: "symbol and basePrice are required" });
  }
  if (state.pairs[symbol]) {
    return res.status(409).json({ error: "Pair already exists" });
  }
  const pair = addPair(symbol, Number(basePrice), Number(payout), algorithm);
  res.status(201).json(pair);
});

router.put("/pairs/:symbol/algorithm", (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const pair = updateAlgorithm(symbol, req.body);
  if (!pair) return res.status(404).json({ error: "Unknown pair" });
  res.json(pair);
});

router.put("/pairs/:symbol/payout", (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  const pair = state.pairs[symbol];
  if (!pair) return res.status(404).json({ error: "Unknown pair" });
  pair.payout = Number(req.body.payout);
  res.json(pair);
});

router.delete("/pairs/:symbol", (req, res) => {
  const symbol = decodeURIComponent(req.params.symbol);
  if (!state.pairs[symbol]) return res.status(404).json({ error: "Unknown pair" });
  removePair(symbol);
  res.json({ ok: true });
});

export default router;
