import { createFileRoute } from "@tanstack/react-router";
import {
  clientIP,
  getAdminHashes,
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

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...cors },
  });

export const Route = createFileRoute("/api/public/admin-verify")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      POST: async ({ request }) => {
        const ip = clientIP(request);
        if (!rateLimit(ip)) return json({ ok: false, error: "rate_limited" }, 429);

        let body: { phrase?: unknown; role?: unknown; step?: unknown };
        try {
          body = await request.json();
        } catch {
          return json({ ok: false, error: "invalid_json" }, 400);
        }

        const phrase = typeof body.phrase === "string" ? body.phrase.trim() : "";
        const role = body.role;
        if (!phrase || phrase.length > 200) return json({ ok: false }, 400);
        if (role !== "master" && role !== "admin") return json({ ok: false }, 400);

        const h = sha(phrase);

        if (role === "master") {
          return json({ ok: hashEq(h, MASTER_HASH) });
        }

        const step = Number(body.step);
        if (!Number.isInteger(step) || step < 0 || step > 2) return json({ ok: false }, 400);
        const adminHashes = await getAdminHashes();
        return json({ ok: hashEq(h, adminHashes[step]) });
      },
    },
  },
});
