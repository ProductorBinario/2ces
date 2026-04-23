

# Plan: Reescritura integral de copy + dashboard hero + correcciones funcionales

## Resumen
Reescribir todo el copy de la landing con la nueva estructura (7 secciones), trasladar logo/toggles a una banda glass superior derecha en el hero, sustituir el panel hero por el "Dashboard de Eficiencia 2CES" con gráfica comparativa en vivo, centralizar el coste fijo en una sola constante, y conectar todos los botones a los canales reales con mensajes predefinidos.

---

## 1. Constante única `CES_FEE = 1.65`

En `src/assets/landing.html`, declarar al inicio del `<script>`:

```js
const CES_FEE = 1.65;          // único punto de cambio
const CONTACT = {
  wa: '+31970102657',          // sin "71" final que parece typo — confirmar
  tg: 'soporte2cesenergy',
  email: 'support@2cesenergy.com'
};
```

Todos los nodos que muestren 1.65 usarán `data-bind="ces-fee"` y se rellenarán desde `renderMarket()`. Igualmente cualquier cálculo (44k, 16.5k, 330k, 62.5%) se deriva de `CES_FEE` y `mktRate` — nada hardcoded en HTML.

**Nota sobre el WhatsApp**: el número que diste tiene 12 dígitos (+31 9701026 5771) lo cual es atípico para NL. Lo dejaré como `+31970102657` por defecto y te aviso para confirmar.

---

## 2. Header → banda glass en el hero (esquina superior derecha)

- Eliminar el header fijo actual (`.hdr`).
- Dentro de `.sec-hero`, añadir un contenedor flotante `.hero-bar`:
  - Posición: `position: absolute; top: 16px; right: 16px;`
  - Estilo glass: `background: rgba(10,20,40,0.60); backdrop-filter: blur(14px) saturate(140%); border: 1px solid rgba(255,255,255,.08); border-radius: 999px; padding: 8px 12px;`
  - Contenido: toggle idioma (ES/EN) + toggle tema (☀/🌙).
- El logo "2CES" se mueve al hero como elemento principal arriba a la izquierda del badge.
- Eliminar la insignia "2CES" duplicada que estaba en el panel — sustituida por el logo real.

Resultado: hero limpio, sin header fijo, banda glass discreta arriba-derecha que no compite con el contenido.

---

## 3. Hero — nuevo copy + Dashboard de Eficiencia

**Lado izquierdo (texto):**
- Cintillo: "Optimización Premium en USDT-TRC20"
- H1: "Deja de regalar tu dinero a la red: transfiere USDT con un costo fijo de **1.65** y máxima eficiencia."
- Subtítulo: "Mientras el mercado te cobra hasta 4.4 USDT por movimiento, nuestra infraestructura te permite operar con un ahorro real del **62.5%**. Si no estás optimizando, estás perdiendo beneficios en cada transacción."
- CTA primario: "Hablar con un asesor ahora" → WhatsApp con mensaje predefinido #1
- CTA secundario: "Ver mi ahorro proyectado" → WhatsApp con mensaje predefinido #2
- Micro-trust: "Activación inmediata · Sin registros · Costos 100% predecibles"

**Lado derecho (Dashboard de Eficiencia):**

Card con bordes redondeados, soft shadow, dos badges flotantes (USDT esquina sup-izq, TRON esquina inf-der), y en el centro el logo 2CES como "puente" entre ambos.

```text
┌─[USDT]──────────────────────┐
│  Payments         [toggle●] │
│                             │
│  Efficiency                 │
│  ┌─────────────────────┐    │
│  │ ▓▓▓▓ 4.40 (máx)     │    │
│  │ ▓▓▓  3.32 (medio·live) │ │
│  │ ▓    1.65 (2CES)    │    │
│  └─────────────────────┘    │
│  ─── línea ascendente SVG ──│
│         [logo 2CES]         │
│                  ──[TRON]───┘
│  · Estrategia confiable y
│    alineada a tu operación
```

- Gráfica de **barras horizontales SVG** (sin librería) comparando: Mercado Máx (4.40), Mercado Medio (live, `data-bind="mkt-rate"`), 2CES (`data-bind="ces-fee"`).
- Encima, una mini línea ascendente decorativa (Efficiency).
- Toggle visual decorativo (siempre on) reforzando "control".
- Live note: "Coste medio calculado en vivo · puede variar."
- Footer: "Estrategia confiable y alineada a tu operación actual."

---

## 4. Sección "El problema"
- H2: "¿Sabes cuánto dinero estás dejando sobre la mesa?"
- 3 tarjetas con `data-bind`: Mercado alto (4.40 fijo), Mercado promedio (live), 2CES (1.65 desde constante).
- Frase impacto: "Con 2CES, si el mercado sube tú no gastas más; si el mercado baja, tú sigues pagando menos. Es matemática pura, no una promesa."

## 5. Calculadora — "Bofetada de realidad"
- H2: "Tu ineficiencia actual en cifras"
- Input: nº transacciones (default 10000).
- Output: Gasto Mercado Máx (`tx*4.4`), Gasto 2CES (`tx*CES_FEE`), Pérdida (`tx*(4.4-CES_FEE)`).
- Pregunta psicológica final.
- CTA: "Calcular mi ahorro real" → WhatsApp con mensaje #2 que incluye el nº de transacciones seleccionado.

## 6. Proceso "Cero fricción" (3 pasos numerados)
1. Sin cuentas ni registros
2. Sin descargas peligrosas
3. Asignación inmediata

Mantener estilo numerado secuencial con conector visual.

## 7. Confianza
- H2: "Experiencia real para operaciones de alto nivel"
- 2 bloques: Soporte Humano Real · Rapidez Garantizada (2-5s).

## 8. FAQ (7 preguntas del copy)
Acordeón accesible con las preguntas/respuestas exactas suministradas.

## 9. Cierre + Contacto
- H2: "El ahorro es real y es ahora."
- Formulario con **solo textarea** (mensaje) + 3 botones que envían ese mismo mensaje por:
  - **WhatsApp** → `https://wa.me/{wa}?text={mensaje}`
  - **Telegram** → `https://t.me/{tg}?text={mensaje}` (con prefill via deep link)
  - **Email** → `mailto:{email}?subject=...&body={mensaje}`
- Si textarea vacío → usa mensaje predefinido genérico del canal.
- Las 3 tarjetas en azul (tonos distintos), iconos circulares con halo.

## 10. Botón flotante WhatsApp
- Reemplazar icono teléfono por **mini-logo 2CES** (mismo badge "2CES" en gradiente azul que usamos en payments).
- Mantener glass + borde azul + tooltip.

## 11. Footer
"2CES — Seguridad, eficiencia y confianza en cada transacción. © 2026 Todos los derechos reservados."

---

## 12. Mensajes predefinidos (i18n ES/EN)

```js
const MSG = {
  hero1:  'Hola, he visto que puedo fijar mis costos de USDT en 1.65...',
  hero2:  (n) => `Hola, realizo aproximadamente ${n} transacciones al mes...`,
  waCTA:  'Hola 2CES, quiero activar la optimización de 1.65 USDT...',
  tgCTA:  'Buenas, busco optimizar mis envíos de USDT-TRC20...',
  trial:  'Hola, somos una empresa con alto volumen operativo...',
  emailSubject: (empresa) => `Consulta: Optimización de costos operativos USDT — ${empresa||''}`,
  emailBody: 'Hola equipo de 2CES, estamos interesados...'
};
```

Helper `openChannel(canal, mensaje)` que construye la URL con `encodeURIComponent` y `rel="noopener"`.

---

## 13. Auto-detección idioma + tema

Al cargar:
```js
// Idioma
const userLang = (navigator.language||'es').slice(0,2);
const lang = ['es','en'].includes(userLang) ? userLang : 'es';
// Tema
const prefersDark = matchMedia('(prefers-color-scheme: dark)').matches;
document.documentElement.classList.toggle('dark', prefersDark);
// Listener para cambios de SO en vivo
matchMedia('(prefers-color-scheme: dark)').addEventListener('change', e => {
  if (!localStorage.getItem('theme')) document.documentElement.classList.toggle('dark', e.matches);
});
```

Los toggles del hero-bar sobreescriben la auto-detección y guardan en `localStorage`.

---

## 14. Auditoría final
- Todos los botones con `aria-label` + handler verificado.
- `rel="noopener noreferrer"` en externos.
- `encodeURIComponent` en mensajes.
- Anti-silabeo en h1/h2/h3/p (`hyphens:none; word-break:keep-all`).
- Responsive: hero apila en <900px, dashboard se mantiene legible en 375px.
- SEO: title/meta/og actualizados con copy nuevo, JSON-LD `Service` con `priceSpecification: 1.65 USDT`.
- Sin código muerto (eliminar `.hdr`, viejo panel hero, gráfica antigua si queda).

---

## Archivos afectados
- `src/assets/landing.html` — refactor mayor (HTML, CSS, JS).
- `src/routes/index.tsx` — sin cambios.

---

## Pregunta antes de implementar
**WhatsApp**: el número `+31 97010265771` tiene 12 dígitos (NL usa 11 con +31). Voy a usar `+31970102657` (11 dígitos). Si es otro, dímelo en una línea y lo cambio en la constante `CONTACT.wa` — un solo punto de edición.

