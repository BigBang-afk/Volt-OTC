import { kvBackend } from "../../lib/kv.js";

export const handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ok: true,
      storageBackend: kvBackend,
      hasUpstashUrl: Boolean(process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL),
      hasUpstashToken: Boolean(process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN),
      hasAdminKey: Boolean(process.env.ADMIN_KEY),
      time: Date.now()
    })
  };
};
