import { createFileRoute } from "@tanstack/react-router";
import landingHtml from "../assets/index.html?raw";
import landingStylesUrl from "../assets/styles.css?url";
import landingConfigUrl from "../assets/config.js?url";
// FIX CRÍTICO: priceService se importa como ?raw (código inline) en lugar de ?url
// Con ?url Vite NO emitía el archivo en el build → window.TWOCES_PRICE_SERVICE
// era undefined en producción → app.js crasheaba al arrancar → landing roto.
// Con ?raw el contenido se inyecta directamente en el <script> del iframe,
// garantizando ejecución antes que app.js en cualquier entorno (Vercel, CF Pages).
import landingPriceServiceRaw from "../assets/priceService.js?raw";
import landingAppUrl from "../assets/app.js?url";

const raw = (landingHtml as string)
  .replace('href="./styles.css"', `href="${landingStylesUrl}"`)
  .replace('src="./config.js"', `src="${landingConfigUrl}"`)
  // Sustituye el <script src> por un <script> inline con el contenido real
  .replace(
    '<script src="./priceService.js" defer></script>',
    `<script defer>${landingPriceServiceRaw}</script>`
  )
  .replace('src="./app.js"', `src="${landingAppUrl}"`);

const landingDocument: string = raw.includes("<base")
  ? raw
  : raw.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');

export const Route = createFileRoute("/")(({
  component: LandingFrame,
}));

function LandingFrame() {
  return (
    <iframe
      title="2CES Landing"
      srcDoc={landingDocument}
      className="fixed inset-0 h-dvh w-full border-0 bg-background"
    />
  );
}
