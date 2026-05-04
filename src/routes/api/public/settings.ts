import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

const cors = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

export const Route = createFileRoute("/api/public/settings")({
  server: {
    handlers: {
      OPTIONS: async () => new Response(null, { status: 204, headers: cors }),
      GET: async () => {
        const { data } = await supabaseAdmin
          .from("app_settings")
          .select(
            "whatsapp, telegram, email, ces_fee, msg_wa, msg_tg, msg_email_subject, msg_email_body, msg_hero1, msg_hero2",
          )
          .eq("id", 1)
          .single();

        return new Response(
          JSON.stringify({
            whatsapp: data?.whatsapp ?? "+3197010265771",
            telegram: data?.telegram ?? "ask2ces",
            email: data?.email ?? "support@2cesenergy.com",
            ces_fee: Number(data?.ces_fee ?? 1.65),
            msg_wa: data?.msg_wa ?? "",
            msg_tg: data?.msg_tg ?? "",
            msg_email_subject: data?.msg_email_subject ?? "",
            msg_email_body: data?.msg_email_body ?? "",
            msg_hero1: data?.msg_hero1 ?? "",
            msg_hero2: data?.msg_hero2 ?? "",
          }),
          {
            status: 200,
            headers: {
              "Content-Type": "application/json",
              "Cache-Control": "public, max-age=15",
              ...cors,
            },
          },
        );
      },
    },
  },
});
