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
`/api/public/admin-verify`, `/admin-update`, `/admin-rotate-keys`, `/admin-info`,
`/settings` funcionan sin 404.

## ¿Por qué fallaba antes?
Sin `vercel.json` Vercel intentaba servir el repo como estático y no encontraba
`index.html` en la raíz → `404 NOT_FOUND`. Con el preset `vite` + el output de
TanStack Start (`.output/public`), Vercel sirve la app y ejecuta los handlers SSR.
