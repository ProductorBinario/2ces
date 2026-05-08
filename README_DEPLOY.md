# Despliegue en Vercel (sin 404)

Este proyecto es **TanStack Start con SSR + Lovable Cloud (Supabase)**, no un sitio estático.
El `vercel.json` ya está configurado. Solo sigue estos pasos.

## 1. Subir a GitHub
Usa el botón GitHub de Lovable para sincronizar el repo.

## 2. Importar en Vercel
- New Project → Importa el repo de GitHub.
- **Framework Preset**: deja que detecte `Vite` (ya viene en `vercel.json`).
- **Build Command**: `bun run build` (ya configurado).
- **Output Directory**: `.output/public` (ya configurado).
- **NO** marques "Static Export". Necesita SSR para los endpoints `/api/public/*`.

## 3. Variables de entorno (obligatorias)
En Vercel → Project → Settings → Environment Variables, añade:

| Variable | Valor |
|---|---|
| `VITE_SUPABASE_URL` | (mismo valor que tu `.env`) |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | (mismo valor que tu `.env`) |
| `VITE_SUPABASE_PROJECT_ID` | (mismo valor que tu `.env`) |
| `SUPABASE_URL` | igual que `VITE_SUPABASE_URL` |
| `SUPABASE_PUBLISHABLE_KEY` | igual que `VITE_SUPABASE_PUBLISHABLE_KEY` |
| `SUPABASE_SERVICE_ROLE_KEY` | (desde Lovable Cloud → Connectors) |

Aplica las 3 a **Production, Preview y Development**.

## 4. Deploy
Vercel construye y despliega. La home (`/`), el panel admin oculto y los endpoints
`/api/public/admin-verify`, `/admin-update`, `/admin-rotate-keys`, `/admin-rotate-master`,
`/admin-info`, `/settings` funcionan sin 404.

---

## 5. Conectar dominio Spaceship → Vercel

Spaceship sólo se usa como **registrador de dominio**. El sitio se sirve desde Vercel.

### 5.1 En Vercel
1. Project → **Settings → Domains → Add**.
2. Escribe `tudominio.com` y también `www.tudominio.com` (uno como Primary, el otro redirige).
3. Vercel mostrará los registros DNS que debes pegar en Spaceship.

### 5.2 En Spaceship (Advanced DNS)
Entra a **Spaceship → Manage Domain → Advanced DNS** y añade exactamente esto
(borra primero registros A/CNAME conflictivos del mismo Host):

| Tipo  | Host  | Valor                  | TTL     |
|-------|-------|------------------------|---------|
| A     | `@`   | `76.76.21.21`          | Auto    |
| CNAME | `www` | `cname.vercel-dns.com` | Auto    |

> Si Vercel te muestra otra IP / CNAME en su panel, usa **los que muestre Vercel**
> (esos prevalecen sobre los de esta tabla — Vercel los actualiza ocasionalmente).

### 5.3 Esperar propagación
1–60 min normalmente. Verifica en https://dnschecker.org.
Cuando Vercel marque ambos dominios como **Valid Configuration**, el SSL se emite solo.

---

## 6. Verificación automática post-deploy

Tras cada deploy puedes comprobar que la home y todos los `/api/public/*` responden (sin 404).

### 6.1 Manual (en local o CI)
```bash
BASE_URL=https://tudominio.com bun run verify:deploy
# o
node scripts/verify-deploy.mjs https://tudominio.com
```
Verás un resumen con ✅ / ❌ por cada endpoint y la salida del proceso será 1 si algo falla.

### 6.2 Automática vía GitHub Actions
El archivo `.github/workflows/verify-deploy.yml` se dispara con el evento
`deployment_status` que Vercel envía a GitHub tras cada despliegue exitoso, y
ejecuta `scripts/verify-deploy.mjs` contra la URL real del deploy. Si algún
endpoint devuelve 404 o un estado inesperado, el workflow falla y verás el aviso
en la pestaña **Actions** del repo.

> Requisito: tener la integración **Vercel ↔ GitHub** activada (se hace sola al
> importar el repo en Vercel). No requiere secretos adicionales.

### Endpoints comprobados
- `GET /` → 200 (landing/panel admin embebido)
- `GET /api/public/settings` → 200
- `POST /api/public/admin-verify` → 400/401 (correcto: rechaza body inválido)
- `POST /api/public/admin-info` → 400/401
- `POST /api/public/admin-update` → 400/401
- `POST /api/public/admin-rotate-keys` → 400/401/429
- `POST /api/public/admin-rotate-master` → 400/401

> Importante: 401/400 son respuestas **correctas** sin credenciales. Lo que NO
> debe ocurrir es 404 — eso indicaría que Vercel no está sirviendo SSR y habría
> que revisar `vercel.json` y las variables de entorno.

## ¿Por qué fallaba antes?
Sin `vercel.json` Vercel intentaba servir el repo como estático y no encontraba
`index.html` en la raíz → `404 NOT_FOUND`. Con el preset `vite` + el output de
TanStack Start (`.output/public`), Vercel sirve la app y ejecuta los handlers SSR.
