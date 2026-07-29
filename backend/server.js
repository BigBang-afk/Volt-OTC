import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import pairsRoutes from "./routes/pairs.js";
import tradesRoutes from "./routes/trades.js";
import accountRoutes from "./routes/account.js";
import adminRoutes from "./routes/admin.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/pairs", pairsRoutes);
app.use("/api/trades", tradesRoutes);
app.use("/api/account", accountRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, time: Date.now() }));

// Serve the built frontend (run `npm run build` in /frontend first) so the
// whole platform — landing page + trading app + API — is a single deployable service.
const FRONTEND_DIST = path.join(__dirname, "../frontend/dist");
app.use(express.static(FRONTEND_DIST));
app.get(/^(?!\/api).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) res.status(404).send("Frontend build not found — run `npm run build` in /frontend first.");
  });
});

app.listen(PORT, () => {
  console.log(`Volt OTC backend listening on http://localhost:${PORT}`);
  console.log(`Storage backend: ${process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL ? "upstash" : "local-file"}`);
});
