import { Router } from "express";
import {
  getAllPairs,
  addPair,
  updatePairAlgorithm,
  updatePairPayout,
  removePair
} from "../../lib/pairsStore.js";

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

// Route shape mirrors /api/admin.js (the Vercel serverless function) so the
// same frontend code works against either backend.
router.get("/pairs", async (req, res) => {
  res.json(Object.values(await getAllPairs()));
});

router.post("/pairs", async (req, res) => {
  const { symbol, basePrice, payout, algorithm } = req.body;
  if (!symbol || !basePrice) {
    return res.status(400).json({ error: "symbol and basePrice are required" });
  }
  const existing = await getAllPairs();
  if (existing[symbol]) return res.status(409).json({ error: "Pair already exists" });
  const pair = await addPair(symbol, Number(basePrice), Number(payout), algorithm);
  res.status(201).json(pair);
});

router.put("/pairs", async (req, res) => {
  const { symbol, field } = req.query;
  if (!symbol) return res.status(400).json({ error: "symbol query param required" });
  const decoded = decodeURIComponent(symbol);

  if (field === "payout") {
    const pair = await updatePairPayout(decoded, Number(req.body.payout));
    if (!pair) return res.status(404).json({ error: "Unknown pair" });
    return res.json(pair);
  }
  const pair = await updatePairAlgorithm(decoded, req.body || {});
  if (!pair) return res.status(404).json({ error: "Unknown pair" });
  res.json(pair);
});

router.delete("/pairs", async (req, res) => {
  const { symbol } = req.query;
  if (!symbol) return res.status(400).json({ error: "symbol query param required" });
  const ok = await removePair(decodeURIComponent(symbol));
  if (!ok) return res.status(404).json({ error: "Unknown pair" });
  res.json({ ok: true });
});

export default router;
