import { getAccount, resetAccount } from "../lib/tradeStore.js";
import { resolveDueTrades } from "../lib/tradeStore.js";

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      await resolveDueTrades(); // make sure balance reflects any just-expired trades
      return res.status(200).json(await getAccount());
    }
    if (req.method === "POST") {
      const balance = Number(req.body?.balance) || 10000;
      return res.status(200).json(await resetAccount(balance));
    }
    res.status(405).json({ error: "Method not allowed" });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}
