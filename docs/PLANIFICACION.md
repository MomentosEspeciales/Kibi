# KiBi 🩷🩵 — Prompt para la sesión de planificación

> Copia todo este documento como primer mensaje de una sesión nueva. Pide al asistente que actúe como un equipo multidisciplinar y que, antes de proponer código, revise el repositorio `MomentosEspeciales/Kibi` y haga las preguntas que necesite.

---

## 1. Qué te pido

Actúa como un **equipo multidisciplinar** que planifica la siguiente versión de KiBi, la app familiar de Gabi y Kike para organizar el colegio y las actividades de sus hijos. Cada rol aporta su punto de vista, señala riesgos y propone opciones con su coste:

| Rol | Qué aporta |
| --- | --- |
| Producto (con la familia como usuaria) | Problemas reales, prioridades, qué se considera «hecho» |
| UX/UI | Flujos en el móvil, accesibilidad, que lo use alguien con prisa por la mañana |
| Arquitectura y backend | Dónde viven los datos, sincronización, coste (idealmente 0 €) |
| Datos e IA | Extracción automática de circulares (PDF, ZIP, imágenes) y su fiabilidad |
| Seguridad y privacidad | Datos de menores, cifrado, RGPD, credenciales del cole |
| QA | Cómo probar sin usar datos reales de los niños |
| DevOps | GitHub Actions, Pages, avisos push, despliegues |

**Esto no es un diseño cerrado.** Lo que está hecho funciona, pero se construyó rápido. Cuestiona cualquier decisión si hay una alternativa mejor.

**Entregables de la sesión:**
1. Diagnóstico del estado actual (qué funciona, qué es frágil, qué falta).
2. Arquitectura objetivo, con una única fuente de verdad para los datos.
3. Diseño del proceso semanal de ingestión de circulares (automático, con revisión humana).
4. Lista de mejoras priorizada (impacto / esfuerzo), agrupada por fases.
5. Riesgos y decisiones que deben tomar Gabi y Kike.
6. Plan de pruebas con datos sintéticos.

---

## 2. Contexto de la familia

- **Gabi** (la que gestiona) y **Kike** (su pareja). Viven en El Masnou (Barcelona). Idioma de la app: español. Las circulares del cole llegan en catalán.
- **Daniel**: 1ºB de Primaria. Tutora: Marta Valiente. Educación Física los viernes. Piscina con el cole algunos viernes de marzo a mayo. **Piscina extraescolar cada jueves a las 18:30**, fuera del cole.
- **Laia Luna**: I3B de Infantil («la clase de los cangrejos»).
- **Colegio**: Escolàpies El Masnou (Fundació Escolàpies). Horario 9:00–13:00 y 15:00–17:00. Curso del 8/9/2026 al 21/6/2027.

---

## 3. De dónde sale la información

### Educamos (intranet del colegio)
- URL familias: `https://escolapieslainmaculadaelmasnou-escolapias.educamos.com/Home/IndexPadres`
- Requiere **sesión iniciada en el navegador**. No hay API pública conocida.
- Hay un selector por hijo. En «Espacio de <hijo>» → «Circulares» aparece una tabla (fecha y asunto). Hay que poner «Nº registros/Pág.» en «Mostrar todos».
- Cada circular es un enlace a `/Comunicacion/Circulares/DescargarAdjuntos?CircularId=<guid>` que devuelve:
  - un **PDF** con texto (la mayoría, en catalán), o
  - un **PDF que es solo imagen** (por ejemplo, el cartel de Halloween o las cuotas), o
  - un **ZIP** con varios PDF (por ejemplo, los menús o el programa del Conservatori del Liceu).
- Muchas circulares son comunes a los dos hijos y algunas son específicas (prefijos `PRI`, `INF`, `1r`, `I3B`; `TE` es para todo el colegio).
- Volumen: unas 24 circulares de Daniel y 22 de Laia entre septiembre y octubre; unas 30 distintas.

### Lo que se ha hecho a mano
Se leyó cada PDF en el navegador con pdf.js, se renderizaron los que eran imagen y se descomprimieron los ZIP con JSZip. Después se extrajo de cada circular: de quién es, información relevante, fechas y acciones de la familia.

### Otras fuentes posibles (sin explorar)
- ¿Envía Educamos un correo por cada circular nueva? Si es así, el Gmail de Gabi podría ser la entrada del proceso.
- La app móvil de Educamos (notificaciones).
- Mensajes de WhatsApp del grupo de clase. En la app hay un «pegado inteligente» pendiente.

---

## 4. Estado actual del sistema

### 4.1 Repositorio `MomentosEspeciales/Kibi` (público)

App web instalable (PWA) publicada en **https://momentosespeciales.github.io/Kibi/**.

| Archivo | Para qué |
| --- | --- |
| `index.html`, `styles.css` | La app: vista Hoy / Mañana / Semana, tarjeta por niño, pendientes, avisos, anotaciones personales |
| `logica.js` | Qué tiene cada niño un día concreto. Se comparte entre el navegador y Node |
| `cripto.js` | Cifrado PBKDF2 (210 000 iteraciones) + AES-GCM con el **código familiar** |
| `agenda.js` | Validación de las anotaciones personales y cómo se mezclan con la agenda del cole |
| `datos.cifrados.json` | **La agenda del cole, cifrada.** Es lo que lee la app |
| `datos/eventos.json` | La misma agenda en claro. **No se sube** (`.gitignore`) |
| `suscripciones.cifradas.json` | Móviles suscritos a los avisos push, cifrados. Todavía no existe porque nadie se ha suscrito |
| `sw.js` | Service worker: caché sin conexión, recepción de push y apertura al tocar el aviso |
| `config.js` | Clave pública VAPID |
| `scripts/cifrar.mjs`, `descifrar.mjs` | Pasar de `datos/eventos.json` a `datos.cifrados.json` y al revés |
| `scripts/suscribir.mjs` | Añadir un móvil a la lista de avisos |
| `scripts/avisar.mjs` | Calcula el resumen del día y lo envía con `web-push` |
| `scripts/probar.mjs`, `tests/agenda.test.cjs` | Pruebas (las de agenda usan datos sintéticos) |
| `.github/workflows/publicar.yml` | Publica en Pages en cada push a `main` (con prueba previa) |
| `.github/workflows/avisos.yml` | Avisos diarios. También envía uno de prueba al cambiar las suscripciones |

**Secretos del repositorio** (ya creados por Gabi): `CODIGO_FAMILIAR`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` y `PUSH_SUBSCRIPTIONS` (`[]`). El código familiar no está en este documento a propósito.

**Modelo de datos (`datos/eventos.json`):**
- `curso` (inicio y fin), `horario` (normal y días especiales), `ninos` (id, nombre, curso, tutora)
- `sinCole`: festivos y vacaciones (`fecha`, o `desde`/`hasta`, y `motivo`)
- `semanal`: lo que se repite (`nino`, `dia` 0–6, `hora`, `llevar`, `desde`/`hasta`, `soloConCole`)
- `eventos`: cosas puntuales (`fecha`, `fechas[]` o `desde`/`hasta`; `ninos[]`, `hora`, `detalle`, `llevar`, `anual`)
- `tareas`: cosas que hacer (`ninos[]`, `titulo`, `detalle`, `limite` opcional)

**Avisos push:**
- Un cron de GitHub Actions se lanza a las 5, 6, 17 y 18 UTC. El script solo envía cuando en Madrid son las 7:00 (lo de hoy) o las 19:00 (lo de mañana), así cubre el horario de invierno y el de verano.
- Solo se envía si hay algo especial: un festivo, una actividad, algo que llevar o una tarea que vence.
- Para suscribir un móvil: se instala la app, se pulsa «Activar avisos», se copia el código del móvil y alguien con el repositorio ejecuta `suscribir.mjs` y hace push. Es manual.
- En iPhone los avisos solo funcionan con la app instalada en la pantalla de inicio (iOS 16.4 o posterior).

**Anotaciones personales** (añadidas por Gabi): cumpleaños (con repetición anual), tareas, extraescolares y eventos creados desde el móvil.
- Se guardan cifradas en el `localStorage` de ese móvil.
- **No se sincronizan** entre móviles; hay que exportar e importar un archivo `.kibi` a mano.
- **No entran en los avisos push**, porque GitHub Actions no las ve.

### 4.2 Lo que hay fuera de la app (los mismos datos, duplicados)

| Dónde | Qué | Cómo se actualiza |
| --- | --- | --- |
| Google Calendar de Gabi | Eventos «Cole · …» (Daniel), (Laia Luna) o (niños), con Kike invitado y recordatorios 1 y 2 días antes. Más «Piscina Daniel (extraescolar)» cada jueves a las 18:30 | Creados por el asistente; nunca se borran automáticamente |
| Google Drive, carpeta «Niños» | «00 · Resumen general», «Daniel · Resumen del curso» y «Laia Luna · Resumen del curso» (Google Docs), y subcarpetas «Circulares PDF» **vacías** | Los Docs se recrean enteros (no se editan). Los PDF están solo en un `niños.zip` en el ordenador de Gabi |
| Claude Docs | «Circulares escolares — Daniel y Laia Luna»: pendientes, calendario y tablas por circular | Lo edita el asistente |
| Tarea programada de Claude | «Revisión semanal circulares niños», lunes 9:30 | Ver la sección 5 |

**Problema clave: hoy no hay una única fuente de verdad.** La misma información vive en cinco sitios (app, Calendar, Drive, Claude Docs y la memoria del asistente) y se puede desincronizar.

---

## 5. El proceso semanal actual (lo que hace la tarea de los lunes)

1. Abrir Educamos en Chrome con la sesión de Gabi. Si la sesión ha caducado, parar y avisar: **el asistente nunca escribe contraseñas**.
2. Para cada hijo, listar las circulares publicadas desde la última revisión.
3. Leer cada circular (PDF con texto, PDF que es imagen o ZIP) y extraer: de quién es, información relevante, fechas y acciones de la familia.
4. Actualizar el documento de Claude Docs, los resúmenes de Drive y Google Calendar (sin duplicar eventos).
5. Enviar a Gabi un resumen breve.

**Limitaciones conocidas de este proceso:**
- La tarea quedó configurada para ejecutarse **en la nube, sin acceso al ordenador ni a Chrome**, así que no puede abrir Educamos. Gabi tendría que activar «Requerir este ordenador» en la app de escritorio, y aun así haría falta el ordenador encendido y Chrome con la sesión de Educamos abierta.
- **Todavía no actualiza KiBi** (`datos/eventos.json` → `datos.cifrados.json` → push). Tendría que hacerlo, y sería el paso más importante.
- La extracción la hace un modelo sin revisión humana antes de publicar. Ya hubo un error: la piscina con el cole se apuntó en jueves cuando en 2027 cae en viernes, y hubo que corregirlo.
- Las circulares a veces traen datos dudosos (una fiesta del «sábado 30 de mayo» de 2027, que es domingo). Hace falta un mecanismo para marcar dudas.
- El asistente no puede crear repositorios, secretos ni configurar Pages o Actions por API: eso lo hace Gabi a mano.

---

## 6. Ideas de mejora (abiertas, para debatir)

**Datos y arquitectura**
- Que `datos/eventos.json` cifrado sea la **única fuente de verdad**, y que de ahí se generen Calendar, Drive y los avisos.
- Un backend ligero y gratuito (Cloudflare Workers + KV/D1, Supabase, Firebase…) para:
  - sincronizar las anotaciones personales entre móviles y que entren en los avisos;
  - suscribir móviles a los avisos con un toque, sin copiar códigos;
  - recibir circulares nuevas.
- Publicar un calendario ICS privado (con URL secreta) generado desde los datos, en vez de crear eventos uno a uno.

**Ingestión de circulares**
- Partir del correo de aviso de Educamos (si existe) en vez de navegar por la intranet.
- Un flujo con revisión humana:
  1. extracción automática;
  2. propuesta de cambios como Pull Request (o pantalla de «revisar y aprobar» en la app);
  3. Gabi aprueba y se publica.
- Guardar cada circular original (cifrada) con un enlace desde el evento, para poder consultarla.
- Clasificar por niño según el prefijo (`PRI`, `INF`, `1r`, `I3B`, `TE`) y por el contenido.
- Detectar inconsistencias: fecha y día de la semana que no cuadran, eventos duplicados, cambios respecto a una circular anterior.

**Producto y UX**
- Que entrar sea muy rápido: hoy se pide el código familiar la primera vez en cada móvil.
- Avisos más útiles: «mañana llevar…», recordatorio de la fecha límite de una tarea, y avisos en el momento cuando llega una circular urgente.
- Que Kike pueda marcar tareas como hechas y que Gabi lo vea (hoy las tareas hechas son locales de cada móvil).
- Menú del comedor del día (llega en ZIP mensual).
- Contactos útiles del cole (secretaría, comedor, tutoras).

**Privacidad y seguridad**
- Revisar si el cifrado actual basta: el repositorio es público, solo hay un código familiar compartido y no se puede revocar el acceso de un móvil.
- Política sobre las credenciales de Educamos: ¿se pueden automatizar de forma segura y conforme a las condiciones de uso?
- Minimizar los datos personales en los avisos: se ven en la pantalla de bloqueo.

---

## 7. Restricciones

- **Coste:** 0 € o casi. Sin servidores de pago salvo que el beneficio sea claro.
- **Privacidad:** son datos de menores. Nada en claro en sitios públicos.
- **Credenciales:** el asistente no escribe contraseñas ni claves en formularios ni crea cuentas. Eso lo hace Gabi.
- **Usuarios:** dos adultos con prisa y móviles distintos (al menos uno puede ser iPhone).
- **Idioma:** la app en español; las circulares llegan en catalán.
- **Mantenimiento:** que funcione semanas sin tocarlo y que, cuando falle, avise claramente de qué ha fallado.

## 8. Preguntas para Gabi y Kike (que el equipo debe hacer al principio)

1. ¿Qué móviles usáis (iPhone o Android)? ¿Queréis avisos los dos?
2. ¿Llega un correo cuando hay una circular nueva en Educamos?
3. ¿Queréis aprobar cada cambio antes de que llegue a la app, o preferís que sea automático y avise de las dudas?
4. ¿Seguimos con Google Calendar, Drive y Claude Docs, o KiBi pasa a ser el único sitio?
5. ¿Aceptáis un backend gratuito de terceros (Cloudflare o Supabase) para sincronizar?
6. ¿Qué más queréis en KiBi (otras actividades, médicos, cumpleaños de amigos, menús)?
