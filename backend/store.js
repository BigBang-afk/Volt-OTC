import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "data");
const FILE = path.join(DATA_DIR, "db.json");

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// Default OTC pairs. "algorithm" params are fully admin-configurable at runtime.
const DEFAULT_STATE = {
  pairs: {
    "EUR/USD OTC": {
      symbol: "EUR/USD OTC",
      price: 1.0821,
      payout: 87,
      algorithm: {
        volatility: 0.00006,   // stdev of price move per tick
        trendBias: 0,          // constant drift per tick (+/-)
        meanReversion: 0.02,   // pull back toward anchor price (0-1)
        spread: 0.00004,
        tickMs: 1000
      },
      anchor: 1.0821
    },
    "GBP/USD OTC": {
      symbol: "GBP/USD OTC",
      price: 1.2694,
      payout: 85,
      algorithm: {
        volatility: 0.00008,
        trendBias: 0,
        meanReversion: 0.02,
        spread: 0.00005,
        tickMs: 1000
      },
      anchor: 1.2694
    },
    "USD/JPY OTC": {
      symbol: "USD/JPY OTC",
      price: 155.42,
      payout: 90,
      algorithm: {
        volatility: 0.006,
        trendBias: 0,
        meanReversion: 0.02,
        spread: 0.004,
        tickMs: 1000
      },
      anchor: 155.42
    },
    "BTC/USD OTC": {
      symbol: "BTC/USD OTC",
      price: 64250,
      payout: 80,
      algorithm: {
        volatility: 12,
        trendBias: 0,
        meanReversion: 0.01,
        spread: 8,
        tickMs: 1000
      },
      anchor: 64250
    }
  },
  candles: {}, // candles[symbol][timeframeSeconds] = [{time,open,high,low,close}, ...]
  account: {
    demoBalance: 10000,
    currency: "USD"
  },
  trades: [] // {id, symbol, direction, amount, entryPrice, entryTime, expiryTime, expirySeconds, status, exitPrice, result, payout}
};

function load() {
  if (!fs.existsSync(FILE)) {
    save(DEFAULT_STATE);
    return structuredClone(DEFAULT_STATE);
  }
  try {
    const raw = fs.readFileSync(FILE, "utf-8");
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to read db.json, resetting to defaults", e);
    save(DEFAULT_STATE);
    return structuredClone(DEFAULT_STATE);
  }
}

function save(state) {
  fs.writeFileSync(FILE, JSON.stringify(state, null, 2));
}

export const state = load();

let saveTimer = null;
export function persistSoon() {
  if (saveTimer) return;
  saveTimer = setTimeout(() => {
    save(state);
    saveTimer = null;
  }, 500);
}
