import { Router } from "express";
import { getAccount, resetAccount, resolveDueTrades } from "../../lib/tradeStore.js";

const router = Router();

router.get("/", async (req, res) => {
  try {
    await resolveDueTrades();
    res.json(await getAccount());
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

router.post("/reset", async (req, res) => {
  try {
    const balance = Number(req.body?.balance) || 10000;
    res.json(await resetAccount(balance));
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
