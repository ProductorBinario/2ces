import { createHash, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// Hash maestro (frase única "La gloria de DIOS"). No se rota.
export const MASTER_HASH =
  "e5f79325621811a1194480ae78ec6892c6fe215773fd5265321084373b13adc0";

// Hashes por defecto del flujo Admin: "DIOS" → "ESTA" → "CONMIGO".
// Usados como fallback si no hay rotación guardada en la base.
export const ADMIN_HASHES_DEFAULT: readonly [string, string, string] = [
  "c59c2527808b8b9cf7724f447b3f6520feea73693d5704186e70febefa0baa09",
  "26e5772df8421cc4f34a94d38eed35a2e6dc7e73ace7035e669fe89ea1244801",
  "e707d81107843f7f7397617c966995f2e6f5e48e4410470067bb5d48eac05608",
];

// Compatibilidad con código antiguo.
export const ADMIN_HASHES = ADMIN_HASHES_DEFAULT;

export const sha = (s: string) =>
  createHash("sha256").update(s, "utf8").digest("hex");

export const hashEq = (a: string, b: string) => {
  if (typeof a !== "string" || typeof b !== "string") return false;
  if (a.length !== b.length) return false;
  const A = Buffer.from(a, "hex");
  const B = Buffer.from(b, "hex");
  return A.length === B.length && timingSafeEqual(A, B);
};

const isHex64 = (s: unknown): s is string =>
  typeof s === "string" && /^[a-f0-9]{64}$/.test(s);

// Lee el hash vigente del Master (rotado o por defecto).
export async function getMasterHash(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("master_hash")
      .eq("id", 1)
      .maybeSingle();
    const v = (data as { master_hash?: unknown } | null)?.master_hash;
    return isHex64(v) ? v : MASTER_HASH;
  } catch {
    return MASTER_HASH;
  }
}

// Lee los hashes vigentes del Admin (rotados o por defecto).
export async function getAdminHashes(): Promise<[string, string, string]> {
  try {
    const { data } = await supabaseAdmin
      .from("app_settings")
      .select("admin_hash_1,admin_hash_2,admin_hash_3")
      .eq("id", 1)
      .maybeSingle();
    const h1 = isHex64(data?.admin_hash_1) ? data!.admin_hash_1 : ADMIN_HASHES_DEFAULT[0];
    const h2 = isHex64(data?.admin_hash_2) ? data!.admin_hash_2 : ADMIN_HASHES_DEFAULT[1];
    const h3 = isHex64(data?.admin_hash_3) ? data!.admin_hash_3 : ADMIN_HASHES_DEFAULT[2];
    return [h1, h2, h3];
  } catch {
    return [...ADMIN_HASHES_DEFAULT] as [string, string, string];
  }
}

// Rate-limit por IP (best effort por instancia).
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
