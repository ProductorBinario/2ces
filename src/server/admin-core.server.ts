import { createHash, timingSafeEqual } from "crypto";

// SHA-256 hashes of the access phrases. The plain phrases never reach the
// client and are never stored — only their hashes live here on the server.
export const MASTER_HASH =
  "e5f79325621811a1194480ae78ec6892c6fe215773fd5265321084373b13adc0"; // "La gloria de DIOS"
export const ADMIN_HASHES: readonly [string, string, string] = [
  "c59c2527808b8b9cf7724f447b3f6520feea73693d5704186e70febefa0baa09", // "DIOS"
  "26e5772df8421cc4f34a94d38eed35a2e6dc7e73ace7035e669fe89ea1244801", // "ESTA"
  "e707d81107843f7f7397617c966995f2e6f5e48e4410470067bb5d48eac05608", // "CONMIGO"
];

export const sha = (s: string) =>
  createHash("sha256").update(s, "utf8").digest("hex");

export const hashEq = (a: string, b: string) => {
  const A = Buffer.from(a, "hex");
  const B = Buffer.from(b, "hex");
  return A.length === B.length && timingSafeEqual(A, B);
};

// Best-effort in-memory rate limit per IP (per worker instance).
const attempts = new Map<string, { count: number; ts: number }>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 12;

export function rateLimit(ip: string): boolean {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now - e.ts > RL_WINDOW_MS) {
    attempts.set(ip, { count: 1, ts: now });
    return true;
  }
  e.count += 1;
  return e.count <= RL_MAX;
}

export function clientIP(request: Request): string {
  const h = request.headers;
  return (
    h.get("cf-connecting-ip") ||
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    "unknown"
  );
}
