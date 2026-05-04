import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  MASTER_HASH,
  clientIP,
  getAdminHashes,
  hashEq,
  rateLimit,
  sha,
} from "@/server/admin-core.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

type Settings = {
  whatsapp?: unknown;
  telegram?: unknown;
  email?: unknown;
  ces_fee?: unknown;
  msg_wa?: unknown;
  msg_tg?: unknown;
  msg_email_subject?: unknown;
  msg_email_body?: unknown;
  msg_hero1?: unknown;
  msg_hero2?: unknown;
};

const MSG_MAX = 2000;
const SUBJ_MAX = 200;
function validMsg(v: unknown, max: number): string | null {
  if (typeof v !== "string") return null;
  const t = v.trim();
  if (!t || t.length > max) return null;
  return t;
}

export const Route = createFileRoute("/api/public/admin-update")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const ip = clientIP(request);
        if (!rateLimit(ip)) return json({ ok: false, error: "rate_limited" }, 429);

        let body: { role?: unknown; phrases?: unknown; settings?: unknown };
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }

        const role = body.role;
        if (role !== "master" && role !== "admin") return json({ ok: false }, 400);
        if (!Array.isArray(body.phrases)) return json({ ok: false }, 400);
        const phrases = (body.phrases as unknown[]).map((p) =>
          typeof p === "string" ? p.trim() : "",
        );

        // Re-verify auth server-side, never trust the client.
        if (role === "master") {
          if (phrases.length !== 1 || !hashEq(sha(phrases[0]), MASTER_HASH)) {
            return json({ ok: false, error: "unauthorized" }, 401);
          }
        } else {
          if (phrases.length !== 3) return json({ ok: false, error: "unauthorized" }, 401);
          const adminHashes = await getAdminHashes();
          for (let i = 0; i < 3; i++) {
            if (!hashEq(sha(phrases[i]), adminHashes[i])) {
              return json({ ok: false, error: "unauthorized" }, 401);
            }
          }
        }

        const s = (body.settings ?? {}) as Settings;
        const patch: Record<string, string | number> = {};

        if (typeof s.whatsapp === "string") {
          const wa = s.whatsapp.trim();
          if (!/^\+?[0-9\s\-]{6,20}$/.test(wa))
            return json({ ok: false, error: "invalid_whatsapp" }, 400);
          patch.whatsapp = wa;
        }
        if (typeof s.telegram === "string") {
          const tg = s.telegram.trim().replace(/^@/, "");
          if (!/^[a-zA-Z0-9_]{3,64}$/.test(tg))
            return json({ ok: false, error: "invalid_telegram" }, 400);
          patch.telegram = tg;
        }
        if (typeof s.email === "string") {
          const em = s.email.trim();
          if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(em) || em.length > 200)
            return json({ ok: false, error: "invalid_email" }, 400);
          patch.email = em;
        }
        if (s.ces_fee !== undefined && s.ces_fee !== null && s.ces_fee !== "") {
          const fee = Number(s.ces_fee);
          if (!Number.isFinite(fee) || fee <= 0 || fee > 1000)
            return json({ ok: false, error: "invalid_ces_fee" }, 400);
          patch.ces_fee = Math.round(fee * 10000) / 10000;
        }

        const msgFields: Array<[keyof Settings, string, number]> = [
          ["msg_wa", "msg_wa", MSG_MAX],
          ["msg_tg", "msg_tg", MSG_MAX],
          ["msg_email_subject", "msg_email_subject", SUBJ_MAX],
          ["msg_email_body", "msg_email_body", MSG_MAX],
          ["msg_hero1", "msg_hero1", MSG_MAX],
          ["msg_hero2", "msg_hero2", MSG_MAX],
        ];
        for (const [key, col, max] of msgFields) {
          const raw = s[key];
          if (raw === undefined) continue;
          const v = validMsg(raw, max);
          if (v === null) return json({ ok: false, error: `invalid_${col}` }, 400);
          patch[col] = v;
        }

        if (Object.keys(patch).length === 0)
          return json({ ok: false, error: "no_changes" }, 400);

        const { error } = await supabaseAdmin
          .from("app_settings")
          .update({ ...patch, updated_at: new Date().toISOString() })
          .eq("id", 1);

        if (error) return json({ ok: false, error: "db_error" }, 500);

        await supabaseAdmin.from("admin_audit").insert({
          role: role as string,
          action: `update:${Object.keys(patch).join(",")}`,
          ip,
        });

        return json({ ok: true });
      },
    },
  },
});
