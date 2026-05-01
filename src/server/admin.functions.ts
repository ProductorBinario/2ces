import { createServerFn } from "@tanstack/react-start";
import { createHash, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// SHA-256 hashes of the access phrases. The plain phrases never reach the client
// and are not stored anywhere — only their hashes live here on the server.
const MASTER_HASH = "e5f79325621811a1194480ae78ec6892c6fe215773fd5265321084373b13adc0"; // "La gloria de DIOS"
// Admin sequence: must enter the three phrases in order.
const ADMIN_HASHES: [string, string, string] = [
  "c59c2527808b8b9cf7724f447b3f6520feea73693d5704186e70febefa0baa09", // step 0: "DIOS"
  "26e5772df8421cc4f34a94d38eed35a2e6dc7e73ace7035e669fe89ea1244801", // step 1: "ESTA"
  "e707d81107843f7f7397617c966995f2e6f5e48e4410470067bb5d48eac05608", // step 2: "CONMIGO"
];

const sha = (s: string) => createHash("sha256").update(s, "utf8").digest("hex");
const eq = (a: string, b: string) => {
  const A = Buffer.from(a, "hex");
  const B = Buffer.from(b, "hex");
  return A.length === B.length && timingSafeEqual(A, B);
};

// Simple in-memory rate limit per IP (best-effort; resets when worker restarts)
const attempts = new Map<string, { count: number; ts: number }>();
const RL_WINDOW_MS = 60_000;
const RL_MAX = 12;
function rateLimit(ip: string) {
  const now = Date.now();
  const e = attempts.get(ip);
  if (!e || now - e.ts > RL_WINDOW_MS) {
    attempts.set(ip, { count: 1, ts: now });
    return true;
  }
  e.count += 1;
  if (e.count > RL_MAX) return false;
  return true;
}

function getIP(): string {
  try {
    const { getRequestHeader } = require("@tanstack/react-start/server");
    return (
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown"
    );
  } catch {
    return "unknown";
  }
}

// Verify a single phrase against either the master hash or one specific admin step.
export const verifyKey = createServerFn({ method: "POST" })
  .inputValidator((data: { phrase: string; role: "master" | "admin"; step?: number }) => {
    if (typeof data?.phrase !== "string" || data.phrase.length === 0 || data.phrase.length > 200) {
      throw new Error("invalid_input");
    }
    if (data.role !== "master" && data.role !== "admin") throw new Error("invalid_role");
    return data;
  })
  .handler(async ({ data }) => {
    const ip = getIP();
    if (!rateLimit(ip)) return { ok: false, error: "rate_limited" as const };

    const h = sha(data.phrase.trim());
    if (data.role === "master") {
      return { ok: eq(h, MASTER_HASH) };
    }
    const step = Number.isInteger(data.step) ? (data.step as number) : -1;
    if (step < 0 || step > 2) return { ok: false };
    return { ok: eq(h, ADMIN_HASHES[step]) };
  });

// Update settings. Re-validates ALL access phrases server-side (Master OR full admin sequence).
export const updateSettings = createServerFn({ method: "POST" })
  .inputValidator(
    (data: {
      role: "master" | "admin";
      phrases: string[]; // master: [phrase], admin: [p1, p2, p3]
      settings: {
        whatsapp?: string;
        telegram?: string;
        email?: string;
        ces_fee?: number;
      };
    }) => {
      if (data?.role !== "master" && data?.role !== "admin") throw new Error("invalid_role");
      if (!Array.isArray(data?.phrases)) throw new Error("invalid_phrases");
      if (typeof data?.settings !== "object" || data.settings === null) throw new Error("invalid_settings");
      return data;
    },
  )
  .handler(async ({ data }) => {
    const ip = getIP();
    if (!rateLimit(ip)) return { ok: false, error: "rate_limited" as const };

    // Re-verify auth server-side
    if (data.role === "master") {
      if (data.phrases.length !== 1 || !eq(sha(data.phrases[0].trim()), MASTER_HASH)) {
        return { ok: false, error: "unauthorized" as const };
      }
    } else {
      if (data.phrases.length !== 3) return { ok: false, error: "unauthorized" as const };
      for (let i = 0; i < 3; i++) {
        if (!eq(sha(data.phrases[i].trim()), ADMIN_HASHES[i])) {
          return { ok: false, error: "unauthorized" as const };
        }
      }
    }

    // Validate & sanitize settings
    const patch: Record<string, string | number> = {};
    const s = data.settings;
    if (typeof s.whatsapp === "string") {
      const wa = s.whatsapp.trim();
      if (!/^\+?[0-9\s\-]{6,20}$/.test(wa)) return { ok: false, error: "invalid_whatsapp" as const };
      patch.whatsapp = wa;
    }
    if (typeof s.telegram === "string") {
      const tg = s.telegram.trim().replace(/^@/, "");
      if (!/^[a-zA-Z0-9_]{3,64}$/.test(tg)) return { ok: false, error: "invalid_telegram" as const };
      patch.telegram = tg;
    }
    if (typeof s.email === "string") {
      const em = s.email.trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) || em.length > 200) {
        return { ok: false, error: "invalid_email" as const };
      }
      patch.email = em;
    }
    if (s.ces_fee !== undefined) {
      const fee = Number(s.ces_fee);
      if (!Number.isFinite(fee) || fee <= 0 || fee > 1000) {
        return { ok: false, error: "invalid_ces_fee" as const };
      }
      patch.ces_fee = Math.round(fee * 10000) / 10000;
    }
    if (Object.keys(patch).length === 0) return { ok: false, error: "no_changes" as const };

    const { error } = await supabaseAdmin
      .from("app_settings")
      .update({ ...patch, updated_at: new Date().toISOString() })
      .eq("id", 1);

    if (error) return { ok: false, error: "db_error" as const };

    await supabaseAdmin
      .from("admin_audit")
      .insert({ role: data.role, action: `update:${Object.keys(patch).join(",")}`, ip });

    return { ok: true };
  });

// Public-safe: returns current settings (anyone can read, RLS allows SELECT).
// Exposed as a server fn so we can fetch from the iframe origin without CORS hassles.
export const getPublicSettings = createServerFn({ method: "GET" }).handler(async () => {
  const { data } = await supabaseAdmin
    .from("app_settings")
    .select("whatsapp, telegram, email, ces_fee")
    .eq("id", 1)
    .single();
  return {
    whatsapp: data?.whatsapp ?? "+3197010265771",
    telegram: data?.telegram ?? "ask2ces",
    email: data?.email ?? "support@2cesenergy.com",
    ces_fee: Number(data?.ces_fee ?? 1.65),
  };
});
