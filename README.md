# KiBi 🩷🩵

La agenda familiar de los peques en el móvil: qué tienen hoy, mañana y durante la semana, qué hay que llevar y qué tareas quedan pendientes. Se instala en la pantalla de inicio y manda avisos:

- a las **7:00** con lo de hoy
- a las **19:00** con lo de mañana

Solo se envía aviso los días en que hay algo especial (festivo, actividad, algo que llevar, una fecha límite).

El código no está ligado a ninguna familia: los peques, sus colores, el colegio y el horario salen de los datos. El plan para que la usen varias familias está en [`docs/PLANIFICACION.md`](docs/PLANIFICACION.md).

> **Privacidad:** este repositorio es público. No escribas aquí nombres, cursos, colegios ni datos de los peques. Todo eso va cifrado en `datos.cifrados.json`.

## Privacidad

La app es pública en GitHub Pages, pero los datos de los niños están **cifrados** en `datos.cifrados.json`. Sin el código familiar no se pueden leer. Cada móvil pide el código la primera vez.

## Instalar en el móvil

- **Android**: abre la app en Chrome → menú → «Instalar app».
- **iPhone**: abre la app en Safari → botón Compartir → «Añadir a pantalla de inicio». Abre KiBi desde el icono (los avisos solo funcionan así).

Después, en la app, pulsa **Activar avisos** y copia el código del móvil que aparece. Para añadirlo a la lista de envío:

```bash
CODIGO_FAMILIAR=... node scripts/suscribir.mjs "Móvil de casa" '<código del móvil>'
git add suscripciones.cifradas.json && git commit -m "Añadir móvil" && git push
```

La lista se guarda cifrada en `suscripciones.cifradas.json`. Al subirla, GitHub envía un aviso de prueba a todos los móviles.

## Secretos y variables del repositorio

| Nombre | Tipo | Qué es |
| --- | --- | --- |
| `CODIGO_FAMILIAR` | Secreto | El código que descifra los datos. También se usa para revisar los datos antes de publicar |
| `VAPID_PUBLIC_KEY` / `VAPID_PRIVATE_KEY` | Secreto | Claves para firmar los avisos push |
| `PUSH_SUBSCRIPTIONS` | Secreto | Opcional: más móviles en formato JSON (normalmente `[]`) |
| `VAPID_SUBJECT` | Secreto | Opcional: contacto para el servicio de push (`mailto:…`). Por defecto, la URL de la app |
| `AVISOS_PRIVADOS` | Variable | Opcional: `1` para que los avisos muestren solo la inicial de cada peque en la pantalla de bloqueo |

## Actualizar los datos

```bash
npm install
CODIGO_FAMILIAR=... npm run descifrar   # crea datos/eventos.json (no se sube)
# editar datos/eventos.json
npm run validar                         # revisa errores y fechas dudosas
CODIGO_FAMILIAR=... npm run cifrar      # actualiza datos.cifrados.json
npm test                                # pruebas con datos ficticios
```

Al hacer push a `main`, GitHub pasa las pruebas, revisa los datos cifrados y publica la app. Si hay errores en los datos, no se publica y la versión anterior sigue funcionando. Las dudas salen como avisos en la ejecución, sin mostrar el contenido.

Para probar un aviso: pestaña Actions → «Avisos diarios» → «Run workflow».

### Formato de `datos/eventos.json`

- `ninos`: `id` (minúsculas), `nombre`, `curso` y `color` opcional (`azul`, `rosa`, `verde`, `naranja`, `lila`). Si no hay color, se reparte por orden.
- `sinCole`: días sin clase, con `fecha` o con `desde`/`hasta`, y `motivo`.
- `semanal`: lo que se repite cada semana. `dia` va de 0 (domingo) a 6 (sábado). `soloConCole: true` hace que no salga en festivos.
- `eventos`: cosas puntuales, con `fecha`, `fechas` (lista) o `desde`/`hasta`, y `ninos` (lista de ids). `llevar` y `anual` son opcionales.
- `tareas`: cosas que hacer, con `limite` opcional.
- `duda` (opcional, en eventos, semanal y tareas): texto que explica qué hay que confirmar. La app lo muestra con ⚠️.

Fechas en formato `AAAA-MM-DD`. `npm run validar` comprueba el formato y avisa de fechas que no cuadran con el día de la semana del texto, eventos repetidos, eventos en días sin cole y fechas fuera del curso.

## Añadir información desde el móvil

Pulsa **＋ Añadir a la agenda** para crear un cumpleaños (con repetición anual opcional), tarea (con o sin fecha límite), extraescolar (días de la semana, inicio, final opcional y opción de solo días con cole) o evento puntual. Se puede elegir uno o varios peques e indicar hora, lugar, notas y qué llevar.

Las anotaciones se guardan **cifradas con el código familiar en el navegador de ese móvil**, separadas de la agenda original del repositorio. No se suben automáticamente ni forman parte de los avisos push de GitHub Actions. Borrar los datos del navegador elimina esta copia local.

En **Mis anotaciones** se pueden editar y eliminar entradas, exportar una copia `.kibi` cifrada e importarla en otro móvil con el mismo código familiar. La importación muestra cuántas entradas añade o actualiza y solicita confirmación antes de sustituir versiones del mismo identificador; conserva las demás. No transporta los estados de tareas hechas ni elimina en otros móviles lo que se haya eliminado en el primero. Guarda copias antes de cambiar de código familiar: el nuevo código no descifra las anotaciones creadas con el anterior.

La sincronización automática requiere un backend autenticado, todavía no configurado (ver el plan). El pegado inteligente de mensajes y la extracción de fotos/documentos tampoco forman parte de esta versión.

## Pruebas

Todas usan datos ficticios (`tests/fixtures/`), así que no hacen falta los datos privados:

```bash
npm test
```
