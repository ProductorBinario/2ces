Plan de ajuste quirúrgico, manteniendo la coherencia del chat y sin cambiar copy, diseño global, colores, contactos, SEO ni estructura que ya funciona.

1. Estabilizar la carga de recursos de la landing
- Mantener la estructura actual separada:
  - `landing.html`
  - `styles.css`
  - `app.js`
  - `priceService.js`
  - `config.js`
  - `worker.js`
- Revisar la carga desde `src/routes/index.tsx` para que CSS y JS se resuelvan de forma estable dentro del iframe.
- No añadir dependencias ni cambiar arquitectura fuera de lo imprescindible.
- Revisar el error de carga dinámica del preview/build y corregir solo si está relacionado con la estabilidad de arranque.

2. Unificar las fórmulas de mercado y calculadora
- Centralizar el cálculo en `priceService.js` para que todo use exactamente:
  - Mercado Máximo = `13.3745 TRX × precio TRX/USD`
  - Mercado Medio = `10.0745 TRX × precio TRX/USD`
- Asegurar que Payments, Mercado alto/promedio y calculadora consuman los mismos valores calculados.
- Mantener el redondeo visual actual a 2 decimales para Mercado Máximo/Medio y 4 decimales para TRX, salvo inconsistencias que haya que corregir.

3. Optimizar actualización en tiempo real sin cambiar el flujo
- Conservar caché local para mostrar datos rápido.
- Mejorar la función de carga de precio TRX para evitar llamadas duplicadas simultáneas y mantener respuesta rápida.
- Mantener timeout/fallback para que la UI no quede bloqueada si la API tarda o falla.
- Re-renderizar textos, barras y calculadora en cuanto cambie el precio.

4. Validar selector de idioma ES/EN
- Revisar todos los `data-i18n`, `data-i18n-html` y `data-i18n-attr` existentes.
- Confirmar que los textos dinámicos dentro de HTML traducido conservan sus `data-bind` después de cambiar idioma.
- Ajustar solo etiquetas necesarias para que Mercado Máximo/Medio, calculadora, botones, FAQ y contacto cambien correctamente entre español e inglés.
- Mantener el modo claro/oscuro y el botón de idioma tal como están.

5. Ajustar responsividad solo si hay desbordes reales
- Revisar PC, tablet y móvil, especialmente el viewport móvil actual aproximado `407×681`.
- Ajustar solo estilos puntuales si algún texto, barra, tarjeta, botón o valor numérico se desborda.
- No cambiar colores, identidad visual ni layout general si ya se ve correcto.

6. Verificar botones y enlaces
- Probar acciones principales:
  - WhatsApp hero
  - WhatsApp ahorro/calculadora
  - Formulario WhatsApp
  - Telegram
  - Email
  - Toggle idioma
  - Toggle tema
  - Botón flotante WhatsApp
- Mantener seguridad de enlaces externos con `noopener,noreferrer`.
- No modificar contactos ni mensajes salvo que un enlace esté técnicamente roto.

7. Pruebas finales
- Ejecutar build para confirmar estabilidad.
- Ejecutar validación rápida del cálculo cliente simulando cambios de precio TRX y confirmando que:
  - Mercado Máximo cambia.
  - Mercado Medio cambia.
  - El ahorro porcentual cambia.
  - Barras y textos quedan consistentes.
- Revisar rendimiento básico/carga de recursos y responsividad sin introducir cambios visuales innecesarios.

Al implementar, tocaré únicamente los archivos necesarios, principalmente `src/assets/priceService.js`, `src/assets/app.js`, `src/assets/styles.css` y, si hace falta por estabilidad de carga, `src/routes/index.tsx`. No cambiaré nada más que no sea estrictamente necesario para estos puntos.