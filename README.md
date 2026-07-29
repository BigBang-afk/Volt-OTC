# Volt OTC — Demo Binary-Options Style Trading Platform

A full-stack demo trading platform (Quotex-style) with:

- **OTC pairs** with a fully **admin-configurable price algorithm** (volatility, trend bias, mean reversion, spread) per pair
- **Live candlestick charts** (via `lightweight-charts`, the same library TradingView open-sourced)
- **10 timeframes**: H4, H1, M30, M15, M5, M1, S30, S15, S10, S5
- **Demo account** with virtual balance, buy (UP) / sell (DOWN) trades, configurable payout %, automatic trade resolution at expiry
- **Admin panel** to tune each pair's algorithm live, change payout, and add/remove OTC pairs
- Real-time price streaming over WebSocket

This is a **custom build with the same functionality you described** — not a copy of Quotex's code, brand, or design assets (which are their proprietary IP). Everything here — architecture, code, styling, brand name — is original so you can freely extend, rebrand, and deploy it.

## Architecture

```
trading-platform/
├── backend/              Node.js + Express + ws (WebSocket)
│   ├── server.js         HTTP + WS server, wires everything together
│   ├── priceEngine.js    Tick generator + candle aggregator for all timeframes
│   ├── tradeEngine.js    Opens/resolves demo trades (binary win/loss/tie logic)
│   ├── store.js          Lightweight JSON-file persistence (no DB server needed)
│   └── routes/
│       ├── pairs.js      GET pairs, GET candle history
│       ├── trades.js     Place trades, get account/trade history
│       └── admin.js      Admin-only: tune algorithm, add/remove pairs, payout
└── frontend/             React + Vite
    └── src/
        ├── App.jsx               Layout + state + WebSocket wiring
        ├── api.js                REST + WebSocket client helpers
        └── components/
            ├── Chart.jsx          Candlestick chart
            ├── PairList.jsx       OTC pair sidebar
            ├── Timeframes.jsx     Timeframe selector strip
            ├── TradePanel.jsx     Amount/expiry/UP/DOWN controls
            ├── TradeHistory.jsx   Live trade list with countdown
            └── AdminPanel.jsx     Algorithm tuning + pair management
```

### How the OTC price algorithm works

Real forex/crypto markets close on weekends, so OTC pairs use a **synthetic price generator** — this is standard industry practice, not unique to any one broker. Each pair has:

- `volatility` — standard deviation of the random price move each tick
- `trendBias` — constant drift added every tick (push price up/down over time)
- `meanReversion` — how strongly price is pulled back toward its anchor (keeps it from drifting to 0 or infinity)
- `spread` — displayed bid/ask spread
- `tickMs` — how often the price updates (default 1000ms)

The admin panel lets you change all of these **live**, per pair, with results visible on the chart within a second.

### Trade resolution

A trade is opened with `{ symbol, direction: 'up'|'down', amount, expirySeconds }`. The stake is deducted from the demo balance immediately. A background loop checks every second for trades whose expiry has passed, compares the exit price to the entry price, and credits `amount + amount * payout%` on a win, refunds on an exact tie, or keeps the stake on a loss.

## What's new: landing page + single-URL deployment

- `/` now shows a marketing landing page (`LandingPage.jsx`) with a "Launch Demo" button.
- `/#/app` (or clicking Launch) shows the actual trading dashboard.
- The backend now serves the built frontend directly, so **the whole thing — landing page, trading app, API, WebSocket — is one deployable service with one URL.**

### Deploying it live

I can't push this to a live URL myself — I don't have network/internet access in the environment I built this in, and deploying requires an account on a hosting provider plus (usually) a GitHub repo connection. Here's the fastest path to get a real URL yourself, using [Render](https://render.com) (has a free tier, no credit card required for this use case):

1. Push this project to a GitHub repo (create one on github.com, then `git init && git add . && git commit -m "init" && git remote add origin <your-repo-url> && git push -u origin main` from the project root).
2. Go to [render.com](https://render.com) → New → Blueprint → connect your repo. Render will detect `render.yaml` at the root and configure the service automatically.
3. Set the `ADMIN_KEY` environment variable in Render's dashboard to your own secret (don't leave it as `admin123`).
4. Click deploy. Render will run the build (compiles the frontend, installs backend deps) and start the server. You'll get a URL like `https://volt-otc.onrender.com`.

**Alternative — Docker (Railway, Fly.io, or any Docker host):** a `Dockerfile` at the project root builds the frontend and runs the backend serving it. Most Docker-based hosts will auto-detect it — just point them at the repo and set `PORT`/`ADMIN_KEY` env vars as needed.

**Local production test** (before deploying, to make sure the build works):
```bash
cd frontend && npm install && npm run build
cd ../backend && npm install && npm start
```
Then open `http://localhost:4000` — you should see the landing page, and `http://localhost:4000/#/app` should show the trading dashboard, all from the one server.



You'll need [Node.js 18+](https://nodejs.org) installed.

### 1. Backend

```bash
cd backend
npm install
npm start
```

This starts the API + WebSocket server on `http://localhost:4000`.

### 2. Frontend

In a new terminal:

```bash
cd frontend
npm install
npm run dev
```

Open the URL Vite prints (usually `http://localhost:5173`). The Vite dev server proxies `/api` and `/ws` to the backend automatically.

### 3. Admin access

Click **⚙ Admin** in the top bar. Default admin key is:

```
admin123
```

Change it by setting the `ADMIN_KEY` environment variable before starting the backend:

```bash
ADMIN_KEY=your-secret-key npm start
```

## Extending this toward a production platform

This is a solid MVP foundation. Before handling real users or real money, you'd want to add:

1. **Real authentication** — the admin route uses a single shared secret; you'd want real user accounts, hashed passwords, JWT/session auth, and role-based access (admin vs trader).
2. **A real database** — the JSON file store is fine for a demo; swap in Postgres/MySQL for concurrent users and data integrity (the code is structured so this is a contained change in `store.js`).
3. **Non-OTC "real" pairs** — wire in a live market data feed (e.g. a forex/crypto data provider) for pairs that mirror actual markets, separate from the synthetic OTC pairs.
4. **Real-money handling** — deposits, withdrawals, KYC — is a heavily regulated area (binary options are restricted or banned in many countries, including the US, EU, and UK for retail traders). Please check the regulatory status in your target jurisdictions before offering this beyond a demo/paper-trading product; the legal requirements are substantial and non-negotiable in most places.
5. **Rate limiting / anti-abuse** on trade placement and admin endpoints.
6. **Horizontal scaling** — move the WebSocket broadcast to Redis pub/sub if you run multiple backend instances.

## Notes on the "algorithm" controls

Because OTC pricing is synthetic, whoever controls the algorithm controls the odds — that's true of every broker offering OTC/synthetic instruments, not just this codebase. If you build this out further, consider being transparent with users about how OTC pricing is generated, since regulators in a number of countries scrutinize this closely for retail-facing platforms.
