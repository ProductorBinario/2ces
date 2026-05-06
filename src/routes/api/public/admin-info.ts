import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import {
  ADMIN_HASHES_DEFAULT,
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

// Master-only: estado de rotación de las claves Admin + historial reciente.
export const Route = createFileRoute("/api/public/admin-info")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const ip = clientIP(request);
        if (!rateLimit(ip)) return json({ ok: false, error: "rate_limited" }, 429);

        let body: { masterPhrase?: unknown };
        try { body = await request.json(); } catch { return json({ ok: false, error: "invalid_json" }, 400); }

        const master = typeof body.masterPhrase === "string" ? body.masterPhrase.trim() : "";
        const masterHash = await getMasterHash();
        if (!master || !hashEq(sha(master), masterHash)) {
          return json({ ok: false, error: "unauthorized" }, 401);
        }

        const { data: s } = await supabaseAdmin
          .from("app_settings")
          .select("admin_hash_1,admin_hash_2,admin_hash_3,master_hash")
          .eq("id", 1)
          .maybeSingle();

        const isRotated = (val: string | null | undefined, idx: number) => {
          if (!val) return false;
          return val !== ADMIN_HASHES_DEFAULT[idx];
        };
        const rotated = [
          isRotated(s?.admin_hash_1, 0),
          isRotated(s?.admin_hash_2, 1),
          isRotated(s?.admin_hash_3, 2),
        ];
        const masterRotated = !!(s as { master_hash?: string } | null)?.master_hash;

        const { data: hist } = await supabaseAdmin
          .from("admin_audit")
          .select("role,action,ip,created_at")
          .order("created_at", { ascending: false })
          .limit(10);

        return json({ ok: true, rotated, masterRotated, history: hist ?? [] });
      },
    },
  },
});
