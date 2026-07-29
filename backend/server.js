import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import { createServer } from "http";
import { WebSocketServer } from "ws";

import pairsRoutes from "./routes/pairs.js";
import tradesRoutes from "./routes/trades.js";
import adminRoutes from "./routes/admin.js";
import { startEngine, onTick } from "./priceEngine.js";
import { resolveDueTrades } from "./tradeEngine.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 4000;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/pairs", pairsRoutes);
app.use("/api/trades", tradesRoutes);
app.use("/api/admin", adminRoutes);

app.get("/api/health", (req, res) => res.json({ ok: true, time: Date.now() }));

// Serve the built frontend (run `npm run build` in /frontend first) so the
// whole platform — landing page + trading app + API — is a single deployable service.
const FRONTEND_DIST = path.join(__dirname, "../frontend/dist");
app.use(express.static(FRONTEND_DIST));
app.get(/^(?!\/api|\/ws).*/, (req, res) => {
  res.sendFile(path.join(FRONTEND_DIST, "index.html"), (err) => {
    if (err) res.status(404).send("Frontend build not found — run `npm run build` in /frontend first.");
  });
});

const server = createServer(app);
const wss = new WebSocketServer({ server, path: "/ws" });

const clients = new Set();

wss.on("connection", (ws) => {
  clients.add(ws);
  ws.on("close", () => clients.delete(ws));
});

function broadcast(event) {
  const payload = JSON.stringify(event);
  for (const ws of clients) {
    if (ws.readyState === ws.OPEN) ws.send(payload);
  }
}

onTick(broadcast);

// Resolve expired demo trades once per second and push closed-trade events to clients.
setInterval(() => {
  const resolved = resolveDueTrades();
  for (const trade of resolved) {
    broadcast({ type: "trade_resolved", trade });
  }
}, 1000);

startEngine();

server.listen(PORT, () => {
  console.log(`OTC trading backend listening on http://localhost:${PORT}`);
  console.log(`WebSocket feed at ws://localhost:${PORT}/ws`);
});
