import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  MASTER_HASH,
  clientIP,
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

// Rotación de las 3 frases del Admin. Sólo el Master puede ejecutarla.
// Las frases nunca se almacenan: solo se guarda su SHA-256.
export const Route = createFileRoute("/api/public/admin-rotate-keys")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const ip = clientIP(request);
        if (!rateLimit(ip)) return json({ ok: false, error: "rate_limited" }, 429);

        let body: { masterPhrase?: unknown; phrases?: unknown };
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }

        const master = typeof body.masterPhrase === "string" ? body.masterPhrase.trim() : "";
        if (!master || !hashEq(sha(master), MASTER_HASH)) {
          return json({ ok: false, error: "unauthorized" }, 401);
        }

        if (!Array.isArray(body.phrases) || body.phrases.length !== 3) {
          return json({ ok: false, error: "invalid_phrases" }, 400);
        }
        const phrases = (body.phrases as unknown[]).map((p) =>
          typeof p === "string" ? p.trim() : "",
        );
        for (const p of phrases) {
          if (p.length < 3 || p.length > 64) return json({ ok: false, error: "invalid_phrases" }, 400);
        }
        // Evitar duplicados entre los 3 pasos.
        const set = new Set(phrases);
        if (set.size !== 3) return json({ ok: false, error: "duplicate_phrases" }, 400);

        const [h1, h2, h3] = phrases.map(sha);

        const { error } = await supabaseAdmin
          .from("app_settings")
          .update({
            admin_hash_1: h1,
            admin_hash_2: h2,
            admin_hash_3: h3,
            updated_at: new Date().toISOString(),
          })
          .eq("id", 1);

        if (error) return json({ ok: false, error: "db_error" }, 500);

        await supabaseAdmin.from("admin_audit").insert({
          role: "master",
          action: "rotate_admin_keys",
          ip,
        });

        return json({ ok: true });
      },
    },
  },
});
