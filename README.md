# Volt OTC — Demo Binary-Options Style Trading Platform

A full-stack demo trading platform (Quotex-style) with:

- **OTC pairs** with a fully **admin-configurable price algorithm** (volatility, trend bias, mean reversion, spread) per pair
- **Live candlestick charts** (via `lightweight-charts`) across **10 timeframes**: H4, H1, M30, M15, M5, M1, S30, S15, S10, S5
- **Demo account** with virtual balance, buy (UP) / sell (DOWN) trades, configurable payout %, automatic trade resolution at expiry
- **Admin panel** to tune each pair's algorithm live, change payout, and add/remove OTC pairs
- **Landing page** at `/` with a "Launch Demo" button into the dashboard at `#/app`
- Real-time-feeling price updates via **polling** (no WebSocket) — this is what makes it deployable on serverless platforms like Vercel

This is a **custom build with the same functionality you described** — not a copy of Quotex's code, brand, or design assets.

## How the price engine works (read this first)

The price engine is a **pure function of time**, not a background process. Given a pair's config and a timestamp, `generateCandles()` and `priceAtTime()` always return the same result for the same inputs — deterministic, seeded pseudo-randomness (see `lib/hash.js` and `lib/priceModel.js`).

This matters because serverless functions (Vercel, etc.) don't stay running in the background — there's no persistent process to "tick" a price forward every second. By making price a pure function of the clock instead of accumulated state, **any** request, from **any** function instance, at **any** time, reconstructs the exact same price/candle history — no shared memory or timer required. It's also why trade resolution doesn't need a background loop: any request that touches trades (`GET /api/trades`, `GET /api/account`) lazily checks for expired trades and resolves them using the pure price function evaluated at the exact expiry timestamp.

The frontend polls REST endpoints (chart candles every ~1.5s, prices/trades every ~1.5-2s) instead of holding a WebSocket open — a deliberate trade-off so the whole thing runs on Vercel's free tier.

**Known trade-off:** each timeframe (H4, M1, S5, etc.) is generated independently rather than aggregated from a finer one, and changing a pair's algorithm in the admin panel affects the *entire* recomputed history for that pair, not just going forward. That's fine for a demo/practice platform; a production system would snapshot history in a real database instead of recomputing it live.

## Project structure

```
lib/                  Shared logic used by BOTH deployment targets below
  hash.js              Deterministic seeded PRNG/Gaussian
  priceModel.js        generateCandles() / priceAtTime() — the pure price function
  kv.js                Storage: Upstash/Vercel KV REST API, or local JSON file
  pairsStore.js        OTC pair config + admin overrides
  tradeStore.js        Demo account + trades, lazy resolution

api/                  Vercel serverless functions (deploy target: Vercel)
  pairs.js, candles.js, trades.js, account.js, admin.js

backend/               Express server (deploy target: Render / Railway / local / Docker)
  server.js            Same routes as /api, reusing the same /lib
  routes/*.js

frontend/              React + Vite (same build serves either backend)
  src/
    App.jsx             Router: landing page vs trading app (hash-based, no server routing needed)
    LandingPage.jsx      Marketing homepage
    TradingApp.jsx       The trading dashboard (polling-based)
    api.js               REST client (works against either backend — same route shapes)
    components/          Chart, PairList, Timeframes, TradePanel, TradeHistory, AdminPanel
```

## Running it locally

```bash
cd backend && npm install && npm start      # API on :4000
cd frontend && npm install && npm run dev   # UI on :5173 (proxies /api to :4000)
```
Open `http://localhost:5173`.

Admin key defaults to `admin123` — set your own with `ADMIN_KEY=yourkey npm start` in `backend/`.

## Deploying to Netlify (no credit card required) — recommended

Netlify's free tier doesn't ask for a card, and this project already includes everything it needs (`netlify.toml` + `netlify/functions/`).

### 1. Storage: Upstash Redis (free, also no card)

Netlify Functions don't share a filesystem between invocations either, so you still need Upstash for storage — same as the Vercel path:
1. Sign up free at [upstash.com](https://upstash.com)
2. Create a Redis database (any name/region, type Regional)
3. On the database page, find the **REST API** section, copy `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`

### 2. Push to GitHub (if you haven't already)

```bash
git init
git add .
git commit -m "Volt OTC"
git remote add origin https://github.com/YOUR_USERNAME/volt-otc.git
git branch -M main
git push -u origin main
```
(No git installed or terminal issues? You can also create the repo on github.com and drag-and-drop upload all the files through the browser — no command line needed.)

### 3. Deploy on Netlify

1. Go to [app.netlify.com](https://app.netlify.com) → sign up/log in with GitHub (no card needed)
2. Click **Add new site** → **Import an existing project** → **GitHub** → select your `volt-otc` repo
3. Netlify should auto-detect the build settings from `netlify.toml` (build command, publish directory, functions directory) — you shouldn't need to type anything in manually
4. Before deploying, click **Add environment variables** and add:
   - `ADMIN_KEY` → your own secret
   - `UPSTASH_REDIS_REST_URL` → from Upstash
   - `UPSTASH_REDIS_REST_TOKEN` → from Upstash
5. Click **Deploy site**

You'll get a URL like `https://volt-otc.netlify.app` in a couple of minutes.

## Deploying to Vercel (also free, but some accounts hit a card-verification gate)

### 1. You'll need a place to persist data: Upstash Redis (free tier)

Vercel functions don't share a filesystem between requests, so the local JSON-file storage won't work there. Sign up free at [upstash.com](https://upstash.com), create a Redis database, and copy the **REST URL** and **REST TOKEN** from its dashboard.

(If instead you add Vercel's own "KV" storage add-on from your Vercel project dashboard, it sets the equivalent env vars automatically — either works, the code checks for both naming conventions.)

### 2. Push this project to GitHub

```bash
git init
git add .
git commit -m "Volt OTC"
git remote add origin https://github.com/YOUR_USERNAME/volt-otc.git
git branch -M main
git push -u origin main
```

### 3. Deploy on Vercel

1. Go to [vercel.com/new](https://vercel.com/new), import your GitHub repo.
2. Vercel will detect `vercel.json` (builds the frontend, serves `frontend/dist`, auto-detects `/api/*.js` as serverless functions). You shouldn't need to change any framework settings.
3. Before deploying, add these **Environment Variables** in the Vercel project settings:
   - `ADMIN_KEY` → your own admin secret (don't leave it as `admin123`)
   - `UPSTASH_REDIS_REST_URL` → from your Upstash dashboard
   - `UPSTASH_REDIS_REST_TOKEN` → from your Upstash dashboard
4. Click **Deploy**.

You'll get a URL like `https://volt-otc.vercel.app`. Open it — that's the landing page; click "Launch Demo" for the dashboard, and "⚙ Admin" (using the key you set) to tune the OTC algorithm live.

### Alternative: Render (persistent server, simpler storage)

`render.yaml` at the repo root still works for a traditional persistent-server deploy — no Upstash needed there since Render gives you a real disk for the local JSON-file storage. Same repo, either path.

## Extending this toward a production platform

1. **Real authentication** — the admin route uses a single shared secret; add real user accounts, hashed passwords, and role-based access before this handles anyone but you.
2. **A real database** — Upstash/local-file storage is fine for a demo; a relational database (Postgres) would give you proper querying, indexing, and data integrity for real user/trade volume.
3. **Non-OTC "real" pairs** — wire in a live market data feed for pairs that mirror actual markets, separate from synthetic OTC pairs.
4. **Real-money handling** — deposits, withdrawals, KYC — is heavily regulated. Binary options are restricted or banned for retail traders in many countries (US, EU, UK among them). Check the regulatory status in your target jurisdictions before offering this beyond a demo/paper-trading product.
5. **Rate limiting / anti-abuse** on trade placement and admin endpoints.
6. **Snapshot real history** — store actual candle closes as they happen (via a cron job or on first request per period) rather than recomputing the whole synthetic history live, so admin algorithm changes don't retroactively rewrite the past.

## A note on the "algorithm" controls

Because OTC pricing here is synthetic, whoever controls the algorithm controls the odds — true of any broker offering OTC/synthetic instruments, not unique to this codebase. If you build this further, consider being transparent with users about how OTC pricing is generated; regulators in a number of countries scrutinize this closely for retail-facing platforms.
