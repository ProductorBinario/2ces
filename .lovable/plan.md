

## Problema

La vista previa muestra **404** en `/` porque `src/routes/index.tsx` redirige a `/landing.html` usando `redirect({ href: "/landing.html" })`. En el entorno de preview de Lovable, este redirect del lado servidor no resuelve correctamente el archivo estático de `public/`, generando el 404.

Además, aunque funcionara, esta arquitectura es subóptima: TanStack Start está pensado para servir rutas React con SSR, no para redirigir a un HTML estático en `public/`.

## Solución (2 opciones)

### Opción A — Servir el HTML estático directamente (rápido, mínimo cambio)

Reemplazar el redirect por un loader que lea `public/landing.html` y lo devuelva como respuesta HTML desde la ruta `/`. Así la vista previa carga la landing en la raíz sin redirección.

Pasos:
1. Modificar `src/routes/index.tsx` para usar un `loader` que devuelva el contenido de `landing.html` con `Content-Type: text/html`, o más simple: usar un `<iframe>` a `/landing.html` a pantalla completa como fallback.
2. Verificar que `public/landing.html` siga accesible directamente en `/landing.html`.

### Opción B — Migrar la landing a un componente React (recomendado a largo plazo)

Convertir el contenido de `public/landing.html` en un componente React dentro de `src/routes/index.tsx`, aprovechando SSR, SEO por ruta, y el sistema de estilos del proyecto. Es más trabajo pero alinea con la arquitectura TanStack Start descrita en las guías del proyecto (rutas separadas, `head()` por ruta, etc.).

## Recomendación

Aplicar **Opción A** ahora para desbloquear la vista previa de inmediato (1 archivo modificado, sin riesgo). La Opción B se puede planear como mejora posterior si se desea SSR/SEO real por sección.

## Detalle técnico (Opción A)

Cambio único en `src/routes/index.tsx`:

```tsx
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  component: LandingFrame,
});

function LandingFrame() {
  return (
    <iframe
      src="/landing.html"
      title="2CES Landing"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        border: "none",
      }}
    />
  );
}
```

Esto elimina el redirect problemático, monta la landing en `/` y mantiene `public/landing.html` intacto con toda la funcionalidad (validación, ES/EN, WhatsApp/Telegram, accesibilidad).

## Archivos afectados

- `src/routes/index.tsx` — reemplazar redirect por componente con iframe a `/landing.html`.

No se tocan: `public/landing.html`, `src/router.tsx`, `src/routes/__root.tsx`.

