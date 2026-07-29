import fs from "fs";
import os from "os";
import path from "path";
import { fileURLToPath } from "url";

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const useRemote = Boolean(REST_URL && REST_TOKEN);

// Detect serverless platforms (Netlify, Vercel, AWS Lambda) — their filesystem
// is read-only except for a temp directory, so local storage must live there,
// not next to the bundled code.
const isServerless = Boolean(
  process.env.NETLIFY || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.VERCEL
);

// --- Remote backend: Upstash Redis REST API (also what Vercel KV uses under the hood) ---
async function remoteGet(key) {
  const res = await fetch(`${REST_URL}/get/${encodeURIComponent(key)}`, {
    headers: { Authorization: `Bearer ${REST_TOKEN}` }
  });
  if (!res.ok) throw new Error(`KV get failed: ${res.status}`);
  const data = await res.json();
  return data.result ? JSON.parse(data.result) : null;
}

async function remoteSet(key, value) {
  const res = await fetch(`${REST_URL}/set/${encodeURIComponent(key)}`, {
    method: "POST",
    headers: { Authorization: `Bearer ${REST_TOKEN}`, "Content-Type": "text/plain" },
    body: JSON.stringify(value)
  });
  if (!res.ok) throw new Error(`KV set failed: ${res.status}`);
}

// --- Local backend: JSON file on disk. ---
// On a normal machine (local dev, Render) this lives alongside the project
// and is genuinely persistent. On serverless platforms without Upstash
// configured, it falls back to the OS temp directory so it at least doesn't
// crash — but data will NOT persist reliably between requests there. Configure
// UPSTASH_REDIS_REST_URL / UPSTASH_REDIS_REST_TOKEN to fix that properly.
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = isServerless
  ? path.join(os.tmpdir(), "volt-otc-data")
  : path.join(__dirname, "..", "backend", "data");

function ensureLocalDir() {
  try {
    if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
  } catch (e) {
    console.error("Could not create local storage directory:", e.message);
  }
}

function localFile(key) {
  return path.join(LOCAL_DIR, key.replace(/[^a-zA-Z0-9_-]/g, "_") + ".json");
}

function localGet(key) {
  try {
    ensureLocalDir();
    const f = localFile(key);
    if (!fs.existsSync(f)) return null;
    return JSON.parse(fs.readFileSync(f, "utf-8"));
  } catch (e) {
    console.error("Local KV get failed, returning null:", e.message);
    return null;
  }
}

function localSet(key, value) {
  try {
    ensureLocalDir();
    fs.writeFileSync(localFile(key), JSON.stringify(value));
  } catch (e) {
    console.error("Local KV set failed (data will not persist):", e.message);
  }
}

export async function kvGet(key) {
  return useRemote ? remoteGet(key) : localGet(key);
}

export async function kvSet(key, value) {
  return useRemote ? remoteSet(key, value) : localSet(key, value);
}

export const kvBackend = useRemote ? "upstash" : isServerless ? "serverless-tmp (NOT persistent — set Upstash env vars)" : "local-file";
