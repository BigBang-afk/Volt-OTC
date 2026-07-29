import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const REST_URL = process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
const REST_TOKEN = process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;

const useRemote = Boolean(REST_URL && REST_TOKEN);

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

// --- Local backend: JSON file on disk. Fine for local dev and for Render
// (which gives you a persistent disk), but NOT durable on Vercel — serverless
// functions there don't share a writable filesystem between invocations. ---
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCAL_DIR = path.join(__dirname, "..", "backend", "data");

function ensureLocalDir() {
  if (!fs.existsSync(LOCAL_DIR)) fs.mkdirSync(LOCAL_DIR, { recursive: true });
}

function localFile(key) {
  return path.join(LOCAL_DIR, key.replace(/[^a-zA-Z0-9_-]/g, "_") + ".json");
}

function localGet(key) {
  ensureLocalDir();
  const f = localFile(key);
  if (!fs.existsSync(f)) return null;
  return JSON.parse(fs.readFileSync(f, "utf-8"));
}

function localSet(key, value) {
  ensureLocalDir();
  fs.writeFileSync(localFile(key), JSON.stringify(value));
}

export async function kvGet(key) {
  return useRemote ? remoteGet(key) : localGet(key);
}

export async function kvSet(key, value) {
  return useRemote ? remoteSet(key, value) : localSet(key, value);
}

export const kvBackend = useRemote ? "upstash" : "local-file";
