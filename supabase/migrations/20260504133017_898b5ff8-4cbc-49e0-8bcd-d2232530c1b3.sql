ALTER TABLE public.app_settings
  ADD COLUMN IF NOT EXISTS msg_wa text NOT NULL DEFAULT 'Hola 2CES, quiero activar la optimización de 1.65 USDT en mi wallet ahora mismo. He leído que no necesito registros ni descargas, ¿cuáles son los siguientes pasos?',
  ADD COLUMN IF NOT EXISTS msg_tg text NOT NULL DEFAULT 'Buenas, busco optimizar mis envíos de USDT-TRC20 con su infraestructura. Quiero empezar a operar sin las fricciones de la red Tron. ¿Cómo procedemos?',
  ADD COLUMN IF NOT EXISTS msg_email_subject text NOT NULL DEFAULT 'Consulta: Optimización de costos operativos USDT',
  ADD COLUMN IF NOT EXISTS msg_email_body text NOT NULL DEFAULT 'Hola equipo de 2CES,

Estamos interesados en su solución de ahorro frente a costos máximos de mercado. Por favor, envíenos información técnica para integrar su optimización a nuestra operativa.

Gracias.',
  ADD COLUMN IF NOT EXISTS msg_hero1 text NOT NULL DEFAULT 'Hola, he visto que puedo fijar mis costos de USDT en 1.65. Me gustaría saber cómo aplicarlo a mi operación actual para dejar de pagar de más. ¿Me ayudan?',
  ADD COLUMN IF NOT EXISTS msg_hero2 text NOT NULL DEFAULT 'Hola, realizo aproximadamente {n} transacciones al mes y quiero confirmar cuánto dinero real voy a ahorrar con 2CES. ¿Podemos revisar mis números?';