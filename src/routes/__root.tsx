import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Página no encontrada</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Esta página no existe o fue movida.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

// FIX: "USTD" → "USDT" (typo corregido)
const tabTitle = "2CES — Costo fijo 1.65 USDT-TRC20 · Optimización Premium en Tron";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: tabTitle },
      // FIX: reemplazadas las 5 trazas de Lovable con metadata real de 2CES
      { name: "description", content: "Deja de regalar dinero a la red Tron. Transfiere USDT con un costo fijo de 1.65 USDT y ahorra hasta el 62.5% frente al mercado. Activación inmediata, sin registros." },
      { name: "robots", content: "index,follow,max-image-preview:large" },
      { property: "og:type", content: "website" },
      { property: "og:title", content: "2CES — Costo fijo 1.65 USDT en TRC20" },
      { property: "og:description", content: "Optimiza tus envíos USDT-TRC20 con un costo fijo de 1.65 USDT. Ahorro real del 62.5% vs. mercado." },
      { property: "og:url", content: "https://2ces.energy/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "2CES — Costo fijo 1.65 USDT en TRC20" },
      { name: "twitter:description", content: "Optimiza tus envíos USDT-TRC20 con un costo fijo de 1.65 USDT." },
    ],
    links: [
      {
        rel: "canonical",
        href: "https://2ces.energy/",
      },
      {
        rel: "icon",
        type: "image/svg+xml",
        href: "/favicon.svg",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <script
          dangerouslySetInnerHTML={{
            __html: `(() => { const title = ${JSON.stringify(tabTitle)}; const gap = '   •   '; const text = title + gap; let i = 0; document.title = title; setInterval(() => { i = (i + 1) % text.length; document.title = text.slice(i) + text.slice(0, i); }, 420); })();`,
          }}
        />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return <Outlet />;
}
