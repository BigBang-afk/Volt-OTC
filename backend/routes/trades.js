import { Router } from "express";
import { state } from "../store.js";
import { openTrade, listTrades, resetDemoAccount } from "../tradeEngine.js";

const router = Router();

router.get("/account", (req, res) => {
  res.json(state.account);
});

router.post("/account/reset", (req, res) => {
  const balance = Number(req.body?.balance) || 10000;
  resetDemoAccount(balance);
  res.json(state.account);
});

router.get("/", (req, res) => {
  res.json(listTrades(Number(req.query.limit) || 100));
});

router.post("/", (req, res) => {
  try {
    const { symbol, direction, amount, expirySeconds } = req.body;
    const trade = openTrade({ symbol, direction, amount, expirySeconds });
    res.status(201).json(trade);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
