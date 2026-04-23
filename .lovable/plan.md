

# Plan: Auditoría integral + correcciones, propagación de precio en vivo y armonización azul

## 1. Propagación del precio TRX en vivo (consistencia total)

Hoy `fetchTickerPrice()` consulta CoinGecko y actualiza solo 2-3 nodos (panel email, hero TRX, hero 2CES). Voy a:

- Crear un **estado global único** `MarketState = { trxUSD, mktRate, ces: 1.6, ts }`.
- Crear una función única `renderMarket()` que recorre **todos** los nodos con `data-bind="trx-usd|mkt-rate|ces-rate|saving-vs-mkt|saving-vs-max"` y los actualiza de golpe (panel hero, panel ahorro, calculadora, sección "El problema", payments).
- Marcar con `data-bind` los costos máximo (4,4), promedio (3,3 → ahora dinámico = `mktRate`) y "con 2CES" (1,6) en **todas** las secciones donde aparecen, para que cambien al unísono.
- Añadir una **nota única reutilizable** (clase `.live-note`) en cada bloque que muestre valor de mercado: *"Valor calculado en vivo · puede variar y presentar un pequeño desfase"* (ES) / *"Live market value · may vary with a small delay"* (EN), con clave i18n `liveNote`.
- Mantener fallback si CoinGecko falla (ya existe) y mostrar discreto "—" + nota mientras carga.

## 2. Gráfica única en Payments (hero)

- **Eliminar** la mini-gráfica "Comparativa de ahorro" del panel hero derecho y cualquier otra ocurrencia fuera del hero.
- **Mover** la gráfica al bloque payments del hero (panel derecho), conectada al `MarketState` para que la curva se redibuje cuando cambia `mktRate` (interactividad real).
- La curva muestra `mktRate` vs `1,6 CES` con un SVG ligero (sin librería) que se regenera en `renderMarket()`.

## 3. Icono "2CES" en lugar de "$" en costo optimizado

- Reemplazar el SVG `$` del bloque `COSTO OPTIMIZADO` por un mini-badge cuadrado con texto **"2CES"** estilizado (mismo gradiente azul `var(--grad)`, tipografía PT Sans Narrow bold).

## 4. Armonización azul de botones de contacto (WhatsApp = Telegram = Email)

- Tres tarjetas `.contact-card` con la **misma estructura visual** (icono circular con halo, label, descripción).
- Paleta única en azul, distintos tonos:
  - Email → `var(--b400)` (azul medio)
  - Telegram → `var(--b500)` (azul corporativo)
  - WhatsApp → `var(--c500)` (cian-azul)
- Eliminar verde de WhatsApp por completo (icono, borde, hover, halo, botón flotante `#wa-float`).
- Botón flotante `#wa-float` adopta el mismo estilo glass + borde azul + hover gradiente azul que las otras CTAs.

## 5. Hero restaurado + responsive sin silabeo

- Restaurar layout hero anterior (grid 1fr / panel derecho), padding-top equilibrado para que el contenido empiece **debajo** del header sin solape:
  - `padding-top: calc(var(--hdr-h) + clamp(40px, 8vw, 80px))` (volver al valor original, no 16vw que hoy lo empuja demasiado).
- Reforzar reglas anti-silabeo ya presentes (`hyphens:none; word-break:keep-all` en h1/h2/h3) y añadirlas a `.hero-sub`, `.lead`, `.card-lbl`.
- Breakpoints revisados: ≥1024 (PC 3 col), 640-1023 (tablet 2 col), <640 (móvil 1 col, hero apilado).

## 6. Formulario simplificado

- **Eliminar** campos Nombre y Email del formulario de contacto.
- Dejar solo `<textarea>` Mensaje (obligatorio, validación aria-live ya existente reutilizada).
- Título del formulario: **"Vamos a optimizar costos"** / **"Let's optimize costs"** (claves i18n `formTitle`).
- Botón submit: **"Empezar a optimizar"** / **"Start optimizing"** (clave `formBtn`).
- Eliminar el texto "te abrimos tu cliente de email" y reemplazar por: *"Tu mensaje se envía por un canal seguro"* / *"Your message is sent through a secure channel"*.
- El `submit` arma un `mailto:` en background pero sin mensaje intrusivo; mostrar toast/confirmación: *"Mensaje listo para enviar — gracias por confiar en 2CES"*.

## 7. Sección "Operativo en 5 minutos" enumerada

- Reformatear los 3 pasos en lista **numerada secuencial** (`1 → 2 → 3 → 4 → 5` si hace falta dividir más fino) con conector visual entre pasos (línea/flecha) que comunique dependencia secuencial.
- Cada paso: número grande azul + título + 1 línea descriptiva.

## 8. Auditoría general (línea por línea) y limpieza

- **Eliminar** código muerto: `step-n`, `step-ico` (display:none sin uso), referencias huérfanas.
- **Consolidar** event listeners duplicados (un solo `DOMContentLoaded`).
- **Verificar** todos los botones: header CTA, hero CTAs, calc CTA, perfiles, FAQ, contacto, flotante, sticky CTA, theme toggle, lang toggle → cada uno con handler funcional + `aria-label`.
- **i18n**: barrer cada string nuevo y agregarlo a los objetos `es` y `en`. Aplicar `data-i18n` para cambios automáticos al togglear idioma.
- **Tema claro/oscuro**: revisar que cada nuevo color use variables CSS (`--t1/--t2/--t3/--bdr/--c500/--b500`) — nada hardcoded.
- **SEO**: añadir `<meta name="keywords">`, `og:image`, `twitter:card`, JSON-LD `Service` con `priceSpecification`.
- **Performance**: `loading="lazy"` en SVGs decorativos, `defer` en script, reducir animaciones simultáneas en móvil con `@media (prefers-reduced-motion)`.
- **Seguridad**: `rel="noopener noreferrer"` en todos los enlaces externos (WhatsApp/Telegram), validación de longitud en textarea (max 1000), sanitización del `mailto:` con `encodeURIComponent`.

## 9. Limpieza de archivos

- Borrar `public/landing.html` (duplicado obsoleto). El único fuente de verdad será `src/assets/landing.html`, consumido vía `?raw` por `src/routes/index.tsx` (que ya está correcto).

## Diagrama de flujo del precio en vivo

```text
CoinGecko API ──► fetchTickerPrice() ──► MarketState
                                            │
                          ┌─────────────────┼─────────────────┐
                          ▼                 ▼                 ▼
                  Hero Payments     Panel Ahorro       Sección Problema
                  (TRX + 2CES        (62,5% / 50%       (4,4 / 3,3 / 1,6)
                   + curva SVG)      recalculados)
                          │
                          ▼
                  Calculadora (Mercado promedio dinámico)
```

## Archivos afectados

- `src/assets/landing.html` — refactor mayor (CSS azul, JS MarketState + renderMarket, HTML formulario, contactos, hero, pasos, gráfica).
- `public/landing.html` — **eliminar** (duplicado).
- `src/routes/index.tsx` — sin cambios (ya consume el HTML correctamente vía `?raw`).

## Cómo pedirme ajustes futuros sin romper lo que funciona

Para que mis cambios sean quirúrgicos y no toquen lo demás, formula tus pedidos así:

1. **Indica la sección exacta** (id o nombre visible):
   - ✅ *"En la sección `#contacto`, cambia el color del icono de Telegram a `--b500`"*
   - ❌ *"Cambia los colores"*

2. **Di explícitamente qué NO tocar**:
   - ✅ *"Ajusta solo el padding del hero en móvil. NO toques el panel de ahorro ni los textos."*

3. **Un cambio por petición** (o lista numerada con scope claro):
   - ✅ *"1) Cambia título del formulario. 2) Botón submit dice X. Nada más."*

4. **Si reportas un bug, da contexto medible**:
   - ✅ *"En móvil 375px el badge del hero se sale 4px a la derecha"*
   - ❌ *"Está mal en móvil"*

5. **Pide preview antes de cambios grandes**:
   - ✅ *"Antes de tocar el JS del precio en vivo, explícame qué vas a modificar"*

6. **Usa Visual Edits para retoques visuales pequeños** (textos, colores de un elemento concreto, fuentes): es gratis y no consume créditos. Yo intervengo cuando hay lógica, estructura o múltiples elementos.

