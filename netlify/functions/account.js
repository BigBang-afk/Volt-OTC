import { getAccount, resetAccount, resolveDueTrades } from "../../lib/tradeStore.js";

export const handler = async (event) => {
  try {
    if (event.httpMethod === "GET") {
      await resolveDueTrades();
      const acc = await getAccount();
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(acc) };
    }
    if (event.httpMethod === "POST") {
      const body = JSON.parse(event.body || "{}");
      const balance = Number(body.balance) || 10000;
      const acc = await resetAccount(balance);
      return { statusCode: 200, headers: { "Content-Type": "application/json" }, body: JSON.stringify(acc) };
    }
    return { statusCode: 405, body: JSON.stringify({ error: "Method not allowed" }) };
  } catch (e) {
    return { statusCode: 400, body: JSON.stringify({ error: e.message }) };
  }
};
