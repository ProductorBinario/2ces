import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "2CES — Optimiza tus comisiones USDT en TRON | 1,6 USDT fijo" },
      {
        name: "description",
        content:
          "2CES reduce cada transacción USDT-TRC20 a 1,6 USDT. Ahorra hasta 62% sin apps ni contratos. Verificable en blockchain TRON.",
      },
      { property: "og:title", content: "2CES — 1,6 USDT por transacción en TRON" },
      {
        property: "og:description",
        content: "Ahorra hasta 62% en comisiones USDT. Sin registros. Verificable en blockchain.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
});

function Index() {
  // Redirige a la landing estática (HTML+CSS+JS autocontenido y 100% funcional)
  useEffect(() => {
    if (typeof window !== "undefined" && window.location.pathname === "/") {
      window.location.replace("/landing.html");
    }
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "#0a1628",
        color: "#e6f0ff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      <noscript>
        <a href="/landing.html" style={{ color: "#25A4D3" }}>
          Ir a 2CES →
        </a>
      </noscript>
      <p>Cargando 2CES…</p>
    </div>
  );
}
