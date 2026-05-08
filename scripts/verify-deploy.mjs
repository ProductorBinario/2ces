#!/usr/bin/env node
/**
 * Post-deploy verification.
 * Comprueba que la home y los endpoints /api/public/* respondan (sin 404).
 *
 * Uso:
 *   BASE_URL=https://tu-dominio.com node scripts/verify-deploy.mjs
 *   # o pasando la URL como primer argumento
 *   node scripts/verify-deploy.mjs https://tu-dominio.com
 *
 * Sale con código 1 si alguna comprobación falla (útil en CI / Vercel).
 */

const BASE = (process.argv[2] || process.env.BASE_URL || process.env.VERCEL_URL || "").replace(/\/$/, "");
if (!BASE) {
  console.error("❌ Falta BASE_URL. Ej: BASE_URL=https://midominio.com node scripts/verify-deploy.mjs");
  process.exit(1);
}
const ROOT = BASE.startsWith("http") ? BASE : `https://${BASE}`;

// [path, method, expectedStatuses, body?]
const CHECKS = [
  ["/", "GET", [200]],
  ["/api/public/settings", "GET", [200]],
  // Estos endpoints requieren JSON; con body inválido devuelven 400/401, NO 404.
  ["/api/public/admin-verify", "POST", [400, 401], '{"phrase":"x","role":"admin","step":0}'],
  ["/api/public/admin-info", "POST", [400, 401], "{}"],
  ["/api/public/admin-update", "POST", [400, 401], "{}"],
  ["/api/public/admin-rotate-keys", "POST", [400, 401, 429], "{}"],
  ["/api/public/admin-rotate-master", "POST", [400, 401], "{}"],
];

let failed = 0;
console.log(`🔎 Verificando deploy en ${ROOT}\n`);

for (const [path, method, expected, body] of CHECKS) {
  const url = ROOT + path;
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ?? undefined,
    });
    const ok = expected.includes(res.status);
    const tag = ok ? "✅" : "❌";
    console.log(`${tag} ${method.padEnd(4)} ${path.padEnd(34)} → ${res.status} (esperado: ${expected.join("/")})`);
    if (!ok) failed++;
  } catch (e) {
    console.log(`❌ ${method.padEnd(4)} ${path.padEnd(34)} → ERROR ${e.message}`);
    failed++;
  }
}

// Comprobación adicional: la home debe servir el bundle de la landing (assets JS)
try {
  const html = await fetch(ROOT + "/").then((r) => r.text());
  const hasApp = /assets\/app|2CES|TWOCES_CONFIG|srcDoc/i.test(html);
  console.log(`${hasApp ? "✅" : "❌"} Home contiene la landing/panel admin embebido`);
  if (!hasApp) failed++;
} catch (e) {
  console.log(`❌ Home no se pudo cargar: ${e.message}`);
  failed++;
}

console.log(`\n${failed === 0 ? "🎉 Todas las comprobaciones OK" : `⚠️  ${failed} comprobación(es) fallaron`}`);
process.exit(failed === 0 ? 0 : 1);
