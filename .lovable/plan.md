# Plan: ajustes puntuales sin tocar lo que ya funciona

Voy a aplicar únicamente los cambios indicados en `src/assets/landing.html`, manteniendo la estructura, copy, CTAs y lógica actual intactas salvo donde se menciona abajo.

## 1. WhatsApp con número exacto
- Cambiar la constante de contacto a:
  - `CONTACT.wa = '+3197010265771'`
- Mantener el helper actual `openChannel()` para que siga limpiando caracteres y abra:
  - `https://wa.me/3197010265771?...`
- No tocar Telegram (`ask2ces`) ni email (`support@2cesenergy.com`).

## 2. Botón flotante: solo logo limpio, sin texto
- Eliminar el texto visible `: esto es` del botón flotante.
- Reemplazar el badge textual `2CES` por el logo limpio en SVG (`/2ces-logo.svg` o versión limpia disponible), dentro de un botón circular/glass.
- Mantener su función: abrir WhatsApp con el mensaje predefinido.
- Mantener `aria-label` para accesibilidad.

## 3. Payments: legibilidad y márgenes
- Corregir el espacio entre el texto, la línea de eficiencia y la gráfica de barras.
- Hacer las filas de barras más respirables en móvil:
  - etiquetas con ancho suficiente,
  - números con `tabular-nums`,
  - unidades pequeñas alineadas,
  - evitar que valores y barras se toquen.
- Cambiar la unidad visible del precio TRX de `USD` a `USDT`, como pediste.
- Mantener la lógica de actualización en vivo tal como está: valor TRX consultado y renderizado desde `MarketState`.

## 4. Background del body con logo limpio visible
- Usar el logo limpio como marca de agua del fondo para que se aprecien mejor sus líneas y colores.
- Ajustar tamaño, opacidad y mezcla por tema para que se vea elegante sin competir con el contenido.
- Mantener el fondo fijo al hacer scroll.

## 5. Tarjetas en modo claro con transparencia tipo modo oscuro
- Cambiar las variables de modo claro (`--surface`, `--surface-2`, `--glass`) a valores translúcidos, no blancos sólidos.
- Mantener contraste suficiente para legibilidad y accesibilidad.
- No alterar el modo oscuro.

## 6. Banda superior glass en hero y scroll
- Rehacer la banda superior del hero como una barra glass fija/sticky armoniosa con:
  - logo limpio completo 2CES,
  - slogan: `Optimización en USDT-TRC20`,
  - botón idioma,
  - botón claro/oscuro.
- Ubicarla en la parte superior derecha/extendida del hero de forma responsive.
- En scroll, mantenerla visible con efecto glass para que el contenido pase por debajo y siga siendo entendible.
- Hacer los toggles con fondo casi transparente, apenas visible, y estados hover/focus sutiles.
- No cambiar textos principales, secciones ni layout general fuera de esta banda.

## 7. Pruebas UX/UI, conexión y seguridad
Después de implementar, verificaré en preview:
- móvil cercano al viewport actual (~407 px), tablet y desktop;
- que `Payments` no tenga números tocándose ni desbordes;
- que el botón flotante abre WhatsApp con el número correcto;
- que CTAs principales, calculadora, WhatsApp, Telegram, email, idioma y tema siguen respondiendo;
- que enlaces externos usan apertura segura y mensajes codificados;
- consola sin errores visibles.

## Cómo controlar versiones y pedirme usar cosas de versiones pasadas

### En Lovable
- Usa **History / Historial** para ver versiones anteriores y restaurar si hace falta.
  - Desktop: botón `+` abajo izquierda → `History`, o icono de reloj.
  - Móvil: cambia a Preview → icono de reloj abajo izquierda o menú `...`.
- Si quieres recuperar algo de una versión pasada, dime:
  - qué elemento exacto quieres recuperar,
  - de qué momento aproximado,
  - qué partes NO debo tocar.

Ejemplo:
```text
Recupera el estilo del hero de la versión anterior a la última edición, pero conserva el número de WhatsApp actual, la lógica de precio en vivo y el formulario actual. Solo cambia el layout visual del hero.
```

### Prompt recomendado para próximos ajustes quirúrgicos
Cópialo al final de cada petición cuando quieras evitar cambios innecesarios:

```text
IMPORTANTE: Haz solo el ajuste indicado. No cambies copy, estructura, colores globales, lógica JS, contactos, SEO, responsive ni componentes que ya funcionan, salvo que sea estrictamente necesario para este ajuste. Mantén multilenguaje ES/EN, modo claro/oscuro, seguridad de enlaces, accesibilidad, UX/UI responsive y pruebas básicas de botones. Si detectas algo relacionado pero no imprescindible, avísame antes de tocarlo.
```

### Formato ideal de petición
```text
Sección exacta: Payments del hero.
Cambio: aumentar separación entre gráfica y números en móvil.
No tocar: copy, botones, WhatsApp, calculadora, formulario, SEO, colores globales.
Prueba: verificar en 407px y desktop.
```

Esto reduce créditos porque evita refactors grandes y me permite hacer cambios puntuales, eficientes y comprobables.