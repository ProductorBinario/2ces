**
 * scripts/build-static-index.mjs
 *
 * Post-build script para Vercel.
 *
 * Problema: TanStack Start con adaptador Cloudflare genera:
 *   dist/client/  → assets estáticos (JS, CSS, SVGs)  ← sin index.html
 *   dist/server/  → Cloudflare Worker (SSR)
 *
 * Vercel (preset "vite") espera un index.html en outputDirectory para
 * poder servir la SPA. Sin él, el rewrite /(.*) → /index.html devuelve 404.
 *
 * Este script:
 *  1. Lee el manifest de Vite (dist/server/.vite/manifest.json)
 *  2. Obtiene los nombres de archivo con hash para styles, config y app
 *  3. Lee src/assets/index.html (el HTML fuente de la landing)
 *  4. Sustituye las referencias relativas (./styles.css, ./config.js, etc.)
 *     por las URLs hasheadas reales + inyecta priceService inline
 *  5. Escribe el resultado en dist/client/index.html
 *
 * Resultado: Vercel sirve la landing correctamente como SPA estática.
 * Nota: los endpoints /api/public/* requieren SSR → usar Cloudflare Pages
 *       para el panel admin. La landing funciona íntegramente sin SSR.
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");

// ── 1. Leer manifest de Vite ────────────────────────────────────────────────
const manifestPath = resolve(root, "dist/server/.vite/manifest.json");
let manifest;
try {
  manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
} catch (e) {
  console.error("❌ No se encontró dist/server/.vite/manifest.json");
  console.error("   Asegúrate de haber ejecutado 'bun run build' antes.");
  process.exit(1);
}

// ── 2. Mapear fuentes a URLs hasheadas ──────────────────────────────────────
function findAsset(pattern) {
  for (const [key, value] of Object.entries(manifest)) {
    if (key.includes(pattern) && value.file) {
      return "/" + value.file; // e.g. /assets/config-BFbCZRPm.js
    }
  }
  return null;
}

const stylesUrl = findAsset("src/assets/styles.css");
const configUrl = findAsset("src/assets/config.js");
const appUrl    = findAsset("src/assets/app.js");

if (!stylesUrl || !configUrl || !appUrl) {
  console.error("❌ No se encontraron assets en el manifest:", { stylesUrl, configUrl, appUrl });
  console.error("   Contenido del manifest:", Object.keys(manifest));
  process.exit(1);
}

// ── 3. Leer HTML fuente y priceService ─────────────────────────────────────
const htmlSource     = resolve(root, "src/assets/index.html");
const priceServiceSrc = resolve(root, "src/assets/priceService.js");

let html;
let priceServiceContent;
try {
  html = readFileSync(htmlSource, "utf8");
} catch (e) {
  console.error("❌ No se encontró src/assets/index.html");
  process.exit(1);
}
try {
  priceServiceContent = readFileSync(priceServiceSrc, "utf8");
} catch (e) {
  console.error("❌ No se encontró src/assets/priceService.js");
  process.exit(1);
}

// ── 4. Sustituir referencias ────────────────────────────────────────────────
html = html
  // CSS de la landing
  .replace('href="./styles.css"', `href="${stylesUrl}"`)
  // config.js (define window.TWOCES_CONFIG)
  .replace('src="./config.js"', `src="${configUrl}"`)
  // priceService.js → inline (Vite no lo emite como archivo separado con ?url)
  .replace(
    '<script src="./priceService.js" defer></script>',
    `<script defer>${priceServiceContent}</script>`
  )
  // app.js (lógica principal)
  .replace('src="./app.js"', `src="${appUrl}"`);

// Garantizar <base href="/"> para rutas absolutas dentro del iframe
if (!html.includes("<base")) {
  html = html.replace(/<head(\s*[^>]*)>/i, '<head$1><base href="/" />');
}

// ── 5. Escribir dist/client/index.html ─────────────────────────────────────
const outPath = resolve(root, "dist/client/index.html");
writeFileSync(outPath, html);

console.log("✅ dist/client/index.html generado correctamente");
console.log("   styles :", stylesUrl);
console.log("   config :", configUrl);
console.log("   price  : (inline)");
console.log("   app    :", appUrl);
