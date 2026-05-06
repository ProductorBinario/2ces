import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  clientIP,
  getMasterHash,
  hashEq,
  rateLimit,
  sha,
} from "@/server/admin-core.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json", ...cors } });

// Rotación de la frase Master. Solo el Master actual puede ejecutarla.
export const Route = createFileRoute("/api/public/admin-rotate-master")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const ip = clientIP(request);
        if (!rateLimit(ip)) return json({ ok: false, error: "rate_limited" }, 429);

        let body: { masterPhrase?: unknown; newPhrase?: unknown };
        try { body = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }

        const cur = typeof body.masterPhrase === "string" ? body.masterPhrase.trim() : "";
        const next = typeof body.newPhrase === "string" ? body.newPhrase.trim() : "";

        const masterHash = await getMasterHash();
        if (!cur || !hashEq(sha(cur), masterHash)) {
          return json({ ok: false, error: "unauthorized" }, 401);
        }
        if (next.length < 3 || next.length > 64) {
          return json({ ok: false, error: "invalid_phrase" }, 400);
        }
        if (next === cur) {
          return json({ ok: false, error: "same_phrase" }, 400);
        }

        const { error } = await supabaseAdmin
          .from("app_settings")
          .update({ master_hash: sha(next), updated_at: new Date().toISOString() })
          .eq("id", 1);
        if (error) return json({ ok: false, error: "db_error" }, 500);

        await supabaseAdmin.from("admin_audit").insert({
          role: "master",
          action: "rotate_master_key",
          ip,
        });

        return json({ ok: true });
      },
    },
  },
});
